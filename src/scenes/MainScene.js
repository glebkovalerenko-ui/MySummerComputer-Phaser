import Phaser from 'phaser';
import InputManager from '../utils/InputManager.js';
import LocalizationManager from '../utils/LocalizationManager.js';
import DataManager from '../systems/DataManager.js';
import UIManager from '../ui/UIManager.js';
import DragManager from '../utils/DragManager.js';
import PCCase from '../game/PCCase.js';
import InstalledPart from '../game/InstalledPart.js'; // Новый класс
import VFXManager from '../systems/VFXManager.js';     // Новый менеджер

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // 1. Инициализация систем
        this.inputManager = new InputManager(this);
        this.dataManager = new DataManager(this);
        this.locManager = new LocalizationManager(this, 'ru');
        this.vfxManager = new VFXManager(this); // Инициализируем VFX

        // 2. Инициализация DragManager
        this.dragManager = new DragManager(this);

        // 3. Инициализация UI
        this.uiManager = new UIManager(this.dataManager, this.locManager, this.dragManager);

        // 4. Создание окружения (Стол и ПК)
        this.createEnvironment();
        
        console.log('MainScene: Ready');
    }

    createEnvironment() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.add.text(cx, 30, 'WORKBENCH', { 
            fontSize: '24px', 
            color: '#888' 
        }).setOrigin(0.5);

        // Создаем корпус ПК по центру экрана
        this.pcCase = new PCCase(this, cx, cy);
    }

    /**
     * Попытка создать предмет в мире игры.
     * @param {Object} itemData - Данные предмета
     * @param {number} worldX - Мировая координата X курсора
     * @param {number} worldY - Мировая координата Y курсора
     * @returns {boolean} - true если предмет успешно размещен
     */
    spawnItem(itemData, worldX, worldY) {
        // 1. Проверяем зону (SnapZone)
        const zone = this.pcCase.tryPlaceItem(worldX, worldY, itemData.type);

        if (zone) {
            // УСПЕХ: Зона найдена и свободна
            zone.setOccupied(true);

            // 2. Вычисляем координаты
            // Нам нужно знать, где предмет находится СЕЙЧАС (под мышкой), но в локальных координатах корпуса
            const startLocal = this.pcCase.pointToContainer({ x: worldX, y: worldY });
            
            // 3. Создаем "Установленную деталь" (Контейнер с винтами)
            const part = new InstalledPart(
                this, 
                startLocal.x, 
                startLocal.y, 
                itemData, 
                zone.width, 
                zone.height
            );

            // Добавляем деталь в корпус
            this.pcCase.add(part);
            
            // Убедимся, что деталь отрисовывается поверх зон, но под проводами (если будут)
            this.pcCase.bringToTop(part);

            // 4. JUICE: Анимация "Snap" (Примагничивание)
            this.tweens.add({
                targets: part,
                x: zone.x,
                y: zone.y,
                duration: 300,       // Быстро, но заметно
                ease: 'Back.out',    // Эффект пружины (перелет и возврат)
                onComplete: () => {
                    // А. Звук (пока лог)
                    console.log('CLACK!');
                    
                    // Б. Частицы и тряска
                    // Нужно перевести локальные координаты корпуса в мировые для эмиттера частиц
                    const worldTarget = this.pcCase.getBounds(); 
                    // Простой хак координат, так как scale=1. В сложном проекте использовать matrix world transform.
                    const fxX = this.pcCase.x + zone.x;
                    const fxY = this.pcCase.y + zone.y;
                    
                    this.vfxManager.playSnapEffect(fxX, fxY, itemData.color);

                    // В. Появляются винты (Micro-interaction)
                    part.showScrews();
                }
            });

            console.log(`Item ${itemData.id} snapping to ${itemData.type} zone.`);
            return true;
        } else {
            console.log('Cannot place item here.');
            return false;
        }
    }

    shutdown() {
        if (this.uiManager) {
            this.uiManager.destroy();
        }
    }
}
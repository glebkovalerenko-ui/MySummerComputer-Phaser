import Phaser from 'phaser';
import InputManager from '../utils/InputManager.js';
import LocalizationManager from '../utils/LocalizationManager.js';
import DataManager from '../systems/DataManager.js';
import UIManager from '../ui/UIManager.js';
import DragManager from '../utils/DragManager.js';
import PCCase from '../game/PCCase.js'; // Импорт нового класса

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // 1. Инициализация систем
        this.inputManager = new InputManager(this);
        this.dataManager = new DataManager(this);
        this.locManager = new LocalizationManager(this, 'ru');

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
     * @param {number} x - Мировая координата X курсора
     * @param {number} y - Мировая координата Y курсора
     * @returns {boolean} - true если предмет успешно размещен
     */
    spawnItem(itemData, x, y) {
        // Спрашиваем у корпуса, можно ли сюда поставить этот предмет
        const zone = this.pcCase.tryPlaceItem(x, y, itemData.type);

        if (zone) {
            // УСПЕХ: Зона найдена и свободна
            
            // 1. Создаем спрайт
            const sprite = this.add.sprite(0, 0, 'placeholder_item');
            sprite.setTint(parseInt(itemData.color.replace('#', '0x'), 16));
            sprite.setData('itemId', itemData.id);
            sprite.setData('type', itemData.type);

            // Адаптируем размер спрайта под размер зоны (опционально, для красоты)
            sprite.setDisplaySize(zone.width * 0.9, zone.height * 0.9);

            // 2. Добавляем спрайт ВНУТРЬ контейнера pcCase
            // Теперь его координаты должны быть локальными относительно pcCase
            this.pcCase.add(sprite);

            // 3. Ставим спрайт ровно в центр зоны
            sprite.x = zone.x;
            sprite.y = zone.y;

            // 4. Помечаем зону как занятую
            zone.setOccupied(true);

            // 5. Интерактивность (чтобы можно было потом снять)
            // Пока просто заглушка, логику снятия сделаем позже
            sprite.setInteractive(); 

            // Эффект появления
            this.tweens.add({
                targets: sprite,
                scale: { from: 0, to: sprite.scale }, // scale уже изменен setDisplaySize
                duration: 200,
                ease: 'Back.out'
            });

            console.log(`Item ${itemData.id} snapped to ${itemData.type} zone.`);
            return true;
        } else {
            // НЕУДАЧА: Игрок отпустил мышь мимо слота
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
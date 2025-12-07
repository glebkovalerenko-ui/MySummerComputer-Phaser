import Phaser from 'phaser';
import InputManager from '../utils/InputManager.js';
import LocalizationManager from '../utils/LocalizationManager.js';
import DataManager from '../systems/DataManager.js';
import UIManager from '../ui/UIManager.js';
import DragManager from '../utils/DragManager.js';
import PCCase from '../game/PCCase.js';
import InstalledPart from '../game/InstalledPart.js';
import VFXManager from '../systems/VFXManager.js';
import GameStore from '../state/GameStore.js';
import PCLogic from '../systems/PCLogic.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // 1. Загрузка сохранения
        GameStore.loadGame();

        // 2. Инициализация систем
        this.inputManager = new InputManager(this);
        this.dataManager = new DataManager(this);
        this.locManager = new LocalizationManager(this, 'ru'); // Можно сохранять язык тоже в Store
        this.vfxManager = new VFXManager(this);

        this.dragManager = new DragManager(this);
        this.uiManager = new UIManager(this.dataManager, this.locManager, this.dragManager);

        // 3. Окружение
        this.createEnvironment();
        
        // 4. Восстановление состояния сцены (визуализация установленных деталей)
        this.restoreState();

        // 5. Подписка на событие кнопки Power (из PCCase)
        this.events.on('pc-power-on', this.handlePowerOn, this);

        console.log('MainScene: Ready');
    }

    createEnvironment() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;

        this.add.text(cx, 30, 'WORKBENCH', { 
            fontSize: '24px', 
            color: '#888' 
        }).setOrigin(0.5);

        this.pcCase = new PCCase(this, cx, cy);
        
        // Текст для вывода статуса (BIOS)
        this.monitorText = this.add.text(cx, cy - 300, '', {
            fontFamily: 'monospace',
            fontSize: '20px',
            backgroundColor: '#000000',
            padding: { x: 10, y: 10 }
        }).setOrigin(0.5).setAlpha(0);
    }

    /**
     * Восстанавливает детали из Store в PCCase
     */
    restoreState() {
        const installedParts = GameStore.getInstalledParts();
        
        installedParts.forEach(entry => {
            const item = this.dataManager.getItemById(entry.itemId);
            if (item) {
                // Ищем зону для этого типа напрямую
                const zone = this.pcCase.getZoneByType(item.type);
                if (zone) {
                    this.placePartEntity(item, zone, true); // true = immediate install
                }
            }
        });
    }

    /**
     * Логика Drag&Drop спавна
     */
    spawnItem(itemData, worldX, worldY) {
        const zone = this.pcCase.tryPlaceItem(worldX, worldY, itemData.type);

        if (zone) {
            // Установка через геймплей
            this.placePartEntity(itemData, zone, false);
            
            // Сохраняем изменение в Store
            GameStore.installPart(itemData.id, itemData.type);
            
            return true;
        }
        return false;
    }

    /**
     * Внутренний метод создания сущности детали
     * @param {Object} itemData 
     * @param {SnapZone} zone 
     * @param {boolean} isRestoring - Если true, ставит мгновенно (для Save/Load)
     */
    placePartEntity(itemData, zone, isRestoring) {
        zone.setOccupied(true);

        // Создаем деталь локально в координатах зоны (зона уже локальна для pcCase)
        const part = new InstalledPart(
            this,
            zone.x,
            zone.y,
            itemData,
            zone.width,
            zone.height
        );

        this.pcCase.add(part);
        this.pcCase.bringToTop(part);

        if (isRestoring) {
            // Мгновенная установка (Load)
            part.instantInstall();
        } else {
            // Анимация установки (Gameplay)
            // Начальная позиция (эффект прилета)
            // Слегка сместим, чтобы был эффект "вставки"
            part.y -= 20; 
            part.alpha = 0;

            this.tweens.add({
                targets: part,
                y: zone.y,
                alpha: 1,
                duration: 300,
                ease: 'Back.out',
                onComplete: () => {
                    const fxX = this.pcCase.x + zone.x;
                    const fxY = this.pcCase.y + zone.y;
                    this.vfxManager.playSnapEffect(fxX, fxY, itemData.color);
                    part.showScrews();
                }
            });
        }
    }

    handlePowerOn() {
        // Запуск логики проверки
        const result = PCLogic.checkBuild(this.pcCase);
        
        if (result.success) {
            this.showMonitorMessage('BIOS LOADED\nSYSTEM OK\n\nReady to boot OS...', 0x00ff00);
            this.vfxManager.playSnapEffect(this.pcCase.x, this.pcCase.y, '#00ff00');
        } else {
            this.showMonitorMessage(`BOOT ERROR:\n${result.error}`, 0xff0000);
            this.cameras.main.shake(200, 0.01);
        }
    }

    showMonitorMessage(text, color) {
        this.monitorText.setText(text);
        this.monitorText.setColor(typeof color === 'number' ? '#' + color.toString(16) : color);
        this.monitorText.setAlpha(1);
        
        // Скрыть через 3 секунды
        this.time.delayedCall(3000, () => {
            this.tweens.add({
                targets: this.monitorText,
                alpha: 0,
                duration: 1000
            });
        });
    }

    shutdown() {
        if (this.uiManager) this.uiManager.destroy();
        this.events.off('pc-power-on');
    }
}
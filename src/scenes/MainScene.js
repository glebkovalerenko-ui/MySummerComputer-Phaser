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
import OrderManager from '../systems/OrderManager.js';
import AudioManager from '../systems/AudioManager.js'; // NEW

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
        this.locManager = new LocalizationManager(this, 'ru');
        this.vfxManager = new VFXManager(this);
        this.orderManager = new OrderManager(this.dataManager);
        this.audioManager = new AudioManager(this); // NEW: Init Audio

        // Генерация заказа, если его нет
        this.orderManager.generateNewOrderIfNeeded();

        this.dragManager = new DragManager(this);
        // Передаем audioManager в UI
        this.uiManager = new UIManager(this.dataManager, this.locManager, this.dragManager, this, this.audioManager);

        // 3. Окружение
        this.createEnvironment();
        
        // 4. Восстановление состояния сцены
        this.restoreState();

        // 5. Подписка на событие кнопки Power
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
    }

    restoreState() {
        const installedParts = GameStore.getInstalledParts();
        
        installedParts.forEach(entry => {
            const item = this.dataManager.getItemById(entry.itemId);
            if (item) {
                const zone = this.pcCase.getZoneByType(item.type);
                if (zone) {
                    this.placePartEntity(item, zone, true);
                }
            }
        });
    }

    spawnItem(itemData, worldX, worldY) {
        const zone = this.pcCase.tryPlaceItem(worldX, worldY, itemData.type);

        if (zone) {
            this.placePartEntity(itemData, zone, false);
            GameStore.installPart(itemData.id, itemData.type);
            return true;
        }
        return false;
    }

    placePartEntity(itemData, zone, isRestoring) {
        zone.setOccupied(true);

        // Передаем audioManager в InstalledPart, чтобы винты могли звучать
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
            part.instantInstall();
        } else {
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
                    this.audioManager.playSnap(); // AUDIO: Звук установки
                    part.showScrews();
                }
            });
        }
    }

    handlePowerOn() {
        this.audioManager.playUiClick(); // Звук нажатия кнопки

        // Запуск логики проверки
        const result = PCLogic.checkBuild(this.pcCase);
        
        if (result.success) {
            // Собираем установленные детали для проверки заказа
            const installedParts = this.pcCase.list
                .filter(child => child instanceof InstalledPart);
            
            const orderCheck = this.orderManager.checkOrderCompletion(installedParts);
            
            if (orderCheck.success) {
                this.audioManager.playBootSuccess(); // AUDIO: Успех
                this.uiManager.showMonitorOverlay(
                    true, 
                    `BIOS LOADED... OK\nCOMPONENTS DETECTED: ${installedParts.length}\nORDER REQUIREMENTS MET.`,
                    orderCheck.reward
                );
                this.vfxManager.playSnapEffect(this.pcCase.x, this.pcCase.y, '#00ff00');
            } else {
                this.audioManager.playBootError(); // AUDIO: Ошибка (не тот заказ)
                 this.uiManager.showMonitorOverlay(
                    false, 
                    `BIOS LOADED... OK\nBUT ORDER REJECTED:\n${orderCheck.error}`
                );
            }

        } else {
            this.audioManager.playBootError(); // AUDIO: Ошибка сборки
            this.uiManager.showMonitorOverlay(
                false, 
                `BOOT ERROR:\n${result.error}`
            );
            this.cameras.main.shake(200, 0.01);
        }
    }

    sellPC(reward) {
        console.log('Selling PC...');
        this.audioManager.playCash(); // AUDIO: Деньги
        
        // 1. Очистить сцену
        const children = [...this.pcCase.list];
        children.forEach(child => {
            if (child instanceof InstalledPart) {
                child.destroy();
            }
        });

        // Сбрасываем занятость зон
        this.pcCase.zones.forEach(zone => zone.setOccupied(false));

        // 2. Логика данных
        GameStore.addMoney(reward);
        GameStore.clearInstalledParts();
        this.orderManager.completeCurrentOrder();

        // 3. VFX
        this.vfxManager.playSnapEffect(this.pcCase.x, this.pcCase.y, '#ffd700');
    }

    shutdown() {
        if (this.uiManager) this.uiManager.destroy();
        this.events.off('pc-power-on');
    }
}
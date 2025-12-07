import Phaser from 'phaser';
import InputManager from '../utils/InputManager.js';
import LocalizationManager from '../utils/LocalizationManager.js';
import DataManager from '../systems/DataManager.js';
import UIManager from '../ui/UIManager.js';
import GameStore from '../state/GameStore.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // 1. Инициализация систем
        // ВАЖНО: Порядок инициализации имеет значение
        this.inputManager = new InputManager(this);
        
        // DataManager берет загруженный items_db из кэша
        this.dataManager = new DataManager(this);
        
        // LocalizationManager берет loc_ru из кэша
        this.locManager = new LocalizationManager(this, 'ru');

        // 2. Инициализация UI
        // Передаем менеджера данных и локализации в UI
        this.uiManager = new UIManager(this.dataManager, this.locManager);

        // 3. Немного визуала в Phaser для фона (чтобы не было скучно)
        this.createBackground();
        
        console.log('MainScene: Systems ready');
    }

    createBackground() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;
        
        this.add.text(cx, cy - 100, 'GAME WORLD', { 
            fontSize: '32px', 
            color: '#333' 
        }).setOrigin(0.5);

        // Пример взаимодействия: клик по миру не должен блокироваться UI
        this.input.on('pointerdown', () => {
            console.log('Clicked on Phaser World');
        });
    }

    shutdown() {
        if (this.uiManager) {
            this.uiManager.destroy();
        }
    }
}
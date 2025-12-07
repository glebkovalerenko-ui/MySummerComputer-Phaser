import Phaser from 'phaser';
import InputManager from '../utils/InputManager.js';
import LocalizationManager from '../utils/LocalizationManager.js';
import DataManager from '../systems/DataManager.js';
import UIManager from '../ui/UIManager.js';
import DragManager from '../utils/DragManager.js'; // Импорт

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
        // Передаем текущую сцену, чтобы DragManager мог вызывать spawnItem
        this.dragManager = new DragManager(this);

        // 3. Инициализация UI
        // Теперь передаем и dragManager
        this.uiManager = new UIManager(this.dataManager, this.locManager, this.dragManager);

        // 4. Визуал мира
        this.createBackground();
        
        console.log('MainScene: Ready');
    }

    createBackground() {
        const cx = this.cameras.main.width / 2;
        const cy = this.cameras.main.height / 2;
        
        this.add.text(cx, cy - 200, 'WORKBENCH AREA', { 
            fontSize: '32px', 
            color: '#444' 
        }).setOrigin(0.5);

        // Границы стола (просто визуально)
        const graphics = this.add.graphics();
        graphics.lineStyle(4, 0x666666);
        graphics.strokeRect(100, 100, 1080, 520);
    }

    /**
     * Создание предмета в мире игры
     * @param {Object} itemData - Данные предмета
     * @param {number} x - Мировая координата X
     * @param {number} y - Мировая координата Y
     */
    spawnItem(itemData, x, y) {
        // Создаем контейнер или спрайт.
        // Пока используем заглушку 'placeholder_item' из BootScene, подкрашенную в цвет предмета.
        const sprite = this.add.sprite(x, y, 'placeholder_item');
        
        // Красим спрайт в цвет предмета
        sprite.setTint(parseInt(itemData.color.replace('#', '0x'), 16));
        
        // Сохраняем ID данных внутри объекта для логики игры
        sprite.setData('itemId', itemData.id);
        sprite.setData('type', itemData.type);

        // Включаем интерактивность (перетаскивание внутри Phaser)
        sprite.setInteractive({ draggable: true });

        // События перетаскивания внутри мира
        sprite.on('drag', (pointer, dragX, dragY) => {
            sprite.x = dragX;
            sprite.y = dragY;
        });

        // Визуальный эффект появления
        this.tweens.add({
            targets: sprite,
            scale: { from: 0, to: 1 },
            duration: 300,
            ease: 'Back.out'
        });

        console.log(`Spawned ${itemData.id} at ${Math.round(x)}, ${Math.round(y)}`);
    }

    shutdown() {
        if (this.uiManager) {
            this.uiManager.destroy();
        }
    }
}
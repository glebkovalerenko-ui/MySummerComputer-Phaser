import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 1. Загрузка JSON-ов с данными и локализацией
        this.load.json('items_db', 'src/data/items.json');
        this.load.json('loc_ru', 'src/localization/ru.json');
        this.load.json('loc_en', 'src/localization/en.json');

        // (Оставим генерацию текстуры из прошлого урока для фона или плейсхолдера)
        this.createProgrammaticTexture();
    }

    create() {
        console.log('BootScene: Data loaded');
        this.scene.start('MainScene');
    }

    createProgrammaticTexture() {
        const graphics = this.make.graphics();
        graphics.fillStyle(0x444444);
        graphics.fillRect(0, 0, 64, 64);
        graphics.lineStyle(2, 0xffffff);
        graphics.strokeRect(0, 0, 64, 64);
        graphics.generateTexture('placeholder_item', 64, 64);
        graphics.destroy();
    }
}
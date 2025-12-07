import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // 1. Загрузка данных
        this.load.json('items_db', 'src/data/items.json');
        this.load.json('loc_ru', 'src/localization/ru.json');
        this.load.json('loc_en', 'src/localization/en.json');

        // 2. Генерация процедурных текстур
        this.createProgrammaticTexture(); // Старая (placeholder_item)
        this.createParticleTexture();     // Новая (particle_dot)
        this.createScrewTexture();        // Новая (screw_head)
    }

    create() {
        console.log('BootScene: Assets generated');
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

    // Текстура круглой частицы
    createParticleTexture() {
        const graphics = this.make.graphics();
        graphics.fillStyle(0xffffff);
        graphics.fillCircle(8, 8, 8);
        graphics.generateTexture('particle_dot', 16, 16);
        graphics.destroy();
    }

    // Текстура винтика (крестовая шляпка)
    createScrewTexture() {
        const size = 24;
        const graphics = this.make.graphics();
        
        // Основа
        graphics.fillStyle(0x888888); // Серый металл
        graphics.lineStyle(2, 0x555555);
        graphics.fillCircle(size/2, size/2, size/2 - 2);
        graphics.strokeCircle(size/2, size/2, size/2 - 2);

        // Крестовина
        graphics.lineStyle(3, 0x333333);
        graphics.beginPath();
        // Линия 1
        graphics.moveTo(size/2 - 6, size/2 - 6);
        graphics.lineTo(size/2 + 6, size/2 + 6);
        // Линия 2
        graphics.moveTo(size/2 + 6, size/2 - 6);
        graphics.lineTo(size/2 - 6, size/2 + 6);
        graphics.strokePath();

        graphics.generateTexture('screw_head', size, size);
        graphics.destroy();
    }
}
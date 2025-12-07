import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Генерируем текстуру СИНХРОННО через Graphics
        // Это гарантирует, что она будет готова до старта следующей сцены
        this.createProgrammaticTexture();
    }

    create() {
        console.log('BootScene: Texture generated');
        this.scene.start('MainScene');
    }

    createProgrammaticTexture() {
        // Создаем объект графики
        const graphics = this.make.graphics();

        // 1. Рисуем красный фон
        graphics.fillStyle(0xff0000);
        graphics.fillRect(0, 0, 64, 64);

        // 2. Рисуем белую обводку
        graphics.lineStyle(4, 0xffffff);
        graphics.strokeRect(2, 2, 60, 60);

        // 3. Превращаем графику в текстуру, которую можно использовать в спрайтах
        graphics.generateTexture('red_square', 64, 64);

        // Удаляем объект графики, он больше не нужен
        graphics.destroy();
    }
}
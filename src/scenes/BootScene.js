import Phaser from 'phaser';

export default class BootScene extends Phaser.Scene {
    constructor() {
        super({ key: 'BootScene' });
    }

    preload() {
        // Здесь обычно загружаются ассеты.
        // Для задания мы сгенерируем текстуру программно.
        this.createProgrammaticTexture();
    }

    create() {
        console.log('BootScene: Assets loaded');
        // Переходим к основной сцене
        this.scene.start('MainScene');
    }

    /**
     * Создает красный квадрат 64x64 и сохраняет его в TextureManager.
     * Это позволяет не зависеть от внешних файлов изображений на этапе прототипа.
     */
    createProgrammaticTexture() {
        // Создаем временный canvas элемент
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 64;
        const ctx = canvas.getContext('2d');

        // Рисуем красный квадрат с обводкой
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(0, 0, 64, 64);
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 4;
        ctx.strokeRect(2, 2, 60, 60);

        // Генерируем Base64 строку
        const dataURL = canvas.toDataURL();

        // Загружаем в Phaser
        this.textures.addBase64('red_square', dataURL);
        
        // Событие добавления текстуры асинхронно, но Base64 обычно очень быстрый.
        // В реальном проекте лучше использовать this.load.image с data URI в preload.
    }
}
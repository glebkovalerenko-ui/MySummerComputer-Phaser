import Phaser from 'phaser';

export default class VFXManager {
    /**
     * @param {Phaser.Scene} scene
     */
    constructor(scene) {
        this.scene = scene;
        
        // Создаем менеджер частиц один раз
        // Используем текстуру 'particle_dot', которую сгенерируем в BootScene
        this.emitter = this.scene.add.particles(0, 0, 'particle_dot', {
            lifespan: 600,
            speed: { min: 100, max: 250 },
            scale: { start: 0.8, end: 0 },
            alpha: { start: 1, end: 0 },
            gravityY: 500,
            blendMode: 'ADD',
            emitting: false // По умолчанию выключен
        });

        // Убедимся, что частицы поверх всего
        this.emitter.setDepth(1000);
    }

    /**
     * Проигрывает эффект успешной установки детали.
     * @param {number} x - Мировая координата X
     * @param {number} y - Мировая координата Y
     * @param {string} colorHex - Цвет детали (для окраски частиц)
     */
    playSnapEffect(x, y, colorHex) {
        const tint = parseInt(colorHex.replace('#', '0x'), 16);

        // 1. Взрыв частиц
        this.emitter.setPosition(x, y);
        this.emitter.setParticleTint(tint);
        
        // Выпускаем 20 частиц залпом
        this.emitter.explode(20);

        // 2. Легкая тряска камеры (Juice!)
        this.scene.cameras.main.shake(100, 0.005);
    }

    /**
     * Эффект закручивания винта (маленькая искра)
     */
    playScrewTighten(x, y) {
        const screwEmitter = this.scene.add.particles(0, 0, 'particle_dot', {
            lifespan: 300,
            speed: 50,
            scale: { start: 0.4, end: 0 },
            blendMode: 'ADD',
            emitting: false
        });
        
        screwEmitter.setPosition(x, y);
        screwEmitter.setParticleTint(0xffff00); // Золотые искры
        screwEmitter.explode(5);
        
        // Удаляем эмиттер после использования, так как он одноразовый и локальный
        this.scene.time.delayedCall(1000, () => {
            screwEmitter.destroy();
        });
    }
}
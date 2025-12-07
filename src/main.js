import Phaser from 'phaser';
import GameConfig from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import MainScene from './scenes/MainScene.js';

/**
 * Класс-обертка для запуска игры.
 * Позволяет управлять жизненным циклом приложения, если потребуется.
 */
class Game extends Phaser.Game {
    constructor(config) {
        super(config);
        
        // Регистрируем сцены
        this.scene.add('BootScene', BootScene);
        this.scene.add('MainScene', MainScene);

        // Запускаем первую сцену
        this.scene.start('BootScene');
    }
}

// Создаем экземпляр игры при загрузке окна
window.addEventListener('load', () => {
    const game = new Game(GameConfig);
    
    // Для дебага в консоли (опционально)
    window.game = game;
});
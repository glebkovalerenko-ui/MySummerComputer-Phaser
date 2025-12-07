import Phaser from 'phaser';
import GameConfig from './config/GameConfig.js';
import BootScene from './scenes/BootScene.js';
import MainScene from './scenes/MainScene.js';

class Game extends Phaser.Game {
    constructor(config) {
        super(config);
        
        this.scene.add('BootScene', BootScene);
        this.scene.add('MainScene', MainScene);

        this.scene.start('BootScene');
    }
}

window.addEventListener('load', () => {
    const game = new Game(GameConfig);
    window.game = game;
});
import Phaser from 'phaser';

/**
 * Конфигурация Phaser игры.
 * Настроена под мобильные устройства и режим Scale.FIT.
 */
const GameConfig = {
    type: Phaser.AUTO, // WebGL по умолчанию, Canvas как фоллбек
    parent: 'game-container', // ID DOM-элемента, куда вставится канвас
    backgroundColor: '#1a1a1a', // Цвет фона канваса
    
    // Настройки масштабирования
    scale: {
        mode: Phaser.Scale.FIT, // Вписываем игру в экран с сохранением пропорций
        autoCenter: Phaser.Scale.CENTER_BOTH, // Центрируем по вертикали и горизонтали
        width: 1280, // Базовое разрешение ширины
        height: 720, // Базовое разрешение высоты
    },

    // Настройки DOM для интеграции HTML элементов (если будем использовать this.add.dom)
    dom: {
        createContainer: true
    },

    // Настройки физики (если потребуется в будущем)
    physics: {
        default: 'arcade',
        arcade: {
            debug: false,
            gravity: { y: 0 }
        }
    },
    
    // Сглаживание пикселей (для pixel-art игр поставить false)
    pixelArt: false,
};

export default GameConfig;
import Phaser from 'phaser';

/**
 * InputManager
 * Отвечает за преобразование координат из DOM-событий (HTML UI)
 * в мировые координаты Phaser.
 */
export default class InputManager {
    /**
     * @param {Phaser.Scene} scene - Ссылка на текущую сцену
     */
    constructor(scene) {
        this.scene = scene;
        this.game = scene.game;
    }

    /**
     * Преобразует координаты DOM события (MouseEvent/TouchEvent) в координаты мира Phaser.
     * Учитывает скейлинг канваса (Scale Manager), черные полосы (Letterboxing) и позицию Камеры.
     * 
     * @param {MouseEvent|TouchEvent} domEvent - Оригинальное событие браузера
     * @param {Phaser.Cameras.Scene2D.Camera} [camera] - Камера (по умолчанию main)
     * @returns {Phaser.Math.Vector2} Объект {x, y} в мировых координатах
     */
    getPhaserCoordinates(domEvent, camera) {
        const cam = camera || this.scene.cameras.main;

        // Получаем координаты клика на экране браузера
        let clientX, clientY;

        if (domEvent.touches && domEvent.touches.length > 0) {
            clientX = domEvent.touches[0].clientX;
            clientY = domEvent.touches[0].clientY;
        } else if (domEvent.changedTouches && domEvent.changedTouches.length > 0) {
            // Для события touchend
            clientX = domEvent.changedTouches[0].clientX;
            clientY = domEvent.changedTouches[0].clientY;
        } else {
            clientX = domEvent.clientX;
            clientY = domEvent.clientY;
        }

        // Получаем прямоугольник канваса в окне браузера
        // Это необходимо, так как из-за Scale.FIT могут быть отступы (черные полосы)
        const canvasBounds = this.game.canvas.getBoundingClientRect();

        // 1. Вычисляем координаты относительно левого верхнего угла канваса
        const relativeX = clientX - canvasBounds.left;
        const relativeY = clientY - canvasBounds.top;

        // 2. Вычисляем коэффициенты масштабирования (Scale Factor)
        // Отношение реального размера канваса в CSS пикселях к внутреннему разрешению игры
        const scaleX = this.game.scale.displaySize.width / this.game.scale.gameSize.width;
        const scaleY = this.game.scale.displaySize.height / this.game.scale.gameSize.height;

        // 3. Преобразуем в "экранные" координаты Phaser (без учета камеры)
        const screenX = relativeX / scaleX;
        const screenY = relativeY / scaleY;

        // 4. Преобразуем экранные координаты в мировые (с учетом скролла и зума камеры)
        // getWorldPoint автоматически учитывает scrollX, scrollY и zoom камеры
        return cam.getWorldPoint(screenX, screenY);
    }
}
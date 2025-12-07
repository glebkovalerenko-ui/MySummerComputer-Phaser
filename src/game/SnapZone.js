import Phaser from 'phaser';

export default class SnapZone extends Phaser.GameObjects.Zone {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - Локальная координата X внутри контейнера
     * @param {number} y - Локальная координата Y внутри контейнера
     * @param {number} width
     * @param {number} height
     * @param {string} acceptedType - Тип предмета (CPU, GPU, RAM...)
     */
    constructor(scene, x, y, width, height, acceptedType) {
        super(scene, x, y, width, height);
        
        this.acceptedType = acceptedType;
        this.isOccupied = false;
        
        // Для отладки и визуализации создаем графику
        // Важно: Графику нужно будет добавить в тот же контейнер, где лежит зона
        this.graphics = scene.add.graphics();
        this.draw();
    }

    /**
     * Рисует рамку зоны.
     * @param {boolean} highlight - Если true, рамка подсвечивается (активна)
     */
    draw(highlight = false) {
        this.graphics.clear();
        
        const color = highlight ? 0x00ff00 : 0x666666;
        const alpha = highlight ? 1 : 0.5;
        const thickness = highlight ? 4 : 2;

        this.graphics.lineStyle(thickness, color, alpha);
        
        // Рисуем прямоугольник с учетом того, что Zone центрирована (origin 0.5)
        // Но графика рисуется от 0,0. Поэтому смещаем координаты рисования.
        this.graphics.strokeRect(
            this.x - this.width / 2, 
            this.y - this.height / 2, 
            this.width, 
            this.height
        );

        // Добавим текст типа для наглядности
        // (Опционально, можно убрать в проде)
        /*
        if (!this.text) {
             this.text = this.scene.add.text(this.x, this.y, this.acceptedType, { fontSize: 10, color: '#aaa' }).setOrigin(0.5);
        }
        */
    }

    setOccupied(occupied) {
        this.isOccupied = occupied;
        // Если занята - скрываем рамку, чтобы не мешала виду предмета
        this.graphics.visible = !occupied;
    }

    /**
     * Подсветить зону (например, когда мы тащим подходящий предмет)
     */
    highlight(isActive) {
        if (!this.isOccupied) {
            this.draw(isActive);
        }
    }
}
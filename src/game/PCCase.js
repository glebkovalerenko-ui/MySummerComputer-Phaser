import Phaser from 'phaser';
import SnapZone from './SnapZone.js';

export default class PCCase extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        // 1. Создаем фон (Корпус / Материнская плата)
        // Размеры условные, под 1280x720
        const bgWidth = 600;
        const bgHeight = 500;
        
        const bg = scene.add.rectangle(0, 0, bgWidth, bgHeight, 0x2a2a2a);
        bg.setStrokeStyle(4, 0x444444);
        this.add(bg);

        // Декоративные элементы (слоты PCI, сокет и т.д.)
        const motherboard = scene.add.rectangle(0, 0, 560, 460, 0x333333);
        this.add(motherboard);

        // 2. Инициализируем зоны
        this.zones = [];

        // CPU (Сверху по центру)
        this.addZone(0, -120, 100, 100, 'CPU');

        // RAM (Справа от CPU)
        this.addZone(120, -120, 40, 120, 'RAM');

        // GPU (Снизу, длинный слот PCI-E)
        this.addZone(0, 50, 300, 60, 'GPU');

        // HDD (Внизу справа)
        this.addZone(180, 180, 120, 80, 'HDD');

        // Добавляем этот контейнер на сцену
        scene.add.existing(this);
    }

    addZone(x, y, w, h, type) {
        const zone = new SnapZone(this.scene, x, y, w, h, type);
        this.zones.push(zone);
        
        // Важно: Добавляем и саму зону, и её графику в контейнер
        this.add(zone.graphics);
        this.add(zone);
    }

    /**
     * Пытается найти подходящую зону для координат мыши.
     * @param {number} worldX - Мировая координата X
     * @param {number} worldY - Мировая координата Y
     * @param {string} itemType - Тип предмета
     * @returns {SnapZone|null} Возвращает зону, если успех, иначе null
     */
    tryPlaceItem(worldX, worldY, itemType) {
        // 1. Конвертируем мировые координаты в локальные координаты контейнера
        // Это критически важно, так как контейнер может быть сдвинут или масштабирован
        const localPoint = this.pointToContainer({ x: worldX, y: worldY });

        // 2. Ищем подходящую зону
        const foundZone = this.zones.find(zone => {
            // А. Проверка типа
            if (zone.acceptedType !== itemType) return false;
            
            // Б. Проверка занятости
            if (zone.isOccupied) return false;

            // В. Проверка попадания точки в прямоугольник зоны
            // Так как zone.x/y - это центр зоны в локальных координатах контейнера:
            const left = zone.x - zone.width / 2;
            const right = zone.x + zone.width / 2;
            const top = zone.y - zone.height / 2;
            const bottom = zone.y + zone.height / 2;

            const inside = (
                localPoint.x >= left && 
                localPoint.x <= right &&
                localPoint.y >= top && 
                localPoint.y <= bottom
            );

            return inside;
        });

        return foundZone || null;
    }
}
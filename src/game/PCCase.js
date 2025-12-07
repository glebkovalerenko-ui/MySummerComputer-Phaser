import Phaser from 'phaser';
import SnapZone from './SnapZone.js';

export default class PCCase extends Phaser.GameObjects.Container {
    constructor(scene, x, y) {
        super(scene, x, y);

        // 1. Фон (Корпус)
        const bgWidth = 600;
        const bgHeight = 500;
        
        const bg = scene.add.rectangle(0, 0, bgWidth, bgHeight, 0x2a2a2a);
        bg.setStrokeStyle(4, 0x444444);
        this.add(bg);

        // Материнская плата
        const motherboard = scene.add.rectangle(0, 0, 560, 460, 0x333333);
        this.add(motherboard);

        // 2. Зоны
        this.zones = [];
        this.addZone(0, -120, 100, 100, 'CPU');
        this.addZone(120, -120, 40, 120, 'RAM');
        this.addZone(0, 50, 300, 60, 'GPU');
        this.addZone(180, 180, 120, 80, 'HDD');

        // 3. Кнопка Power
        this.createPowerButton(scene, bgWidth, bgHeight);

        scene.add.existing(this);
    }

    addZone(x, y, w, h, type) {
        const zone = new SnapZone(this.scene, x, y, w, h, type);
        this.zones.push(zone);
        this.add(zone.graphics);
        this.add(zone);
    }

    createPowerButton(scene, w, h) {
        // Кнопка в углу корпуса
        const btnX = w/2 - 40;
        const btnY = -h/2 + 40; // Сверху справа

        const btnBg = scene.add.circle(btnX, btnY, 20, 0x111111);
        const btnIcon = scene.add.text(btnX, btnY, '⏻', { fontSize: '20px', color: '#ff5555' }).setOrigin(0.5);

        // Группируем для удобства
        this.powerBtn = scene.add.container(0, 0, [btnBg, btnIcon]);
        this.add(this.powerBtn);

        // Интерактив
        btnBg.setInteractive({ cursor: 'pointer' });
        
        // Событие нажатия прокидываем в сцену
        btnBg.on('pointerdown', () => {
            this.scene.events.emit('pc-power-on');
            
            // Анимация нажатия
            scene.tweens.add({
                targets: this.powerBtn,
                scale: 0.9,
                yoyo: true,
                duration: 50
            });
        });
    }

    /**
     * Поиск зоны по типу (нужен для загрузки сохранения)
     */
    getZoneByType(type) {
        return this.zones.find(z => z.acceptedType === type);
    }

    tryPlaceItem(worldX, worldY, itemType) {
        const localPoint = this.pointToContainer({ x: worldX, y: worldY });

        const foundZone = this.zones.find(zone => {
            if (zone.acceptedType !== itemType) return false;
            if (zone.isOccupied) return false;

            const left = zone.x - zone.width / 2;
            const right = zone.x + zone.width / 2;
            const top = zone.y - zone.height / 2;
            const bottom = zone.y + zone.height / 2;

            return (
                localPoint.x >= left && 
                localPoint.x <= right &&
                localPoint.y >= top && 
                localPoint.y <= bottom
            );
        });

        return foundZone || null;
    }
}
import Phaser from 'phaser';

/**
 * Представляет деталь, установленную в корпус.
 * Содержит спрайт самой детали и спрайты винтов крепления.
 */
export default class InstalledPart extends Phaser.GameObjects.Container {
    /**
     * @param {Phaser.Scene} scene
     * @param {number} x - Локальная позиция X
     * @param {number} y - Локальная позиция Y
     * @param {Object} itemData - Данные о предмете (id, type, color...)
     * @param {number} width - Ширина слота (зоны)
     * @param {number} height - Высота слота (зоны)
     */
    constructor(scene, x, y, itemData, width, height) {
        super(scene, x, y);

        this.itemData = itemData;
        this.targetWidth = width;
        this.targetHeight = height;
        this.isFullyInstalled = false;
        this.screws = [];

        // 1. Создаем основной спрайт детали
        this.mainSprite = scene.add.sprite(0, 0, 'placeholder_item');
        this.mainSprite.setTint(parseInt(itemData.color.replace('#', '0x'), 16));
        this.mainSprite.setDisplaySize(width * 0.9, height * 0.9);
        this.add(this.mainSprite);

        // 2. Инициализируем винты (но пока скрываем)
        this.initScrews(width * 0.9, height * 0.9);
    }

    /**
     * Расставляет 4 винта по углам
     */
    initScrews(w, h) {
        const offset = 10; // Отступ от края
        const positions = [
            { x: -w/2 + offset, y: -h/2 + offset }, // Top Left
            { x: w/2 - offset, y: -h/2 + offset },  // Top Right
            { x: -w/2 + offset, y: h/2 - offset },  // Bot Left
            { x: w/2 - offset, y: h/2 - offset }    // Bot Right
        ];

        positions.forEach((pos, index) => {
            const screw = this.scene.add.sprite(pos.x, pos.y, 'screw_head');
            screw.setScale(0.8);
            screw.setTint(0xff5555); // Красный - значит не закручен
            screw.setVisible(false); // Скрыты до момента установки
            
            // Интерактивность винта
            screw.setInteractive({ cursor: 'pointer' });
            screw.on('pointerdown', (pointer) => {
                // Останавливаем всплытие, чтобы не триггерить клик по корпусу (если будет)
                pointer.event.stopPropagation();
                this.tightenScrew(screw, index);
            });

            this.add(screw);
            this.screws.push({ sprite: screw, isTight: false });
        });
    }

    /**
     * Показать винты с анимацией "pop-in"
     */
    showScrews() {
        this.screws.forEach((sObj, i) => {
            sObj.sprite.setVisible(true);
            sObj.sprite.setScale(0);
            
            this.scene.tweens.add({
                targets: sObj.sprite,
                scale: 0.8,
                duration: 300,
                delay: i * 50, // Появляются по очереди
                ease: 'Back.out'
            });
        });
    }

    /**
     * Логика закручивания винта
     */
    tightenScrew(screwSprite, index) {
        const screwObj = this.screws[index];
        if (screwObj.isTight) return; // Уже закручен

        // 1. Анимация вращения
        this.scene.tweens.add({
            targets: screwSprite,
            angle: 360, // Полный оборот
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // 2. Смена состояния
                screwSprite.setTint(0xcccccc); // Серебряный - закручен
                screwSprite.setAngle(0); // Сброс угла
                screwObj.isTight = true;

                // 3. Эффект искры (через VFX Manager, если доступен в сцене)
                if (this.scene.vfxManager) {
                    const worldPos = this.getScrewWorldPosition(screwSprite);
                    this.scene.vfxManager.playScrewTighten(worldPos.x, worldPos.y);
                }

                // 4. Проверка завершения
                this.checkFullInstallation();
            }
        });
    }

    checkFullInstallation() {
        const allTight = this.screws.every(s => s.isTight);
        if (allTight && !this.isFullyInstalled) {
            this.isFullyInstalled = true;
            console.log('Part fully installed!');
            
            // Фидбек успешной сборки (зеленая вспышка спрайта)
            this.scene.tweens.add({
                targets: this.mainSprite,
                alpha: 0.5,
                yoyo: true,
                duration: 100,
                repeat: 1,
                onComplete: () => {
                    this.mainSprite.alpha = 1;
                }
            });
        }
    }

    /**
     * Хелпер для получения мировых координат винта (для партиклов)
     */
    getScrewWorldPosition(screwSprite) {
        // Получаем матрицу мира винта
        const matrix = screwSprite.getWorldTransformMatrix();
        return { x: matrix.tx, y: matrix.ty };
    }
}
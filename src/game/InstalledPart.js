import Phaser from 'phaser';

/**
 * Представляет деталь, установленную в корпус.
 */
export default class InstalledPart extends Phaser.GameObjects.Container {
    constructor(scene, x, y, itemData, width, height) {
        super(scene, x, y);

        this.itemData = itemData;
        this.targetWidth = width;
        this.targetHeight = height;
        this.isFullyInstalled = false;
        this.screws = [];

        // 1. Основной спрайт
        this.mainSprite = scene.add.sprite(0, 0, 'placeholder_item');
        this.mainSprite.setTint(parseInt(itemData.color.replace('#', '0x'), 16));
        this.mainSprite.setDisplaySize(width * 0.9, height * 0.9);
        this.add(this.mainSprite);

        // 2. Инициализация винтов
        this.initScrews(width * 0.9, height * 0.9);
    }

    initScrews(w, h) {
        const offset = 10;
        const positions = [
            { x: -w/2 + offset, y: -h/2 + offset },
            { x: w/2 - offset, y: -h/2 + offset },
            { x: -w/2 + offset, y: h/2 - offset },
            { x: w/2 - offset, y: h/2 - offset }
        ];

        positions.forEach((pos, index) => {
            const screw = this.scene.add.sprite(pos.x, pos.y, 'screw_head');
            screw.setScale(0.8);
            screw.setTint(0xff5555); // Красный - не закручен
            screw.setVisible(false);
            
            screw.setInteractive({ cursor: 'pointer' });
            screw.on('pointerdown', (pointer) => {
                pointer.event.stopPropagation();
                this.tightenScrew(screw, index);
            });

            this.add(screw);
            this.screws.push({ sprite: screw, isTight: false });
        });
    }

    showScrews() {
        this.screws.forEach((sObj, i) => {
            sObj.sprite.setVisible(true);
            sObj.sprite.setScale(0);
            
            this.scene.tweens.add({
                targets: sObj.sprite,
                scale: 0.8,
                duration: 300,
                delay: i * 50,
                ease: 'Back.out'
            });
        });
    }

    tightenScrew(screwSprite, index) {
        const screwObj = this.screws[index];
        if (screwObj.isTight) return;

        this.scene.tweens.add({
            targets: screwSprite,
            angle: 360,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                screwSprite.setTint(0xcccccc);
                screwSprite.setAngle(0);
                screwObj.isTight = true;

                if (this.scene.vfxManager) {
                    const worldPos = this.getScrewWorldPosition(screwSprite);
                    this.scene.vfxManager.playScrewTighten(worldPos.x, worldPos.y);
                }

                this.checkFullInstallation();
            }
        });
    }

    checkFullInstallation() {
        const allTight = this.screws.every(s => s.isTight);
        if (allTight && !this.isFullyInstalled) {
            this.isFullyInstalled = true;
            
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
     * Моментальная установка (для загрузки сохранений).
     * Делает винты видимыми и закрученными без анимаций.
     */
    instantInstall() {
        this.isFullyInstalled = true;
        
        this.screws.forEach(sObj => {
            sObj.isTight = true;
            sObj.sprite.setVisible(true);
            sObj.sprite.setTint(0xcccccc); // Цвет закрученного винта
            sObj.sprite.setAngle(0);
            sObj.sprite.setScale(0.8);
        });
        
        console.log(`Part ${this.itemData.type} restored fully installed.`);
    }

    getScrewWorldPosition(screwSprite) {
        const matrix = screwSprite.getWorldTransformMatrix();
        return { x: matrix.tx, y: matrix.ty };
    }
}
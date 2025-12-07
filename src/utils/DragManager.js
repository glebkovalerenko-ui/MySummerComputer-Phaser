import GameStore from '../state/GameStore.js';

/**
 * Управляет логикой перетаскивания из HTML UI в Phaser World.
 */
export default class DragManager {
    /**
     * @param {Phaser.Scene} scene - Сцена, в которую будем спавнить
     */
    constructor(scene) {
        this.scene = scene;
        this.isDragging = false;
        this.dragItem = null; 
        this.ghostEl = null;

        this.onMove = this.onMove.bind(this);
        this.onUp = this.onUp.bind(this);
    }

    startDrag(event, itemData) {
        event.preventDefault();
        this.isDragging = true;
        this.dragItem = itemData;

        this.createGhost(event, itemData);

        document.addEventListener('mousemove', this.onMove, { passive: false });
        document.addEventListener('touchmove', this.onMove, { passive: false });
        document.addEventListener('mouseup', this.onUp);
        document.addEventListener('touchend', this.onUp);
    }

    createGhost(event, item) {
        this.ghostEl = document.createElement('div');
        this.ghostEl.className = 'dragging-ghost';
        this.ghostEl.style.backgroundColor = item.color;
        this.ghostEl.innerText = item.type;
        document.body.appendChild(this.ghostEl);
        this.updateGhostPosition(event);
    }

    updateGhostPosition(event) {
        if (!this.ghostEl) return;

        let clientX, clientY;
        if (event.touches && event.touches.length > 0) {
            clientX = event.touches[0].clientX;
            clientY = event.touches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        this.ghostEl.style.left = `${clientX - 32}px`;
        this.ghostEl.style.top = `${clientY - 32}px`;
    }

    onMove(event) {
        if (!this.isDragging) return;
        event.preventDefault();
        this.updateGhostPosition(event);
    }

    onUp(event) {
        if (!this.isDragging) return;
        this.finishDrag(event);
    }

    finishDrag(event) {
        // Удаляем слушатели
        document.removeEventListener('mousemove', this.onMove);
        document.removeEventListener('touchmove', this.onMove);
        document.removeEventListener('mouseup', this.onUp);
        document.removeEventListener('touchend', this.onUp);

        // Получаем координаты для проверки элемента под курсором
        let clientX, clientY;
        if (event.changedTouches && event.changedTouches.length > 0) {
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // Скрываем призрак
        this.ghostEl.style.display = 'none';
        const elementBelow = document.elementFromPoint(clientX, clientY);
        
        // Удаляем призрак окончательно
        if (this.ghostEl) {
            this.ghostEl.remove();
            this.ghostEl = null;
        }

        // Логика дропа
        if (elementBelow && (elementBelow.id === 'game-container' || elementBelow.tagName === 'CANVAS')) {
            this.tryDropInWorld(event);
        } else {
            this.dropCancel();
        }

        this.isDragging = false;
        this.dragItem = null;
    }

    tryDropInWorld(event) {
        if (this.scene && this.scene.inputManager) {
            const worldPoint = this.scene.inputManager.getPhaserCoordinates(event);
            
            // Пробуем заспавнить предмет
            // spawnItem теперь возвращает boolean (успех/неудача)
            const success = this.scene.spawnItem(this.dragItem, worldPoint.x, worldPoint.y);

            if (success) {
                // Если успешно установили в слот - убираем из инвентаря
                GameStore.markAsPlaced(this.dragItem.id);
            } else {
                // Если не попали в слот - отменяем
                this.dropCancel();
            }
        }
    }

    dropCancel() {
        console.log('Drop cancelled. Item returned to inventory.');
        // Здесь можно добавить визуальный эффект "отлетания" обратно в инвентарь
    }
}
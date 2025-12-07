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
        this.dragItem = null; // Данные предмета { id, type, color ... }
        this.ghostEl = null;  // HTML элемент-призрак

        // Привязываем контекст для событий
        this.onMove = this.onMove.bind(this);
        this.onUp = this.onUp.bind(this);
    }

    /**
     * Начать перетаскивание (вызывается из UIManager при mousedown/touchstart)
     * @param {MouseEvent|TouchEvent} event 
     * @param {Object} itemData - объект предмета из JSON
     */
    startDrag(event, itemData) {
        // Предотвращаем стандартное поведение (выделение текста и т.д.)
        event.preventDefault();

        this.isDragging = true;
        this.dragItem = itemData;

        // Создаем визуального призрака
        this.createGhost(event, itemData);

        // Вешаем слушатели на document, чтобы ловить движение везде
        document.addEventListener('mousemove', this.onMove, { passive: false });
        document.addEventListener('touchmove', this.onMove, { passive: false });
        document.addEventListener('mouseup', this.onUp);
        document.addEventListener('touchend', this.onUp);
    }

    createGhost(event, item) {
        this.ghostEl = document.createElement('div');
        this.ghostEl.className = 'dragging-ghost';
        this.ghostEl.style.backgroundColor = item.color;
        // Можно добавить иконку или текст
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

        // Центрируем призрака под пальцем/курсором
        // Предполагаем размер 64x64 (задан в CSS)
        this.ghostEl.style.left = `${clientX - 32}px`;
        this.ghostEl.style.top = `${clientY - 32}px`;
    }

    onMove(event) {
        if (!this.isDragging) return;
        event.preventDefault(); // Блокируем скролл на мобильных
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

        // Проверяем, над чем отпустили (Canvas или UI)
        // Получаем элемент под курсором
        let clientX, clientY;
        if (event.changedTouches && event.changedTouches.length > 0) {
            clientX = event.changedTouches[0].clientX;
            clientY = event.changedTouches[0].clientY;
        } else {
            clientX = event.clientX;
            clientY = event.clientY;
        }

        // Скрываем призрак на мгновение, чтобы elementFromPoint не вернул его самого
        this.ghostEl.style.display = 'none';
        const elementBelow = document.elementFromPoint(clientX, clientY);
        
        // Если попали в канвас или его контейнер
        if (elementBelow && (elementBelow.id === 'game-container' || elementBelow.tagName === 'CANVAS')) {
            this.dropSuccess(event);
        } else {
            this.dropCancel();
        }

        // Чистка
        if (this.ghostEl) {
            this.ghostEl.remove();
            this.ghostEl = null;
        }
        this.isDragging = false;
        this.dragItem = null;
    }

    dropSuccess(event) {
        // Конвертируем координаты
        // MainScene должна иметь inputManager
        if (this.scene && this.scene.inputManager) {
            const worldPoint = this.scene.inputManager.getPhaserCoordinates(event);
            
            // Вызываем метод спавна в сцене
            this.scene.spawnItem(this.dragItem, worldPoint.x, worldPoint.y);

            // Обновляем стор (предмет уходит из инвентаря)
            GameStore.markAsPlaced(this.dragItem.id);
        }
    }

    dropCancel() {
        console.log('Drop cancelled (returned to inventory)');
    }
}
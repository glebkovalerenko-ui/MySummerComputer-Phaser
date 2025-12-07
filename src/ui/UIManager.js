import GameStore from '../state/GameStore.js';

export default class UIManager {
    /**
     * @param {DataManager} dataManager
     * @param {LocalizationManager} locManager
     * @param {DragManager} dragManager - Передаем менеджер драга
     */
    constructor(dataManager, locManager, dragManager) {
        this.dataManager = dataManager;
        this.loc = locManager;
        this.dragManager = dragManager;
        
        this.root = document.getElementById('ui-root');
        
        // Подписываемся на изменения в сторе
        GameStore.events.on('stateChanged', this.updateUI, this);
        GameStore.events.on('error', this.showError, this);

        this.initStructure();
        this.render();
    }

    initStructure() {
        this.root.innerHTML = '';

        // 1. Хедер (Баланс)
        this.headerEl = document.createElement('div');
        this.headerEl.className = 'ui-header pointer-events-auto';
        this.root.appendChild(this.headerEl);

        // 2. Контейнер магазина
        this.shopEl = document.createElement('div');
        this.shopEl.className = 'shop-container pointer-events-auto';
        this.root.appendChild(this.shopEl);

        // 3. Инвентарь (Бар снизу)
        this.inventoryEl = document.createElement('div');
        this.inventoryEl.className = 'inventory-bar pointer-events-auto';
        this.root.appendChild(this.inventoryEl);
    }

    render() {
        this.renderHeader();
        this.renderShop();
        this.renderInventory();
    }

    updateUI() {
        this.renderHeader();
        this.renderShop();
        this.renderInventory();
    }

    renderHeader() {
        const money = GameStore.getMoney();
        const text = this.loc.t('UI_BALANCE');
        this.headerEl.innerHTML = `
            <div class="balance-box">
                <span class="label">${text}:</span>
                <span class="value">$${money}</span>
            </div>
        `;
    }

    renderShop() {
        const title = this.loc.t('UI_SHOP_TITLE');
        const items = this.dataManager.getAllItems();

        // Фильтруем items: если предмет уже куплен, показываем кнопку Owned. 
        // Логика отображения осталась прежней, просто обновляем состояния.
        
        let html = `<h2>${title}</h2><div class="items-grid">`;

        items.forEach(item => {
            const name = this.loc.t(item.nameKey);
            const isOwned = GameStore.hasItem(item.id);
            
            let btnClass = isOwned ? 'btn-owned' : 'btn-buy';
            let btnText = isOwned ? this.loc.t('UI_BTN_OWNED') : `${this.loc.t('UI_BTN_BUY')} $${item.price}`;
            let disabled = isOwned ? 'disabled' : '';
            const colorStyle = `background-color: ${item.color}`;

            html += `
                <div class="item-card">
                    <div class="item-icon" style="${colorStyle}"></div>
                    <div class="item-info">
                        <h3>${name}</h3>
                        <div class="item-type">${item.type}</div>
                    </div>
                    <button class="${btnClass}" data-id="${item.id}" ${disabled}>
                        ${btnText}
                    </button>
                </div>
            `;
        });

        html += `</div>`;
        this.shopEl.innerHTML = html;

        const buttons = this.shopEl.querySelectorAll('.btn-buy');
        buttons.forEach(btn => {
            if (!btn.disabled) {
                btn.onclick = (e) => {
                    e.stopPropagation();
                    const id = e.target.getAttribute('data-id');
                    const item = this.dataManager.getItemById(id);
                    GameStore.buyItem(item);
                };
            }
        });
    }

    renderInventory() {
        // Получаем только доступные (не размещенные) предметы
        const inventoryIds = GameStore.getAvailableInventory();
        
        let html = '';
        if (inventoryIds.length === 0) {
            html = `<div class="empty-msg">${this.loc.t('UI_INVENTORY_TITLE')}</div>`;
        } else {
            inventoryIds.forEach(id => {
                const item = this.dataManager.getItemById(id);
                // Карточка в инвентаре маленькая
                html += `
                    <div class="inv-slot" data-id="${item.id}" style="background-color: ${item.color}">
                        <span class="inv-label">${item.type}</span>
                    </div>
                `;
            });
        }

        this.inventoryEl.innerHTML = html;

        // Навешиваем DragStart события
        const slots = this.inventoryEl.querySelectorAll('.inv-slot');
        slots.forEach(slot => {
            const onStart = (e) => {
                const id = slot.getAttribute('data-id');
                const item = this.dataManager.getItemById(id);
                this.dragManager.startDrag(e, item);
            };

            slot.addEventListener('mousedown', onStart);
            slot.addEventListener('touchstart', onStart, { passive: false });
        });
    }

    showError(msgKey) {
        alert(this.loc.t(msgKey));
    }

    destroy() {
        GameStore.events.off('stateChanged', this.updateUI, this);
        GameStore.events.off('error', this.showError, this);
        this.root.innerHTML = '';
    }
}
import GameStore from '../state/GameStore.js';

export default class UIManager {
    constructor(dataManager, locManager, dragManager, mainScene) {
        this.dataManager = dataManager;
        this.loc = locManager;
        this.dragManager = dragManager;
        this.mainScene = mainScene; // Ссылка на сцену для колбэков
        
        this.root = document.getElementById('ui-root');
        this.isShopOpen = false;
        
        GameStore.events.on('stateChanged', this.updateUI, this);
        GameStore.events.on('error', this.showError, this);

        this.initStructure();
        this.render();
    }

    initStructure() {
        this.root.innerHTML = '';

        // 1. Хедер (Заказ + Баланс + Кнопка Магазина)
        this.headerEl = document.createElement('div');
        this.headerEl.className = 'ui-header pointer-events-auto';
        this.root.appendChild(this.headerEl);

        // 2. Магазин (скрыт по умолчанию)
        this.shopEl = document.createElement('div');
        this.shopEl.className = 'shop-container pointer-events-auto hidden';
        this.root.appendChild(this.shopEl);

        // 3. Инвентарь
        this.inventoryEl = document.createElement('div');
        this.inventoryEl.className = 'inventory-bar pointer-events-auto';
        this.root.appendChild(this.inventoryEl);

        // 4. Оверлей монитора (BIOS) - скрыт по умолчанию
        this.monitorOverlayEl = document.createElement('div');
        this.monitorOverlayEl.className = 'monitor-overlay hidden pointer-events-auto';
        this.root.appendChild(this.monitorOverlayEl);
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
        const order = GameStore.getCurrentOrder();

        const orderHtml = order 
            ? `<div class="order-widget">
                 <div class="order-title">${order.title}</div>
                 <div class="order-req">${order.description}</div>
               </div>`
            : '<div class="order-widget">No Orders</div>';

        this.headerEl.innerHTML = `
            ${orderHtml}
            <div class="header-right">
                <div class="balance-box">
                    <span class="value">$${money}</span>
                </div>
                <button id="btn-shop-toggle" class="btn-shop">
                    ${this.isShopOpen ? 'CLOSE SHOP' : 'OPEN SHOP'}
                </button>
            </div>
        `;

        // Биндим клик
        this.headerEl.querySelector('#btn-shop-toggle').onclick = () => this.toggleShop();
    }

    toggleShop() {
        this.isShopOpen = !this.isShopOpen;
        if (this.isShopOpen) {
            this.shopEl.classList.remove('hidden');
        } else {
            this.shopEl.classList.add('hidden');
        }
        this.renderHeader(); // Обновить текст кнопки
    }

    renderShop() {
        const title = this.loc.t('UI_SHOP_TITLE');
        const items = this.dataManager.getAllItems();
        
        let html = `
            <div class="shop-header">
                <h2>${title}</h2>
                <button class="btn-close-shop">X</button>
            </div>
            <div class="items-grid">
        `;

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

        // Кнопка закрытия внутри магазина
        this.shopEl.querySelector('.btn-close-shop').onclick = () => this.toggleShop();

        // Кнопки покупки
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
        const inventoryIds = GameStore.getAvailableInventory();
        let html = '';
        if (inventoryIds.length === 0) {
            html = `<div class="empty-msg">${this.loc.t('UI_INVENTORY_TITLE')}</div>`;
        } else {
            inventoryIds.forEach(id => {
                const item = this.dataManager.getItemById(id);
                html += `
                    <div class="inv-slot" data-id="${item.id}" style="background-color: ${item.color}">
                        <span class="inv-label">${item.type}</span>
                    </div>
                `;
            });
        }

        this.inventoryEl.innerHTML = html;

        // DragStart
        const slots = this.inventoryEl.querySelectorAll('.inv-slot');
        slots.forEach(slot => {
            const onStart = (e) => {
                // Нельзя тащить, если магазин открыт (во избежание багов)
                if (this.isShopOpen) return; 

                const id = slot.getAttribute('data-id');
                const item = this.dataManager.getItemById(id);
                this.dragManager.startDrag(e, item);
            };
            slot.addEventListener('mousedown', onStart);
            slot.addEventListener('touchstart', onStart, { passive: false });
        });
    }

    /**
     * Показывает "BIOS" экран с результатами сборки
     */
    showMonitorOverlay(success, message, reward = 0) {
        this.monitorOverlayEl.classList.remove('hidden');
        
        let content = '';
        if (success) {
            content = `
                <h1 style="color: #00ff00;">SYSTEM BOOT: SUCCESS</h1>
                <div class="monitor-log">${message.replace(/\n/g, '<br>')}</div>
                <div class="monitor-reward">ESTIMATED VALUE: $${reward}</div>
                <button id="btn-sell-pc" class="btn-action">COMPLETE ORDER & SELL</button>
                <button id="btn-monitor-close" class="btn-secondary">BACK TO WORKBENCH</button>
            `;
        } else {
            content = `
                <h1 style="color: #ff0000;">SYSTEM BOOT: FAILED</h1>
                <div class="monitor-log">${message.replace(/\n/g, '<br>')}</div>
                <button id="btn-monitor-close" class="btn-secondary">BACK</button>
            `;
        }

        this.monitorOverlayEl.innerHTML = content;

        const btnClose = this.monitorOverlayEl.querySelector('#btn-monitor-close');
        if (btnClose) btnClose.onclick = () => this.hideMonitorOverlay();

        const btnSell = this.monitorOverlayEl.querySelector('#btn-sell-pc');
        if (btnSell) {
            btnSell.onclick = () => {
                this.mainScene.sellPC(reward);
                this.hideMonitorOverlay();
            };
        }
    }

    hideMonitorOverlay() {
        this.monitorOverlayEl.classList.add('hidden');
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
import GameStore from '../state/GameStore.js';

export default class UIManager {
    /**
     * @param {DataManager} dataManager
     * @param {LocalizationManager} locManager
     */
    constructor(dataManager, locManager) {
        this.dataManager = dataManager;
        this.loc = locManager;
        
        // Находим корневой элемент UI
        this.root = document.getElementById('ui-root');
        
        // Подписываемся на изменения в сторе
        GameStore.events.on('stateChanged', this.updateUI, this);
        GameStore.events.on('error', this.showError, this);

        this.initStructure();
        this.render();
    }

    /**
     * Создаем базовую сетку интерфейса
     */
    initStructure() {
        this.root.innerHTML = ''; // Очистка

        // 1. Хедер (Баланс)
        this.headerEl = document.createElement('div');
        this.headerEl.className = 'ui-header pointer-events-auto';
        this.root.appendChild(this.headerEl);

        // 2. Контейнер магазина
        this.shopEl = document.createElement('div');
        this.shopEl.className = 'shop-container pointer-events-auto';
        this.root.appendChild(this.shopEl);
    }

    /**
     * Основной рендер
     */
    render() {
        this.renderHeader();
        this.renderShop();
    }

    /**
     * Обновление при изменении данных
     */
    updateUI() {
        // Перерисовываем всё (в реальном проекте лучше точечно обновлять через Vue/React)
        this.renderHeader();
        this.renderShop();
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

        let html = `<h2>${title}</h2><div class="items-grid">`;

        items.forEach(item => {
            const name = this.loc.t(item.nameKey);
            const isOwned = GameStore.hasItem(item.id);
            
            // Определяем состояние кнопки
            let btnClass = isOwned ? 'btn-owned' : 'btn-buy';
            let btnText = isOwned ? this.loc.t('UI_BTN_OWNED') : `${this.loc.t('UI_BTN_BUY')} $${item.price}`;
            let disabled = isOwned ? 'disabled' : '';

            // Цветная полоска для визуализации типа
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

        // Навешиваем обработчики событий
        const buttons = this.shopEl.querySelectorAll('.btn-buy');
        buttons.forEach(btn => {
            if (!btn.disabled) {
                btn.onclick = (e) => {
                    e.stopPropagation(); // Чтобы клик не ушел в игру
                    const id = e.target.getAttribute('data-id');
                    const item = this.dataManager.getItemById(id);
                    GameStore.buyItem(item);
                };
            }
        });
    }

    showError(msgKey) {
        alert(this.loc.t(msgKey)); // Пока просто алерт
    }

    destroy() {
        GameStore.events.off('stateChanged', this.updateUI, this);
        GameStore.events.off('error', this.showError, this);
        this.root.innerHTML = '';
    }
}
import Phaser from 'phaser';

const SAVE_KEY = 'msc_save';

class GameStore {
    constructor() {
        if (GameStore.instance) {
            return GameStore.instance;
        }

        // Дефолтное состояние
        this.money = 1000;
        this.inventory = []; 
        this.installedParts = []; 
        this.currentOrder = null; // Текущий активный заказ

        this.events = new Phaser.Events.EventEmitter();

        GameStore.instance = this;
    }

    // --- SAVE / LOAD SYSTEM ---

    saveGame() {
        const state = {
            money: this.money,
            inventory: this.inventory,
            installedParts: this.installedParts,
            currentOrder: this.currentOrder
        };
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
            // console.log('Game Saved:', state);
        } catch (e) {
            console.error('Save failed:', e);
        }
    }

    loadGame() {
        try {
            const raw = localStorage.getItem(SAVE_KEY);
            if (raw) {
                const state = JSON.parse(raw);
                this.money = state.money ?? 1000;
                this.inventory = state.inventory || [];
                this.installedParts = state.installedParts || [];
                this.currentOrder = state.currentOrder || null;
                
                console.log('Game Loaded:', state);
                this.emitChange();
                return true;
            }
        } catch (e) {
            console.error('Load failed:', e);
        }
        return false;
    }

    // --- GETTERS ---

    getMoney() {
        return this.money;
    }

    getAvailableInventory() {
        const installedIds = this.installedParts.map(p => p.itemId);
        return this.inventory.filter(id => !installedIds.includes(id));
    }

    hasItem(itemId) {
        return this.inventory.includes(itemId);
    }

    getInstalledParts() {
        return this.installedParts;
    }

    getCurrentOrder() {
        return this.currentOrder;
    }

    // --- ACTIONS ---

    buyItem(item) {
        if (this.hasItem(item.id)) return false;

        if (this.money >= item.price) {
            this.money -= item.price;
            this.inventory.push(item.id);
            this.saveGame();
            this.emitChange();
            return true;
        } else {
            this.events.emit('error', 'UI_NO_FUNDS');
            return false;
        }
    }

    installPart(itemId, type) {
        if (!this.installedParts.find(p => p.itemId === itemId)) {
            this.installedParts.push({ itemId, type });
            this.saveGame();
            this.emitChange();
        }
    }

    addMoney(amount) {
        this.money += amount;
        this.saveGame();
        this.emitChange();
    }

    /**
     * Очищает список установленных деталей (продажа ПК).
     * Детали удаляются из инвентаря навсегда (считаются проданными).
     */
    clearInstalledParts() {
        // Удаляем установленные предметы из инвентаря глобально
        const installedIds = this.installedParts.map(p => p.itemId);
        this.inventory = this.inventory.filter(id => !installedIds.includes(id));
        
        this.installedParts = [];
        this.saveGame();
        this.emitChange();
    }

    setOrder(order) {
        this.currentOrder = order;
        this.saveGame();
        this.emitChange();
    }

    emitChange() {
        this.events.emit('stateChanged', {
            money: this.money,
            inventory: this.inventory,
            installedParts: this.installedParts,
            currentOrder: this.currentOrder
        });
    }
}

const instance = new GameStore();
export default instance;
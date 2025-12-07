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
        this.installedParts = []; // Хранит объекты { itemId, type }

        this.events = new Phaser.Events.EventEmitter();

        GameStore.instance = this;
    }

    // --- SAVE / LOAD SYSTEM ---

    saveGame() {
        const state = {
            money: this.money,
            inventory: this.inventory,
            installedParts: this.installedParts
        };
        try {
            localStorage.setItem(SAVE_KEY, JSON.stringify(state));
            console.log('Game Saved:', state);
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

    /**
     * Возвращает предметы, которые куплены, но еще НЕ установлены в ПК.
     */
    getAvailableInventory() {
        // Собираем ID всех установленных предметов
        const installedIds = this.installedParts.map(p => p.itemId);
        // Фильтруем инвентарь
        return this.inventory.filter(id => !installedIds.includes(id));
    }

    hasItem(itemId) {
        return this.inventory.includes(itemId);
    }

    getInstalledParts() {
        return this.installedParts;
    }

    // --- ACTIONS ---

    buyItem(item) {
        if (this.hasItem(item.id)) return false;

        if (this.money >= item.price) {
            this.money -= item.price;
            this.inventory.push(item.id);
            this.saveGame(); // Автосохранение при покупке
            this.emitChange();
            return true;
        } else {
            this.events.emit('error', 'UI_NO_FUNDS');
            return false;
        }
    }

    /**
     * Регистрирует установку детали в корпус
     */
    installPart(itemId, type) {
        // Проверка на дубликаты (на всякий случай)
        if (!this.installedParts.find(p => p.itemId === itemId)) {
            this.installedParts.push({ itemId, type });
            this.saveGame(); // Автосохранение
            this.emitChange();
        }
    }

    /**
     * (Опционально) Если мы реализуем снятие детали
     */
    removePart(itemId) {
        this.installedParts = this.installedParts.filter(p => p.itemId !== itemId);
        this.saveGame();
        this.emitChange();
    }

    emitChange() {
        this.events.emit('stateChanged', {
            money: this.money,
            inventory: this.inventory,
            installedParts: this.installedParts
        });
    }
}

const instance = new GameStore();
export default instance;
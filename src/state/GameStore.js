import Phaser from 'phaser';

/**
 * Синглтон для управления состоянием игры (Деньги, Инвентарь).
 */
class GameStore {
    constructor() {
        if (GameStore.instance) {
            return GameStore.instance;
        }

        // Данные состояния
        this.money = 1000;
        this.inventory = []; // Массив ID купленных предметов
        this.placedItems = []; // Массив ID предметов, которые уже вытащены в мир
        
        // Эмиттер событий для реактивности
        this.events = new Phaser.Events.EventEmitter();

        GameStore.instance = this;
    }

    getMoney() {
        return this.money;
    }

    getInventory() {
        return this.inventory;
    }

    /**
     * Возвращает предметы, которые куплены, но еще не выставлены в мир
     */
    getAvailableInventory() {
        return this.inventory.filter(id => !this.placedItems.includes(id));
    }

    hasItem(itemId) {
        return this.inventory.includes(itemId);
    }

    canAfford(amount) {
        return this.money >= amount;
    }

    buyItem(item) {
        if (this.hasItem(item.id)) {
            return false;
        }

        if (this.canAfford(item.price)) {
            this.money -= item.price;
            this.inventory.push(item.id);
            this.emitChange();
            return true;
        } else {
            this.events.emit('error', 'UI_NO_FUNDS');
            return false;
        }
    }

    /**
     * Помечает предмет как размещенный в мире (убирает из UI инвентаря)
     */
    markAsPlaced(itemId) {
        if (this.inventory.includes(itemId) && !this.placedItems.includes(itemId)) {
            this.placedItems.push(itemId);
            this.emitChange();
        }
    }

    emitChange() {
        this.events.emit('stateChanged', {
            money: this.money,
            inventory: this.inventory,
            placedItems: this.placedItems
        });
    }
}

const instance = new GameStore();
export default instance;
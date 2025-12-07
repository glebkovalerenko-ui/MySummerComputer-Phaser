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
        this.inventory = []; // Массив ID предметов
        
        // Эмиттер событий для реактивности
        this.events = new Phaser.Events.EventEmitter();

        GameStore.instance = this;
    }

    /**
     * Получить текущий баланс
     */
    getMoney() {
        return this.money;
    }

    /**
     * Получить весь инвентарь
     */
    getInventory() {
        return this.inventory;
    }

    /**
     * Проверка владения предметом
     */
    hasItem(itemId) {
        return this.inventory.includes(itemId);
    }

    /**
     * Проверка, хватает ли денег
     */
    canAfford(amount) {
        return this.money >= amount;
    }

    /**
     * Покупка предмета
     */
    buyItem(item) {
        if (this.hasItem(item.id)) {
            console.log('Already owned');
            return false;
        }

        if (this.canAfford(item.price)) {
            this.money -= item.price;
            this.inventory.push(item.id);
            
            // Уведомляем всех подписчиков (UI), что состояние изменилось
            this.emitChange();
            return true;
        } else {
            console.log('Not enough money');
            this.events.emit('error', 'UI_NO_FUNDS');
            return false;
        }
    }

    emitChange() {
        this.events.emit('stateChanged', {
            money: this.money,
            inventory: this.inventory
        });
    }
}

// Экспортируем готовый экземпляр
const instance = new GameStore();
export default instance;
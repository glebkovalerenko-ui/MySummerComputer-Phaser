import GameStore from '../state/GameStore.js';

export default class OrderManager {
    constructor(dataManager) {
        this.dataManager = dataManager;
    }

    /**
     * Создает новый случайный заказ, если текущего нет.
     */
    generateNewOrderIfNeeded() {
        if (GameStore.getCurrentOrder()) return;

        const types = ['Office PC', 'Gaming PC', 'Workstation'];
        const requirements = [
            { type: 'CPU', label: 'Processor' },
            { type: 'GPU', label: 'Graphics Card' },
            { type: 'RAM', label: 'Memory' }
        ];

        const randomType = types[Math.floor(Math.random() * types.length)];
        const randomReq = requirements[Math.floor(Math.random() * requirements.length)];

        const order = {
            id: Date.now(),
            title: randomType,
            description: `Build a PC with at least one ${randomReq.label}.`,
            requiredType: randomReq.type,
            baseBudget: 200 + Math.floor(Math.random() * 300)
        };

        GameStore.setOrder(order);
        console.log('New Order Generated:', order);
    }

    /**
     * Проверяет, выполнены ли условия заказа.
     * @param {Array} installedParts - массив объектов деталей
     */
    checkOrderCompletion(installedParts) {
        const order = GameStore.getCurrentOrder();
        if (!order) return { success: false, error: "No active order" };

        // Проверяем наличие требуемого компонента
        const hasRequirement = installedParts.some(part => part.itemData.type === order.requiredType);
        
        if (!hasRequirement) {
            return { success: false, error: `Missing required component: ${order.requiredType}` };
        }

        // Расчет награды: Базовый бюджет + стоимость деталей
        let partsValue = 0;
        installedParts.forEach(p => {
            partsValue += (p.itemData.price || 0);
        });

        const reward = order.baseBudget + partsValue;

        return { success: true, reward };
    }

    completeCurrentOrder() {
        GameStore.setOrder(null);
        this.generateNewOrderIfNeeded();
    }
}
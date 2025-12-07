export default class DataManager {
    constructor(scene) {
        this.scene = scene;
        this.items = [];
        this.init();
    }

    init() {
        // 'items_db' — ключ, под которым мы загрузим JSON в BootScene
        if (this.scene.cache.json.exists('items_db')) {
            this.items = this.scene.cache.json.get('items_db');
        } else {
            console.error('DataManager: items_db not found in cache!');
        }
    }

    getAllItems() {
        return this.items;
    }

    getItemById(id) {
        return this.items.find(item => item.id === id);
    }
}
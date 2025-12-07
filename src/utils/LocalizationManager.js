import Phaser from 'phaser';

export default class LocalizationManager {
    /**
     * @param {Phaser.Scene} scene - Сцена для доступа к кэшу
     * @param {string} locale - Текущая локаль ('ru' или 'en')
     */
    constructor(scene, locale = 'ru') {
        this.scene = scene;
        this.locale = locale;
        this.dictionary = {};
        
        this.loadDictionary();
    }

    loadDictionary() {
        // Берем JSON из кэша Phaser, загруженный в BootScene
        // Ключи загрузки: 'loc_ru', 'loc_en'
        const cacheKey = `loc_${this.locale}`;
        
        if (this.scene.cache.json.exists(cacheKey)) {
            this.dictionary = this.scene.cache.json.get(cacheKey);
        } else {
            console.warn(`LocalizationManager: Locale '${this.locale}' not found in cache.`);
        }
    }

    /**
     * Перевод ключа.
     * @param {string} key - Ключ строки (напр. "UI_BTN_BUY")
     * @returns {string} Переведенный текст или сам ключ, если перевод не найден
     */
    t(key) {
        return this.dictionary[key] || key;
    }

    setLocale(newLocale) {
        this.locale = newLocale;
        this.loadDictionary();
    }
}
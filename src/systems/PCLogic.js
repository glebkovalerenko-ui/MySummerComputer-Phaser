import InstalledPart from '../game/InstalledPart.js';

export default class PCLogic {
    /**
     * Проверяет правильность сборки ПК.
     * @param {Phaser.GameObjects.Container} pcCase - Контейнер корпуса
     * @returns {Object} { success: boolean, error: string|null }
     */
    static checkBuild(pcCase) {
        // 1. Собираем все установленные детали внутри контейнера
        // Фильтруем children, проверяя, является ли объект экземпляром InstalledPart
        const parts = pcCase.list.filter(child => child instanceof InstalledPart);
        
        // Получаем список типов установленных деталей
        const installedTypes = parts.map(part => part.itemData.type);

        // 2. Правила обязательных компонентов
        const required = ['CPU', 'RAM', 'GPU'];
        
        for (const type of required) {
            if (!installedTypes.includes(type)) {
                return { success: false, error: `MISSING_${type}` };
            }
        }

        // 3. Проверка: все ли детали полностью прикручены
        const loosePart = parts.find(part => !part.isFullyInstalled);
        
        if (loosePart) {
            return { 
                success: false, 
                error: 'SCREWS_LOOSE' // "Не закручены винты"
            };
        }

        // Если дошли сюда — все отлично
        return { success: true, error: null };
    }
}
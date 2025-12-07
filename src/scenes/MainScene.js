import Phaser from 'phaser';
import InputManager from '../utils/InputManager.js';

export default class MainScene extends Phaser.Scene {
    constructor() {
        super({ key: 'MainScene' });
    }

    create() {
        // 1. Инициализация InputManager
        this.inputManager = new InputManager(this);

        // 2. Создаем игровой объект (Спрайт) по центру экрана
        // Используем текстуру 'red_square', созданную в BootScene
        const centerX = this.cameras.main.width / 2;
        const centerY = this.cameras.main.height / 2;
        
        this.playerSprite = this.add.sprite(centerX, centerY, 'red_square');
        this.playerSprite.setInteractive(); // Делаем спрайт интерактивным внутри Phaser

        // 3. Добавляем HTML UI кнопку
        this.createUiOverlay();

        // 4. (Опционально) Пример использования InputManager для клика по HTML
        // Добавляем слушатель на весь документ, чтобы проверить конвертацию координат
        document.addEventListener('mousedown', (e) => {
            // Для теста выводим в консоль, где это место в мире Phaser
            const worldPoint = this.inputManager.getPhaserCoordinates(e, this.cameras.main);
            // console.log(`DOM Click -> World Coords: x=${worldPoint.x}, y=${worldPoint.y}`);
        });
    }

    /**
     * Создает HTML элементы интерфейса поверх канваса.
     * В реальном проекте лучше использовать UI-фреймворк (Vue/React/Svelte)
     * или шаблонизатор, но здесь делаем на чистом JS.
     */
    createUiOverlay() {
        // Находим слой UI в DOM
        const uiLayer = document.getElementById('ui-layer');
        if (!uiLayer) return;

        // Создаем кнопку
        const btn = document.createElement('button');
        btn.innerText = 'Тест UI: Вращать';
        btn.className = 'test-button pointer-events-auto'; // Добавляем класс для включения кликов

        // Обработчик клика по HTML кнопке
        btn.onclick = (e) => {
            // Предотвращаем всплытие, хотя pointer-events на слое UI это и так решают
            e.stopPropagation(); 
            this.handleUiButtonClick();
        };

        // Добавляем кнопку в DOM
        uiLayer.appendChild(btn);

        // Сохраняем ссылку для удаления при выключении сцены
        this.uiButton = btn;
    }

    /**
     * Логика, которая выполняется при нажатии на HTML кнопку.
     */
    handleUiButtonClick() {
        // Вращаем спрайт на 45 градусов
        this.playerSprite.angle += 45;

        // Добавляем небольшую анимацию твина для плавности
        this.tweens.add({
            targets: this.playerSprite,
            scaleX: 1.2,
            scaleY: 1.2,
            duration: 100,
            yoyo: true,
            ease: 'Sine.easeInOut'
        });
    }

    /**
     * Очистка при смене сцены (важно для SPA приложений)
     */
    shutdown() {
        if (this.uiButton) {
            this.uiButton.remove();
        }
    }
}
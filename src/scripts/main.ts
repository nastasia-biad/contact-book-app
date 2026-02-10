import { UI } from './UI';

document.addEventListener('DOMContentLoaded', async () => {
    try {
        await UI.initialize();
        console.log('Приложение инициализировано');
    } catch (error) {
        console.error('Ошибка при инициализации UI:', error);
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f44336;
            color: white;
            padding: 15px;
            text-align: center;
            font-family: Arial, sans-serif;
            font-size: 14px;
            z-index: 10000;
        `;
        errorDiv.innerHTML = `
            <strong>Ошибка загрузки приложения</strong><br>
            Пожалуйста, обновите страницу или проверьте подключение к интернету.
            <button onclick="location.reload()" style="
                margin-left: 10px;
                background: white;
                color: #f44336;
                border: none;
                padding: 5px 10px;
                border-radius: 3px;
                cursor: pointer;
            ">Обновить</button>
        `;
        document.body.appendChild(errorDiv);
    }
});

export { UI };
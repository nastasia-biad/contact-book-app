export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastConfig {
    message: string;
    type: ToastType;
    duration?: number;
    closeable?: boolean;
}

export class ToastManager {
    private static container: HTMLElement | null = null;
    private static toastCount = 0;
    private static readonly MAX_TOASTS = 5;


    static initialize(): void {
        this.container = document.getElementById('toastContainer');

        if (!this.container) {
            this.container = document.createElement('div');
            this.container.className = 'toast-container';
            this.container.id = 'toastContainer';
            document.body.appendChild(this.container);
        }
    }

    static show(config: ToastConfig): void {
        if (!this.container) {
            this.initialize();
        }

        if (this.toastCount >= this.MAX_TOASTS) {
            const firstToast = this.container!.firstElementChild;
            if (firstToast) {
                this.hide(firstToast as HTMLElement);
            }
        }

        const toast = document.createElement('div');
        toast.className = `toast toast--${config.type}`;
        toast.setAttribute('role', 'alert');
        toast.setAttribute('aria-live', 'polite');

        const toastId = `toast-${Date.now()}`;
        toast.id = toastId;

        const message = document.createElement('div');
        message.className = 'toast__message';
        message.textContent = config.message;
        toast.appendChild(message);

        if (config.closeable !== false) {
            const closeButton = document.createElement('button');
            closeButton.className = 'toast__close';
            closeButton.setAttribute('aria-label', 'Закрыть уведомление');
            closeButton.innerHTML = `
                <img src="./assets/img/close-white.png" alt="Закрыть" class="toast__close-icon">
            `;

            closeButton.addEventListener('click', () => this.hide(toast));
            toast.appendChild(closeButton);
        }

        this.container!.appendChild(toast);
        this.toastCount++;

        if (config.duration !== 0) {
            const duration = config.duration || 5000;
            setTimeout(() => this.hide(toast), duration);
        }

        const toasts = this.container!.querySelectorAll('.toast');
        if (toasts.length > this.MAX_TOASTS) {
            const oldestToast = toasts[0];
            this.hide(oldestToast as HTMLElement);
        }
    }

    private static hide(toast: HTMLElement): void {
        if (!toast.parentNode) {
            return;
        }

        toast.classList.add('closing');

        setTimeout(() => {
            if (toast.parentNode === this.container) {
                this.container!.removeChild(toast);
                this.toastCount--;
            }
        }, 300);
    }


    static success(message: string, duration?: number): void {
        this.show({
            message,
            type: 'success',
            duration,
            closeable: true
        });
    }


    static error(message: string, duration?: number): void {
        this.show({
            message,
            type: 'error',
            duration: duration || 7000,
            closeable: true
        });
    }

    static info(message: string, duration?: number): void {
        this.show({
            message,
            type: 'info',
            duration,
            closeable: true
        });
    }


    static warning(message: string, duration?: number): void {
        this.show({
            message,
            type: 'warning',
            duration,
            closeable: true
        });
    }


    static clearAll(): void {
        if (!this.container) {
            return;
        }

        const toasts = this.container.querySelectorAll('.toast');
        toasts.forEach(toast => {
            this.hide(toast as HTMLElement);
        });

        this.toastCount = 0;
    }
}
declare module './utils/toast' {
    export class ToastManager {
        static initialize(): void;
        static success(message: string, duration?: number): void;
        static error(message: string, duration?: number): void;
        static info(message: string, duration?: number): void;
        static warning(message: string, duration?: number): void;
        static clearAll(): void;
    }
}

declare global {
    interface Window {
        IMask?: any;
    }
}

export {}; 
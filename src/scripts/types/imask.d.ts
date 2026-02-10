declare module 'imask' {
  export type OverwriteMode = boolean | 'shift' | 'shift-only';
  
  export interface IMaskOptions {
    mask: string | Array<{ mask: string }> | ((value: string) => Array<{ mask: string }>);
    lazy?: boolean;
    placeholderChar?: string;
    overwrite?: OverwriteMode;
    autofix?: boolean;
    definitions?: {
      [key: string]: {
        validator: string | RegExp | ((ch: string) => boolean);
        definitionSymbol?: string;
        [key: string]: any;
      };
    };
    [key: string]: any;
  }

  export interface IMaskInstance {
    destroy(): void;
    updateValue(): void;
    updateOptions(options: IMaskOptions): void;
    readonly value: string;
    readonly unmaskedValue: string;
    readonly typedValue: any;
    readonly displayValue: string;
  }

  export interface IMaskFactory {
    (el: HTMLElement, opts: IMaskOptions): IMaskInstance;
    create<T = any>(el: HTMLElement, opts: IMaskOptions): IMaskInstance;
  }

  const IMask: IMaskFactory;
  export default IMask;
}
declare module "signature_pad" {
  export default class SignaturePad {
    constructor(canvas: HTMLCanvasElement, options?: Record<string, unknown>);
    addEventListener(type: string, listener: () => void): void;
    clear(): void;
    off(): void;
    isEmpty(): boolean;
    toDataURL(type?: string): string;
    fromDataURL(dataUrl: string): void;
  }
}

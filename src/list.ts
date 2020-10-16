export interface VirtualizationDelegate {
  createElement(): HTMLElement;
  updateElement(child: HTMLElement, index: number): void;
  length: number;
}

export declare type Range = [number, number];

export interface ScrollCell {
  index: number;
  node: HTMLElement;
}
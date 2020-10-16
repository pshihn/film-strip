import { debounce } from './helpers.js';
import { VirtualizationDelegate, Range, ScrollCell } from './list.js';
export { VirtualizationDelegate } from './list.js';

export class HorizVirtualList {
  itemwidth: number = 100;
  buffer: number = 4;
  resizeDebounceInterval = 250;
  private count = 0;
  private scrollElement?: HTMLElement;
  private container: HTMLElement;
  private cells: ScrollCell[] = [];
  private _delegate?: VirtualizationDelegate;
  private scrollHandler = () => this.position();
  private resizeHandler?: EventListener;
  private currentRenderRange: Range = [-1, -1];
  private renderRanegDirty = false;

  constructor(container: HTMLElement, scrollElement?: HTMLElement) {
    this.container = container;
    this.scrollElement = scrollElement;
  }

  set delegate(value: VirtualizationDelegate) {
    this._delegate = value;
    this.refresh();
  }

  private get scroller(): HTMLElement {
    return this.scrollElement || this.container.parentElement || document.body;
  }

  clear() {
    while (this.container.hasChildNodes() && this.container.lastChild) {
      this.container.removeChild(this.container.lastChild);
    }
    this.cells = [];
    this.scroller.removeEventListener('scroll', this.scrollHandler);
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
    }
  }

  private refresh() {
    this.clear();
    this.count = this._delegate ? this._delegate.length : 0;
    const totalWidth = this.count * this.itemwidth;
    this.container.style.minWidth = `${totalWidth}px`;
    this.renderRanegDirty = true;
    this.position();
    this.scroller.addEventListener('scroll', this.scrollHandler);
    this.resizeHandler = debounce(this.position.bind(this), this.resizeDebounceInterval, false, this);
    window.addEventListener('resize', this.resizeHandler);
  }

  position() {
    if (!this._delegate) {
      return;
    }
    const ranges = this.computeRanges();
    const renderRange = ranges[1];
    if (!this.renderRanegDirty) {
      if (renderRange[0] === this.currentRenderRange[0] && renderRange[1] === this.currentRenderRange[1]) {
        return;
      }
    }
    this.renderRanegDirty = false;
    this.currentRenderRange = renderRange;
    const doNotTouchCells = new Map<number, ScrollCell>();
    const spareCells = this.cells.filter((c) => {
      if (c.index < renderRange[0] || c.index > renderRange[1]) {
        return true;
      }
      doNotTouchCells.set(c.index, c);
      return false;
    });
    const indicesToRender = [];
    for (let i = renderRange[0]; i <= renderRange[1]; i++) {
      if (!doNotTouchCells.has(i)) {
        indicesToRender.push(i);
      }
    }
    while (indicesToRender.length && spareCells.length) {
      const i = indicesToRender.shift()!;
      const cell = spareCells.shift()!;
      cell.index = i;
      this._delegate.updateElement(cell.node, i);
      this.positionCell(cell.node, i);
      doNotTouchCells.set(i, cell);
    }
    while (spareCells.length) {
      const cell = spareCells.shift()!;
      this.container.removeChild(cell.node);
    }
    while (indicesToRender.length) {
      const i = indicesToRender.shift()!;
      const node = this._delegate.createElement();
      node.style.position = 'absolute';
      this.container.appendChild(node);
      this._delegate.updateElement(node, i);
      this.positionCell(node, i);
      doNotTouchCells.set(i, { index: i, node });
    }
    this.cells = Array.from(doNotTouchCells.values());
  }

  private positionCell(cell: HTMLElement, index: number) {
    cell.style.transform = `translate(${Math.round(index * this.itemwidth)}px, 0)`;
  }

  private computeRanges(): Range[] {
    const swidth = (this.count * this.itemwidth) || 1;
    const min = Math.max(0, Math.min(this.count - 1, Math.floor((this.scroller.scrollLeft / (swidth || 1)) * this.count)));
    const max = Math.max(0, Math.min(this.count - 1, Math.floor(((this.scroller.scrollLeft + this.scroller.getBoundingClientRect().width) / (swidth || 1)) * this.count)));
    const pre = Math.max(0, min - Math.floor(this.buffer / 2));
    const post = Math.min(this.count - 1, max + this.buffer - (min - pre));
    return [[min, max], [pre, post]];
  }

  scrollToIndex(index: number) {
    if (this._delegate && Number.isFinite(index)) {
      index = Math.min(this._delegate.length, Math.max(0, index));
      this.scroller.scrollLeft = index * this.itemwidth;
    }
  }
}
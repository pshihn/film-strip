import { HorizVirtualList } from './horiz-virtual-list.js';
import { VirtualizationDelegate } from './list.js';

export class FilmStripListElement extends HTMLElement {
  private root: ShadowRoot;
  private vl?: HorizVirtualList;
  private _connected = false;
  private _delegate?: VirtualizationDelegate;
  private _itemwidth = 100;
  private _buffer = 2;
  private updateDeferred = false;

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = `
    <style>
      :host {
        display: block;
        overflow: auto;
        box-sizing: border-box;
        width: 100%;
        height: var(--virtual-list-height, 100px);
      }
      #container {
        position: relative;
        height: var(--virtual-list-height, 100px);
        box-sizing: border-box;
      }
    </style>
    <div id="container"></div>
    `;
  }

  connectedCallback() {
    this._connected = true;
    this.update();
  }

  disconnectedCallback() {
    this._connected = false;
    this.updateDeferred = false;
    if (this.vl) {
      this.vl.clear();
      delete this.vl;
    }
  }

  set itemWidth(value: number) {
    if (this._itemwidth !== value) {
      this._itemwidth = value;
      this.update();
    }
  }

  set buffer(value: number) {
    if (this._buffer !== value) {
      this._buffer = value;
      this.update();
    }
  }

  set delegate(value: VirtualizationDelegate) {
    this._delegate = value;
    if (this.vl) {
      this.vl.delegate = value;
    }
  }

  private update() {
    if (!this.updateDeferred) {
      this.updateDeferred = true;
      Promise.resolve().then(() => {
        this.updateDeferred = false;
        this.doUpdate();
      });
    }
  }

  private doUpdate() {
    if (this._connected) {
      if (!this.vl) {
        this.vl = new HorizVirtualList(this.shadowRoot!.querySelector('#container') as HTMLElement, this);
      }
      this.vl.itemwidth = this._itemwidth;
      this.vl.buffer = this._buffer;
      if (this._delegate) {
        this.vl.delegate = this._delegate;
      }
    }
  }

  refresh() {
    if (this.vl) {
      this.vl.position();
    }
  }

  scrollToIndex(index: number) {
    if (this.vl) {
      this.vl.scrollToIndex(index);
    }
  }

  get container(): HTMLElement {
    return this.shadowRoot!.querySelector('#container') as HTMLElement;
  }
}
customElements.define('film-strip-list', FilmStripListElement);
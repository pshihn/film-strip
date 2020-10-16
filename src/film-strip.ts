import { FilmStripListElement } from './list-element';
import { VideoManager } from './video-manager.js';
import { VirtualizationDelegate } from './list';

import './list-element';

export class FilmStrip extends HTMLElement implements VirtualizationDelegate {
  static get observedAttributes() { return ['src', 'type', 'rate', 'height']; }

  private root: ShadowRoot;
  private connected = false;
  private _src = '';
  private _type = 'video/mp4';
  private vm?: VideoManager;
  private _video?: HTMLVideoElement;
  private _strip?: FilmStripListElement;

  private _rate = 10;
  private videoDuration = 0;
  private frameCount = 0;
  private cellHeight = 100;
  private cellWidth = 100;
  private cellGap = 12;
  private frameIndexMap = new WeakMap<HTMLElement, number>();

  constructor() {
    super();
    this.root = this.attachShadow({ mode: 'open' });
    this.root.innerHTML = `
    <style>
      :host {
        display: block;
        position: relative;
      }
      #videoShell {
        position: absolute;
        top: 0;
        left: 0;
        overflow: hidden;
        width: 0px;
        height: 0px;
        opacity: 0;
        pointer-events: none;
      }
      film-strip-list {
        -webkit-overflow-scrolling: touch;
        overflow-x: auto;
        overflow-y: hidden;
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
      film-strip-list::-webkit-scrollbar {
        width: 0px;
        height: 0px;
        background: transparent;
      }
    </style>
    <film-strip-list></film-strip-list>
    <div id="videoShell">
      <video preload="none" playsinline webkit-playsinline muted></video>
    </div>
    `;
  }

  connectedCallback() {
    this.connected = true;
    this.reload();
  }

  disconnectedCallback() {
    this.connected = false;
  }

  attributeChangedCallback(name: string, _: string, newValue: string) {
    (this as any)[name] = newValue;
  }

  get src(): string {
    return this._src;
  }

  set src(value: string) {
    if (value !== this._src) {
      this._src = value;
      this.reload();
    }
  }

  get type(): string {
    return this._type;
  }

  set type(value: string) {
    if (value !== this._type) {
      this._type = value;
      this.reload();
    }
  }

  get rate(): number {
    return this._rate;
  }

  set rate(value: number) {
    value = +value;
    if (value !== this._rate) {
      this._rate = value;
      this.reload();
    }
  }

  get height(): number {
    return this.cellHeight;
  }

  set height(value: number) {
    value = +value;
    if (value !== this.cellHeight) {
      this.cellHeight = value;
      this.reload();
    }
  }

  private get video(): HTMLVideoElement {
    if (!this._video) {
      this._video = this.root.querySelector('video')!;
    }
    return this._video;
  }

  private get strip(): FilmStripListElement {
    if (!this._strip) {
      this._strip = this.root.querySelector<FilmStripListElement>('film-strip-list')!;
    }
    return this._strip;
  }

  private async reload() {
    if (this.connected && this._src) {
      if (!this.vm) {
        this.vm = new VideoManager(this.video);
      }

      // load video
      await this.vm.loadVideo(this._src);

      // compute frames
      const { duration, width, height } = this.vm.metadata;
      this.frameCount = Math.ceil(this.rate * duration);
      this.videoDuration = duration;
      if (width && height) {
        this.cellWidth = Math.round((width / height) * this.cellHeight);
        this.strip.itemWidth = this.cellWidth + this.cellGap;
        this.strip.style.setProperty('--virtual-list-height', `${this.cellHeight + this.cellGap}px`);
      }

      // set delegate
      this.strip.delegate = this;
    }
  }

  get length(): number {
    return this.frameCount;
  }

  createElement(): HTMLElement {
    const canvas = document.createElement('canvas');
    canvas.style.display = 'block';
    canvas.style.marginLeft = `${this.cellGap / 2}px`;
    canvas.style.marginTop = `${this.cellGap / 2}px`;
    canvas.width = this.cellWidth;
    canvas.height = this.cellHeight;
    return canvas;
  }

  updateElement(child: HTMLElement, index: number): void {
    const canvas = child as HTMLCanvasElement;
    this.frameIndexMap.set(canvas, index);
    this.renderFrame(index, canvas);
  }

  private async renderFrame(index: number, canvas: HTMLCanvasElement) {
    const timestamp = Math.max(0, Math.min(this.videoDuration, index / this.rate));
    await this.vm!.seekCapture(canvas, timestamp);
  }
}
customElements.define('film-strip', FilmStrip);
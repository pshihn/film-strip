import { Cache } from './cache.js';

export interface MediaSource {
  url: string;
  mime: string;
}

export interface MediaTask {
  run(video: HTMLVideoElement): Promise<void>;
}

export class SourceTask implements MediaTask {
  private sources: MediaSource[];

  constructor(sources: MediaSource[]) {
    this.sources = sources;
  }

  async run(video: HTMLVideoElement): Promise<void> {
    while (video.lastChild) {
      video.removeChild(video.lastChild);
    }
    for (const source of this.sources) {
      const se = document.createElement('source');
      se.setAttribute('src', source.url);
      se.setAttribute('type', source.mime);
      video.appendChild(se);
    }
    return Promise.resolve();
  }
}

export class LoadTask implements MediaTask {
  async run(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve, reject) => {
      const removeListeners = () => {
        video.removeEventListener('loadeddata', loadCallback);
        video.removeEventListener('error', failCallback);
      };
      const loadCallback = () => { removeListeners(); resolve(); };
      const failCallback = () => { removeListeners(); reject(); };

      video.addEventListener('loadeddata', loadCallback);
      video.addEventListener('error', failCallback);
      video.load();
    });
  }
}

export class SeekTask implements MediaTask {
  private time: number;

  constructor(time: number) {
    this.time = time;
  }

  async run(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const removeListeners = () => {
        video.removeEventListener('seeked', seekCallback);
      };
      const seekCallback = () => {
        removeListeners();
        resolve();
      };
      video.addEventListener('seeked', seekCallback);
      video.currentTime = this.time;
    });
  }
}

const canvasCahe = new Cache<number, HTMLCanvasElement>();

export class SeekCaptureTask implements MediaTask {
  private time: number;
  private canvas: HTMLCanvasElement;

  constructor(canvas: HTMLCanvasElement, time: number) {
    this.canvas = canvas;
    this.time = time;
  }

  private seek(video: HTMLVideoElement): Promise<void> {
    return new Promise((resolve) => {
      const removeListeners = () => {
        video.removeEventListener('seeked', seekCallback);
      };
      const seekCallback = () => {
        removeListeners();
        resolve();
      };
      video.addEventListener('seeked', seekCallback);
      video.currentTime = this.time;
    });
  }

  async run(video: HTMLVideoElement): Promise<void> {
    const ctx = this.canvas.getContext('2d')!;
    const { width, height } = this.canvas;
    let cached = canvasCahe.get(this.time);
    if (!cached) {
      await this.seek(video);
      cached = document.createElement('canvas');
      cached.width = width;
      cached.height = height;
      const ctx2 = cached.getContext('2d')!;
      ctx2.drawImage(video, 0, 0, width, height);
      canvasCahe.set(this.time, cached);
    }
    ctx.drawImage(cached, 0, 0);
  }
}

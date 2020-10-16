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
    await this.seek(video);

    const ctx = this.canvas.getContext('2d')!;
    const { width, height } = this.canvas;
    ctx.drawImage(video, 0, 0, video.videoWidth, video.videoHeight, 0, 0, width, height);
  }
}

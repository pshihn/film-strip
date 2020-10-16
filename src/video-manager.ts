import { LoadTask, MediaTask, SourceTask, SeekCaptureTask } from './media-task';

interface PromiseFunctions {
  resolve: any;
  reject: any;
}

export interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
}

export class VideoManager {
  private video: HTMLVideoElement;
  private tasks: MediaTask[] = [];
  private map = new Map<MediaTask, PromiseFunctions>();

  constructor(video: HTMLVideoElement) {
    this.video = video;
  }

  private enqueue(task: MediaTask): Promise<void> {
    return new Promise((resolve, reject) => {
      const running = this.tasks.length !== 0;
      this.tasks.push(task);
      this.map.set(task, { resolve, reject });
      if (!running) {
        this.executeNext();
      }
    });
  }

  private executeNext() {
    if (this.tasks.length === 0) {
      return;
    }
    const task = this.tasks[0];
    const run = async () => {
      this.tasks.shift();
      const pf = this.map.get(task);
      if (pf) {
        this.map.delete(task);
        try {
          await task.run(this.video);
          pf.resolve();
        } catch (err) {
          pf.reject(err);
        }
      }
      this.executeNext();
    };
    window.setTimeout(() => run(), 0);
  }

  get metadata(): VideoMetadata {
    return {
      duration: this.video.duration,
      width: this.video.videoWidth,
      height: this.video.videoHeight
    };
  }

  async loadVideo(url: string, type = 'video/mp4'): Promise<void> {
    this.enqueue(new SourceTask([
      {
        url,
        mime: type
      }
    ]));
    return this.enqueue(new LoadTask());
  }

  async seekCapture(canvas: HTMLCanvasElement, timestamp: number): Promise<void> {
    return this.enqueue(new SeekCaptureTask(canvas, timestamp));
  }
}
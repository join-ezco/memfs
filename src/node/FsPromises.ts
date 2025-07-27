import { isReadableStream, promisify, streamToBuffer } from './util';
import { constants } from '../constants';
import type * as opts from './types/options';
import type * as misc from './types/misc';
import type { FsCallbackApi, FsPromisesApi } from './types';

// AsyncIterator implementation for promises.watch
class FSWatchAsyncIterator implements AsyncIterableIterator<{ eventType: string; filename: string | Buffer }> {
  private watcher: any;
  private eventQueue: Array<{ eventType: string; filename: string | Buffer }> = [];
  private resolveQueue: Array<{ resolve: Function; reject: Function }> = [];
  private finished = false;
  private abortController?: AbortController;
  private maxQueue: number;
  private overflow: 'ignore' | 'throw';

  constructor(
    private fs: any,
    private path: misc.PathLike,
    private options: opts.IWatchOptions = {},
  ) {
    this.maxQueue = options.maxQueue || 2048;
    this.overflow = options.overflow || 'ignore';
    this.startWatching();

    // Handle AbortSignal
    if (options.signal) {
      if (options.signal.aborted) {
        this.finish();
        return;
      }
      options.signal.addEventListener('abort', () => {
        this.finish();
      });
    }
  }

  private startWatching() {
    try {
      this.watcher = this.fs.watch(this.path, this.options, (eventType: string, filename: string) => {
        this.enqueueEvent({ eventType, filename });
      });
    } catch (error) {
      // If we can't start watching, finish immediately
      this.finish();
      throw error;
    }
  }

  private enqueueEvent(event: { eventType: string; filename: string | Buffer }) {
    if (this.finished) return;

    // Handle queue overflow
    if (this.eventQueue.length >= this.maxQueue) {
      if (this.overflow === 'throw') {
        const error = new Error(`Watch queue overflow: more than ${this.maxQueue} events queued`);
        this.finish(error);
        return;
      } else {
        // 'ignore' - drop the oldest event
        this.eventQueue.shift();
        console.warn(`Watch queue overflow: dropping event due to exceeding maxQueue of ${this.maxQueue}`);
      }
    }

    this.eventQueue.push(event);

    // If there's a waiting promise, resolve it
    if (this.resolveQueue.length > 0) {
      const { resolve } = this.resolveQueue.shift()!;
      const nextEvent = this.eventQueue.shift()!;
      resolve({ value: nextEvent, done: false });
    }
  }

  private finish(error?: Error) {
    if (this.finished) return;
    this.finished = true;

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    // Resolve or reject all pending promises
    while (this.resolveQueue.length > 0) {
      const { resolve, reject } = this.resolveQueue.shift()!;
      if (error) {
        reject(error);
      } else {
        resolve({ value: undefined, done: true });
      }
    }
  }

  async next(): Promise<IteratorResult<{ eventType: string; filename: string | Buffer }>> {
    if (this.finished) {
      return { value: undefined, done: true };
    }

    // If we have queued events, return one
    if (this.eventQueue.length > 0) {
      const event = this.eventQueue.shift()!;
      return { value: event, done: false };
    }

    // Otherwise, wait for the next event
    return new Promise((resolve, reject) => {
      this.resolveQueue.push({ resolve, reject });
    });
  }

  async return(): Promise<IteratorResult<{ eventType: string; filename: string | Buffer }>> {
    this.finish();
    return { value: undefined, done: true };
  }

  async throw(error: any): Promise<IteratorResult<{ eventType: string; filename: string | Buffer }>> {
    this.finish(error);
    throw error;
  }

  [Symbol.asyncIterator](): AsyncIterableIterator<{ eventType: string; filename: string | Buffer }> {
    return this;
  }
}

export class FsPromises implements FsPromisesApi {
  public readonly constants = constants;


  public readonly cp: FsPromisesApi['cp'];
  public readonly opendir: FsPromisesApi['opendir'];
  public readonly statfs: FsPromisesApi['statfs'];
  public readonly lutimes: FsPromisesApi['lutimes'];
  public readonly access: FsPromisesApi['access'];
  public readonly chmod: FsPromisesApi['chmod'];
  public readonly chown: FsPromisesApi['chown'];
  public readonly copyFile: FsPromisesApi['copyFile'];
  public readonly lchmod: FsPromisesApi['lchmod'];
  public readonly lchown: FsPromisesApi['lchown'];
  public readonly link: FsPromisesApi['link'];
  public readonly lstat: FsPromisesApi['lstat'];
  public readonly mkdir: FsPromisesApi['mkdir'];
  public readonly mkdtemp: FsPromisesApi['mkdtemp'];
  public readonly readdir: FsPromisesApi['readdir'];
  public readonly readlink: FsPromisesApi['readlink'];
  public readonly realpath: FsPromisesApi['realpath'];
  public readonly rename: FsPromisesApi['rename'];
  public readonly rmdir: FsPromisesApi['rmdir'];
  public readonly rm: FsPromisesApi['rm'];
  public readonly stat: FsPromisesApi['stat'];
  public readonly symlink: FsPromisesApi['symlink'];
  public readonly truncate: FsPromisesApi['truncate'];
  public readonly unlink: FsPromisesApi['unlink'];
  public readonly utimes: FsPromisesApi['utimes'];

  public readonly readFile: FsPromisesApi['readFile'];
  public readonly appendFile: FsPromisesApi['appendFile'];
  public readonly open: FsPromisesApi['open'];
  public readonly writeFile: FsPromisesApi['writeFile'];
  public readonly watch: FsPromisesApi['watch'];


  public constructor(
    protected readonly fs: FsCallbackApi,
    public readonly FileHandle: new (...args: unknown[]) => misc.IFileHandle,
  ) {
    this.cp = promisify(this.fs, 'cp') as FsPromisesApi['cp'];
    this.opendir = promisify(this.fs, 'opendir') as FsPromisesApi['opendir'];
    this.statfs = promisify(this.fs, 'statfs') as FsPromisesApi['statfs'];
    this.lutimes = promisify(this.fs, 'lutimes') as FsPromisesApi['lutimes'];
    this.access = promisify(this.fs, 'access') as FsPromisesApi['access'];
    this.chmod = promisify(this.fs, 'chmod') as FsPromisesApi['chmod'];
    this.chown = promisify(this.fs, 'chown') as FsPromisesApi['chown'];
    this.copyFile = promisify(this.fs, 'copyFile') as FsPromisesApi['copyFile'];
    this.lchmod = promisify(this.fs, 'lchmod') as FsPromisesApi['lchmod'];
    this.lchown = promisify(this.fs, 'lchown') as FsPromisesApi['lchown'];
    this.link = promisify(this.fs, 'link') as FsPromisesApi['link'];
    this.lstat = promisify(this.fs, 'lstat') as FsPromisesApi['lstat'];
    this.mkdir = promisify(this.fs, 'mkdir') as FsPromisesApi['mkdir'];
    this.mkdtemp = promisify(this.fs, 'mkdtemp') as FsPromisesApi['mkdtemp'];
    this.readdir = promisify(this.fs, 'readdir') as FsPromisesApi['readdir'];
    this.readlink = promisify(this.fs, 'readlink') as FsPromisesApi['readlink'];
    this.realpath = promisify(this.fs, 'realpath') as FsPromisesApi['realpath'];
    this.rename = promisify(this.fs, 'rename') as FsPromisesApi['rename'];
    this.rmdir = promisify(this.fs, 'rmdir') as FsPromisesApi['rmdir'];
    this.rm = promisify(this.fs, 'rm') as FsPromisesApi['rm'];
    this.stat = promisify(this.fs, 'stat') as FsPromisesApi['stat'];
    this.symlink = promisify(this.fs, 'symlink') as FsPromisesApi['symlink'];
    this.truncate = promisify(this.fs, 'truncate') as FsPromisesApi['truncate'];
    this.unlink = promisify(this.fs, 'unlink') as FsPromisesApi['unlink'];
    this.utimes = promisify(this.fs, 'utimes') as FsPromisesApi['utimes'];

    this.readFile = (id, options) => {
      return (promisify(this.fs, 'readFile') as FsPromisesApi['readFile'])(
        id instanceof this.FileHandle ? (id.fd as unknown as misc.TFileHandle) : (id as misc.PathLike),
        options,
      );
    };

    this.appendFile = (path, data, options) => {
      return (promisify(this.fs, 'appendFile') as FsPromisesApi['appendFile'])(
        path instanceof this.FileHandle ? (path.fd as unknown as misc.TFileHandle) : (path as misc.PathLike),
        data,
        options,
      );
    };

    this.open = (path, flags = 'r', mode?) => {
      return (promisify(this.fs, 'open', fd => new this.FileHandle(this.fs, fd)) as FsPromisesApi['open'])(
        path,
        flags,
        mode,
      );
    };

    this.writeFile = (id, data, options) => {
      const dataPromise = isReadableStream(data) ? streamToBuffer(data) : Promise.resolve(data);
      return dataPromise.then(data =>
        (promisify(this.fs, 'writeFile') as FsPromisesApi['writeFile'])(
          id instanceof this.FileHandle ? (id.fd as unknown as misc.TFileHandle) : (id as misc.PathLike),
          data,
          options,
        ),
      );
    };
  }
  public readonly writeFile = (
    id: misc.TFileHandle,
    data: misc.TPromisesData,
    options?: opts.IWriteFileOptions,
  ): Promise<void> => {
    const dataPromise = isReadableStream(data) ? streamToBuffer(data) : Promise.resolve(data);
    return dataPromise.then(data =>
      promisify(this.fs, 'writeFile')(id instanceof this.FileHandle ? id.fd : (id as misc.PathLike), data, options),
    );
  };

  public readonly watch = (
    filename: misc.PathLike,
    options?: opts.IWatchOptions | string,
  ): AsyncIterableIterator<{ eventType: string; filename: string | Buffer }> => {
    const watchOptions: opts.IWatchOptions = typeof options === 'string' ? { encoding: options as any } : options || {};
    return new FSWatchAsyncIterator(this.fs, filename, watchOptions);
  };
}

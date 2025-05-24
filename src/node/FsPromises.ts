import { isReadableStream, promisify, streamToBuffer } from './util';
import { constants } from '../constants';
import type * as opts from './types/options';
import type * as misc from './types/misc';
import type { FsCallbackApi, FsPromisesApi } from './types';

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

    this.watch = () => {
      throw new Error('Not implemented');
    };
  }
}

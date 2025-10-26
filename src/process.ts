import * as process from 'process';

export interface IProcess {
  getuid?(): number;
  getgid?(): number;
  cwd(): string;
  platform: string;
  emitWarning: (message: string, type: string) => void;
  env: {};
}


export function createProcess(): IProcess {
  // 1. Define an object with all the default fallbacks.
  const defaults = {
    cwd: () => '/',
    emitWarning: (message: string, type: string) => {
      // tslint:disable-next-line:no-console
      console.warn(`${type}${type ? ': ' : ''}${message}`);
    },
    env: {},
    // You can add other defaults from your interface here if needed.
    getuid: () => 0,
    getgid: () => 0,
    platform: 'browser',
  };

  // 2. Create a new object. Spread the defaults first, then the actual
  //    `process` object. This ensures that any existing properties on
  //    `process` will override the defaults.
  const p: IProcess = {
    ...defaults,
    ...process,
  };

  return p;
}

export default createProcess();
import type { Code } from './types.js';

/** Executes code concurrently. */
export const go = <T>(code: Code<T>): void => {
  code().catch(() => { });
};

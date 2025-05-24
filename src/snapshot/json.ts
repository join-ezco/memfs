// @ts-expect-error
import { JsonEncoder } from '@jsonjoy.com/json-pack/lib/json/JsonEncoder';
// @ts-expect-error
import { JsonDecoder } from '@jsonjoy.com/json-pack/lib/json/JsonDecoder';
import { fromSnapshotSync, toSnapshotSync } from './sync.js';
import { fromSnapshot, toSnapshot } from './async.js';
import { writer } from './shared.js';
import type { AsyncSnapshotOptions, SnapshotNode, SnapshotOptions } from './types.js';

/** @todo Import this type from `json-joy` once it is available. */
export type JsonUint8Array<T> = Uint8Array & { __BRAND__: 'json'; __TYPE__: T };

const encoder = new JsonEncoder(writer);
const decoder = new JsonDecoder();

export const toJsonSnapshotSync = (options: SnapshotOptions): JsonUint8Array<SnapshotNode> => {
  const snapshot = toSnapshotSync(options);
  return encoder.encode(snapshot) as JsonUint8Array<SnapshotNode>;
};

export const fromJsonSnapshotSync = (uint8: JsonUint8Array<SnapshotNode>, options: SnapshotOptions): void => {
  const snapshot = decoder.read(uint8) as SnapshotNode;
  fromSnapshotSync(snapshot, options);
};

export const toJsonSnapshot = async (options: AsyncSnapshotOptions): Promise<JsonUint8Array<SnapshotNode>> => {
  const snapshot = await toSnapshot(options);
  return encoder.encode(snapshot) as JsonUint8Array<SnapshotNode>;
};

export const fromJsonSnapshot = async (
  uint8: JsonUint8Array<SnapshotNode>,
  options: AsyncSnapshotOptions,
): Promise<void> => {
  const snapshot = decoder.read(uint8) as SnapshotNode;
  await fromSnapshot(snapshot, options);
};

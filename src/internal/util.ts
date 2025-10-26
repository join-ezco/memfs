// Browser-compatible utility functions to replace Node.js dependencies

/**
 * Browser-compatible assertion function
 */
export function assert(condition: any, message?: string): asserts condition {
    if (!condition) {
        throw new Error(message || 'Assertion failed');
    }
}

/**
 * Browser-compatible strict equality check
 */
export function strictEqual<T>(actual: T, expected: T, message?: string): void {
    if (actual !== expected) {
        throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
}

/**
 * Browser-compatible object inspection for debugging/error messages
 */
export function inspect(value: any): string {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'string') return `'${value}'`;
    if (typeof value === 'object') {
        try {
            return JSON.stringify(value);
        } catch {
            return '[object Object]';
        }
    }
    return String(value);
}

/**
 * Browser-compatible string formatting with %s placeholders
 */
export function format(template: string, ...args: any[]): string {
    let i = 0;
    return template.replace(/%s/g, () => String(args[i++] ?? ''));
}

/**
 * Browser-compatible util.inherits replacement
 * Sets up prototype chain for inheritance
 */
export function inherits(ctor: any, superCtor: any): void {
    if (ctor === undefined || ctor === null) {
        throw new TypeError('The constructor to "inherits" must not be null or undefined');
    }

    if (superCtor === undefined || superCtor === null) {
        throw new TypeError('The super constructor to "inherits" must not be null or undefined');
    }

    if (superCtor.prototype === undefined) {
        throw new TypeError('The super constructor to "inherits" must have a prototype');
    }

    ctor.super_ = superCtor;
    ctor.prototype = Object.create(superCtor.prototype, {
        constructor: {
            value: ctor,
            enumerable: false,
            writable: true,
            configurable: true
        }
    });
}
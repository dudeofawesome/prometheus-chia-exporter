import * as NodeAssert from 'assert';

const NODE_ENV = process.env.NODE_ENV;

/**
 * During development, use an assert statement —
 * `assert(condition, optionalMessage);` — to disrupt normal execution if a
 * boolean condition is false.
 * @param condition If true, continue on, if false, log and throw
 * @param message message to display if assert fails
 */
export function ok(condition: boolean, message?: string) {
  // TODO: figure out a better way to make this fall out in production code
  //   maybe it could take a fn that returns a bool as a param
  if (NODE_ENV !== 'production') {
    NodeAssert(condition, message);
  }
}

export function equal(actual: any, expected: any, message?: string) {
  // TODO: figure out a better way to make this fall out in production code
  if (NODE_ENV !== 'production') {
    NodeAssert.equal(actual, expected, message);
  }
}

export function notEqual(actual: any, expected: any, message?: string) {
  // TODO: figure out a better way to make this fall out in production code
  if (NODE_ENV !== 'production') {
    NodeAssert.notEqual(actual, expected, message);
  }
}

export function strictEqual(actual: any, expected: any, message?: string) {
  // TODO: figure out a better way to make this fall out in production code
  if (NODE_ENV !== 'production') {
    NodeAssert.strictEqual(actual, expected, message);
  }
}

export function notStrictEqual(actual: any, expected: any, message?: string) {
  // TODO: figure out a better way to make this fall out in production code
  if (NODE_ENV !== 'production') {
    NodeAssert.notStrictEqual(actual, expected, message);
  }
}

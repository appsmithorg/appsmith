/**
 * Why we need this?
 * By default Object.keys return values's type is flawed. It returns array of strings and because of that we lose the type information of the object
 * when looping through the keys. This function returns an array of keys with the correct type information.
 *
 * with classic Object.keys: Object.keys({ a: 1, b: 2 }) -> string[]
 * with objectKeys: objectKeys({ a: 1, b: 2 }) -> ("a" | "b")[]
 *
 * @param object
 * @returns array of keys with correct type information
 */

export function objectKeys<T extends object>(object: T): Array<keyof T> {
  return Object.keys(object) as Array<keyof T>;
}

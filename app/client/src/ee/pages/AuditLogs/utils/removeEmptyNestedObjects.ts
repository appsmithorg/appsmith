/**
 * removeEmptyNestedObjects removes keys from object that have empty objects ({}, [], Set)
 * @param object
 */
export function removeEmptyNestedObjects<
  T extends Partial<Record<keyof T, unknown>>,
>(object: T): Partial<T> {
  const newObject = { ...object };

  const keys = Object.keys(newObject) as (keyof T)[];
  keys.forEach((key: keyof T) => {
    const nestedObject =
      typeof newObject[key] === "object" &&
      Object.keys(newObject[key] as Record<keyof T, unknown>).length === 0;
    if (nestedObject) {
      delete newObject[key];
    }
  });
  return newObject;
}

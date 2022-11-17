type Primitive = string | number | boolean;

export type Item<T extends Primitive> = {
  type: T;
  metadata?: Record<string, unknown>;
};

const isPrimitive = (value: unknown) =>
  ["string", "boolean", "number"].includes(typeof value);

export const isItemType = <T extends Primitive>(
  value: Item<T> | T,
): value is Item<T> => {
  return value && typeof value === "object" && isPrimitive(value.type);
};

class Queue<T extends Primitive> {
  private items: Item<T>[];

  constructor(items: Item<T>[] = []) {
    this.items = items;
  }

  has = (type: T) => {
    return Boolean(this.items.find((item) => item.type === type));
  };

  add = (item: Item<T> | T) => {
    if (isItemType(item)) {
      this.items.push(item);
    } else if (isPrimitive(item)) {
      this.items.push({
        type: item,
      });
    } else {
      throw new Error(
        `Queue.add - ${item} is not a primitive type (String, Number, Boolean)`,
      );
    }
  };

  flush = () => {
    this.items = [];
  };

  metadata = (type: T) => {
    const item = this.items.find((item) => item.type === type);

    return item?.metadata;
  };
}

export default Queue;

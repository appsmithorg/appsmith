const isNullOrWhitespace = (value: string) =>
  value === undefined || value === null || !value.trim();

export type Animal = {
  name: string;
  age: number;
};
export { isNullOrWhitespace };

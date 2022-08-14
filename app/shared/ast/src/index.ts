const isNullOrWhitespace = (value: string) =>
  value === undefined || value === null || !value.trim();
const isNullX = (value: string) => value === undefined || value === null;

export type Animal = {
  name: string;
  age: number;
};
export { isNullOrWhitespace, isNullX };

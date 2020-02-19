import generate from "nanoid/generate";

const ALPHANUMERIC = "1234567890abcdefghijklmnopqrstuvwxyz";
// const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export const generateReactKey = ({
  prefix = "",
}: { prefix?: string } = {}): string => {
  return prefix + generate(ALPHANUMERIC, 10);
};

export const generateClassName = (seed?: string) => {
  return `_${seed}`;
};

export default {
  generateReactKey,
  generateClassName,
};

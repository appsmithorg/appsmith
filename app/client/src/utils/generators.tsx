import generate from "nanoid/generate";

const ALPHANUMERIC = "1234567890abcdefghijklmnopqrstuvwxyz";
const ALPHABET = "abcdefghijklmnopqrstuvwxyz";

export const generateReactKey = ({
  prefix = "",
}: { prefix?: string } = {}): string => {
  return prefix + generate(ALPHANUMERIC, 10);
};

export const generateClassName = (seed?: string) => {
  if (!seed) return generate(ALPHABET, 7);
  return seed.replace(/^\d+\s*/, "_");
};

export default {
  generateReactKey,
  generateClassName,
};

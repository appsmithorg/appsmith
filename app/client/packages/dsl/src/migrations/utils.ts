import generate from "nanoid/generate";

export const DATA_BIND_REGEX_GLOBAL = /{{([\s\S]*?)}}/g;

const ALPHANUMERIC = "1234567890abcdefghijklmnopqrstuvwxyz";
export const generateReactKey = ({
  prefix = "",
}: { prefix?: string } = {}): string => {
  return prefix + generate(ALPHANUMERIC, 10);
};

export const removeSpecialChars = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;
  return value
    .split(separatorRegex)
    .join("_")
    .slice(0, limit || 30);
};

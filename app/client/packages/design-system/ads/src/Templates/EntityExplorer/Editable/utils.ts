export const normaliseName = (value: string, limit?: number) => {
  const separatorRegex = /\W+/;

  return value
    .split(separatorRegex)
    .join("_")
    .slice(0, limit || 30);
};

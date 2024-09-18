export function spaceSeparatedStringToObject(str: string) {
  const result: Record<string, true> = {};
  const words = str.split(" ");

  for (const eachWord of words) result[eachWord] = true;

  return result;
}

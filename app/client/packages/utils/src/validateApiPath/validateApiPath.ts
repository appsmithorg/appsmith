/**
 * Validates if the given path starts with "https://".
 * Throws an error if the path does not start with "https://".
 *
 * @param path - The path to validate.
 * @returns path if the path starts with "https://".
 * @throws Error if the path does not start with "https://".
 */
export const validateApiPath = (path: string): string => {
  if (path.startsWith("https://")) {
    return path;
  } else {
    throw new Error(`The ${path} path must start with 'https://'.`);
  }
};

/**
 * @example
 * getFileName("file.txt") => "file"
 * getFileName("file") => "file"
 * getFileName("file.txt.txt") => "file.txt"
 */
export const getFileName = (fileName: string): string => {
  return fileName.split(".").slice(0, 1)?.[0] || "";
};

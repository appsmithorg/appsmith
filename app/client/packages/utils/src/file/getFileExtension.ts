/**
 * @example
 * getFileExtension("file.txt") => "txt"
 * getFileExtension("file") => ""
 * getFileExtension("file.txt.txt") => "txt"
 */
export const getFileExtension = (fileName: string): string => {
  return fileName.split(".").pop() ?? "";
};

/**
 * @example
 * buildUrlTextFragment(["text1"]) // ":~:text=text1"
 * buildUrlTextFragment(["text1", "text2"]) // ":~:text=text1&text=text2"
 * buildUrlTextFragment([]) // ""
 */
export const buildUrlTextFragment = (fragments: string[]): string => {
  if (fragments.length === 0) {
    return "";
  }

  const textFragments = fragments
    .map(encodeURIComponent)
    .map((line) => `text=${line}`);

  return `:~:${textFragments.join("&")}`;
};

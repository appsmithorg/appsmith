import { useMemo } from "react";

export const DEFAULT_FONT_NAME = "System Default";

function useGoogleFont(fontFamily = DEFAULT_FONT_NAME) {
  /**
   * returns the font to be used for the canvas
   */
  const fontFamilyName = useMemo(() => {
    if (fontFamily === DEFAULT_FONT_NAME) {
      return "inherit";
    }

    return fontFamily;
  }, [fontFamily]);

  return fontFamilyName;
}

export default useGoogleFont;

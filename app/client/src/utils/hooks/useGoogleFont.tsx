import { useEffect, useMemo } from "react";
import webfontloader from "webfontloader";

export const DEFAULT_FONT_NAME = "System Default";

function useGoogleFont(fontFamily = DEFAULT_FONT_NAME) {
  useEffect(() => {
    if (fontFamily !== DEFAULT_FONT_NAME) {
      webfontloader.load({
        google: {
          families: [`${fontFamily}:300,400,500,700`],
        },
      });
    }
  }, [fontFamily]);

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

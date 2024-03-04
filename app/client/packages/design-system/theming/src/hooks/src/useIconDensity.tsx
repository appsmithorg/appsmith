import { useEffect, useState } from "react";
import type { IconDensity, TokenObj } from "../../token";

export const useIconDensity = (density: IconDensity, userDensity = 1) => {
  const [strokeWidth, setStrokeWidth] = useState<TokenObj>();

  useEffect(() => {
    switch (true) {
      case userDensity < 1:
        setStrokeWidth(density.tight);
        break;
      case userDensity === 1:
        setStrokeWidth(density.regular);
        break;
      case userDensity > 1:
        setStrokeWidth(density.loose);
        break;
      default:
        setStrokeWidth(density.regular);
        break;
    }
  }, [userDensity, density]);

  return {
    strokeWidth,
  };
};

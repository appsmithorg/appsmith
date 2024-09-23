import { useMemo } from "react";
import type { IconDensity } from "../../token";

export const useIconDensity = (density: IconDensity, userDensity = 1) => {
  const strokeWidth = useMemo(() => {
    switch (true) {
      case userDensity < 1:
        return density.tight;
      case userDensity === 1:
        return density.regular;
      case userDensity > 1:
        return density.loose;
      default:
        return density.regular;
    }
  }, [userDensity, density]);

  return {
    strokeWidth,
  };
};

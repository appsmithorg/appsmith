import { useMemo } from "react";
import type { IconDensity } from "../../token";

export const useIconDensity = (density: IconDensity, userDensity = 1) => {
  const strokeWidth = useMemo(() => {
    if (userDensity < 1) {
      return density.tight;
    } else if (userDensity === 1) {
      return density.regular;
    } else if (userDensity > 1) {
      return density.loose;
    } else {
      return density.regular;
    }
  }, [userDensity, density]);

  return {
    strokeWidth,
  };
};

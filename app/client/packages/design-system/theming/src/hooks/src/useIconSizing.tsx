import { useMemo } from "react";
import type { IconSizing } from "../../token";

export const useIconSizing = (sizing: IconSizing, userSizing = 1) => {
  const iconSize = useMemo(() => {
    switch (true) {
      case userSizing < 1:
        return sizing.small;
      case userSizing === 1:
        return sizing.regular;
      case userSizing > 1:
        return sizing.big;
      default:
        return sizing.regular;
    }
  }, [userSizing, sizing]);

  return {
    iconSize,
  };
};

import { useMemo } from "react";
import type { IconSizing } from "../../token";

export const useIconSizing = (sizing: IconSizing, userSizing = 1) => {
  const iconSize = useMemo(() => {
    if (userSizing < 1) {
      return sizing.small;
    } else if (userSizing === 1) {
      return sizing.regular;
    } else if (userSizing > 1) {
      return sizing.big;
    } else {
      return sizing.regular;
    }
  }, [userSizing, sizing]);

  return {
    iconSize,
  };
};

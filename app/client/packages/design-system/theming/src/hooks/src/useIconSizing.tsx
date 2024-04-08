import { useEffect, useState } from "react";
import type { IconSizing, TokenObj } from "../../token";

export const useIconSizing = (sizing: IconSizing, userSizing = 1) => {
  const [iconSize, setIconSize] = useState<TokenObj>();

  useEffect(() => {
    switch (true) {
      case userSizing < 1:
        setIconSize(sizing.small);
        break;
      case userSizing === 1:
        setIconSize(sizing.regular);
        break;
      case userSizing > 1:
        setIconSize(sizing.big);
        break;
      default:
        setIconSize(sizing.regular);
        break;
    }
  }, [userSizing, sizing]);

  return {
    iconSize,
  };
};

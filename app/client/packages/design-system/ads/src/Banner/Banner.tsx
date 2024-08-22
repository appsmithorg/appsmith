import React from "react";

import { StyledBanner } from "./Banner.styles";
import type { BannerProps } from "./Banner.types";

function Banner({ link, ...props }: BannerProps) {
  return (
    <StyledBanner links={link && [link]} {...props} _componentType="banner" />
  );
}

Banner.displayName = "Banner";

export { Banner };

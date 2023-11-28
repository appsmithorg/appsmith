import { useEffect, useState } from "react";
import { getFluidSizing } from "./getFluidSizing";
import { getFluidSpacing } from "./getFluidSpacing";
import { getFluidTypography } from "./getFluidTypography";
import useSize from "@react-hook/size";
import { useThrottle } from "@react-hook/throttle";

import type { MutableRefObject } from "react";
import type { Typography } from "../../../typography";
import type { TokenObj } from "../types";
import type { FluidConfig } from "./types";

export const useFluidTokens = (
  fluidConfig: FluidConfig,
  userDensity = 1,
  userSizing = 1,
  providerRef?: MutableRefObject<HTMLDivElement | null>,
) => {
  const { maxVw, minVw } = fluidConfig;
  const [width] = useSize(providerRef?.current as HTMLDivElement);
  const [typography, setTypography] = useThrottle<Typography | null>(null);

  const [sizing, setSizing] = useState<TokenObj>();
  const [outerSpacing, setOuterSpacing] = useState<TokenObj>();
  const [innerSpacing, setInnerSpacing] = useState<TokenObj>();

  useEffect(() => {
    setOuterSpacing(
      getFluidSpacing(
        maxVw,
        minVw,
        fluidConfig.outerSpacing,
        userDensity,
        userSizing,
      ),
    );
    setInnerSpacing(
      getFluidSpacing(
        maxVw,
        minVw,
        fluidConfig.innerSpacing,
        userDensity,
        userSizing,
      ),
    );
    setSizing(
      getFluidSizing(maxVw, minVw, fluidConfig.sizing, userDensity, userSizing),
    );
  }, [userDensity, userSizing]);

  useEffect(() => {
    if (width) {
      setTypography(
        getFluidTypography(
          maxVw,
          minVw,
          fluidConfig.typography,
          userDensity,
          userSizing,
          width,
        ),
      );
    }
  }, [userDensity, userSizing, width]);

  return {
    typography,
    outerSpacing,
    innerSpacing,
    sizing,
    width,
  };
};

import { useEffect, useState, useCallback } from "react";
import debounce from "lodash/debounce";
import { getFluidSizing } from "./getFluidSizing";
import { getFluidSpacing } from "./getFluidSpacing";
import { getFluidTypography } from "./getFluidTypography";

import type { Typography } from "../../../typography";
import type { TokenObj } from "../types";
import type { FluidConfig } from "./types";

const RESIZE_DEBOUNCE_TIME = 300;

export const useFluidTokens = (
  fluidConfig: FluidConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const { maxVw, minVw } = fluidConfig;
  const [typography, setTypography] = useState<Typography>();
  const [sizing, setSizing] = useState<TokenObj>();
  const [outerSpacing, setOuterSpacing] = useState<TokenObj>();
  const [innerSpacing, setInnerSpacing] = useState<TokenObj>();

  const onResize = () => {
    setTypography(
      getFluidTypography(
        maxVw,
        minVw,
        fluidConfig.typography,
        userDensity,
        userSizing,
        window.innerWidth,
      ),
    );
  };

  const debouncedResize = useCallback(
    debounce(onResize, RESIZE_DEBOUNCE_TIME),
    [],
  );

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
  }, [userDensity, userSizing]);

  useEffect(() => {
    setTypography(
      getFluidTypography(
        maxVw,
        minVw,
        fluidConfig.typography,
        userDensity,
        userSizing,
        window.innerWidth,
      ),
    );
    setSizing(
      getFluidSizing(maxVw, minVw, fluidConfig.sizing, userDensity, userSizing),
    );
  }, [userDensity, userSizing]);

  useEffect(() => {
    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
    };
  }, []);

  return {
    typography,
    outerSpacing,
    innerSpacing,
    sizing,
  };
};

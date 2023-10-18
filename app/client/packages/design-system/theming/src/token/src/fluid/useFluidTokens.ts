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
  densityRatio = 1,
  sizingRatio = 1,
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
        sizingRatio,
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
      getFluidSpacing(maxVw, minVw, fluidConfig.outerSpacing, densityRatio),
    );
    setInnerSpacing(
      getFluidSpacing(maxVw, minVw, fluidConfig.innerSpacing, densityRatio),
    );
  }, [densityRatio]);

  useEffect(() => {
    setTypography(
      getFluidTypography(
        maxVw,
        minVw,
        fluidConfig.typography,
        sizingRatio,
        window.innerWidth,
      ),
    );
    setSizing(getFluidSizing(maxVw, minVw, fluidConfig.sizing, sizingRatio));
  }, [sizingRatio]);

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

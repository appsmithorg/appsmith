import { useEffect, useState, useCallback } from "react";
import debounce from "lodash/debounce";
import { getFluidSizing } from "./getFluidSizing";
import { getFluidSpacing } from "./getFluidSpacing";
import { getFluidTypography } from "./getFluidTypography";

import type { FluidConfig } from "./types";

const RESIZE_DEBOUNCE_TIME = 300;

export const useFluidTokens = (
  fluidConfig: FluidConfig,
  densityRatio = 1,
  sizingRatio = 1,
) => {
  const [typography, setTypography] = useState(
    getFluidTypography(fluidConfig, sizingRatio, window.innerWidth),
  );

  const [sizing, setSizing] = useState(
    getFluidSizing(fluidConfig, sizingRatio),
  );

  const [spacing, setSpacing] = useState(
    getFluidSpacing(fluidConfig, densityRatio),
  );

  const onResize = () => {
    setTypography(
      getFluidTypography(fluidConfig, sizingRatio, window.innerWidth),
    );
  };

  const debouncedResize = useCallback(
    debounce(onResize, RESIZE_DEBOUNCE_TIME),
    [],
  );

  useEffect(() => {
    setSpacing(getFluidSpacing(fluidConfig, densityRatio));
  }, [densityRatio]);

  useEffect(() => {
    setTypography(
      getFluidTypography(fluidConfig, sizingRatio, window.innerWidth),
    );
    setSizing(getFluidSizing(fluidConfig, sizingRatio));
  }, [sizingRatio]);

  useEffect(() => {
    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
    };
  }, []);

  return {
    typography,
    spacing,
    sizing,
  };
};

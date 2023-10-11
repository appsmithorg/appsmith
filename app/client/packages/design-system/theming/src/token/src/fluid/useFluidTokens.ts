import { useEffect, useState, useCallback } from "react";
import debounce from "lodash/debounce";
import { getFluidRootUnit } from "./getFluidRootUnit";
import { getFluidSizing } from "./getFluidSizing";
import { getFluidSpacing } from "./getFluidSpacing";
import { getFluidTypography } from "./getFluidTypography";

import type { FluidConfig } from "./types";

const RESIZE_DEBOUNCE_TIME = 300;

export const useFluidTokens = (fluidConfig: FluidConfig, rootUnitRatio = 1) => {
  const [typography, setTypography] = useState(
    getFluidTypography(fluidConfig, rootUnitRatio, window.innerWidth),
  );

  const [rootUnit, setRootUnit] = useState(
    getFluidRootUnit(fluidConfig, rootUnitRatio),
  );

  const [spacing, setSpacing] = useState(
    getFluidSpacing(fluidConfig, rootUnitRatio),
  );

  const onResize = () => {
    setTypography(
      getFluidTypography(fluidConfig, rootUnitRatio, window.innerWidth),
    );
  };

  const debouncedResize = useCallback(
    debounce(onResize, RESIZE_DEBOUNCE_TIME),
    [],
  );

  useEffect(() => {
    setTypography(
      getFluidTypography(fluidConfig, rootUnitRatio, window.innerWidth),
    );
    setRootUnit(getFluidRootUnit(fluidConfig, rootUnitRatio));
    setSpacing(getFluidSpacing(fluidConfig, rootUnitRatio));
  }, [rootUnitRatio]);

  useEffect(() => {
    window.addEventListener("resize", debouncedResize);
    return () => {
      window.removeEventListener("resize", debouncedResize);
    };
  }, []);

  return {
    typography,
    rootUnit,
    spacing,
    sizing: getFluidSizing(),
  };
};

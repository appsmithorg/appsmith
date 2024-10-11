import { useMemo } from "react";
import { calculateScales } from "./calculateScales";

import type { TokenObj, TokenScaleConfig } from "../../token";

export const getSizing = (
  sizing: TokenScaleConfig,
  userDensity = 1,
  userSizing = 1,
  count = 200,
): TokenObj => {
  const { userDensityRatio = 1, userSizingRatio = 1, V, ...rest } = sizing;
  const ratio = userDensity * userDensityRatio + userSizing * userSizingRatio;

  const scale = calculateScales({
    V: V * ratio,
    ...rest,
  })[0];

  return [...Array(count)].reduce(
    (acc, value, index) => {
      return {
        ...acc,
        [index + 1]: `${((index + 1) * scale).toFixed(1)}px`,
      };
    },
    {
      0: 0,
    },
  );
};

export const useSizing = (
  config: TokenScaleConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const sizing = useMemo(() => {
    return getSizing(config, userDensity, userSizing);
  }, [config, userDensity, userSizing]);

  return {
    sizing,
  };
};

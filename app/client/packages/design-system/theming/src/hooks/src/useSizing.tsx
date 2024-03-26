import { useEffect, useState } from "react";
import { calculateScales } from "./calculateScales";

import type { TokenObj } from "../../token";
import type { ScaleConfig } from "./types";

export const getSizing = (
  sizing: ScaleConfig,
  userDensity = 1,
  userSizing = 1,
  count = 200,
) => {
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
  config: ScaleConfig,
  userDensity = 1,
  userSizing = 1,
) => {
  const [sizing, setSizing] = useState<TokenObj>();

  useEffect(() => {
    setSizing(getSizing(config, userDensity, userSizing));
  }, [userDensity, userSizing, config]);

  return {
    sizing,
  };
};

import * as fs from "fs";
import { kebabCase, startCase, range } from "lodash";

import defaults from "../constants/defaultTokens.json";
import { createSemanticColorTokens } from "./createTokens";

// generating semantic tokens
const semanticColors = createSemanticColorTokens(defaults.seedColor);

const transformedSemanticTokens: any = {};
for (const [key, value] of Object.entries(semanticColors)) {
  transformedSemanticTokens[kebabCase(`color${startCase(key)}`)] = {
    value: value,
    type: "color",
  };
}

// generating spacing tokens
const spacingTokens: any = {};

range(6).map((value, index) => {
  spacingTokens[`spacing-${index}`] = {
    value: `${defaults.rootUnit * value}px`,
    type: "sizing",
  };
});

const finalTokens = {
  semantic: {
    ...transformedSemanticTokens,
    "opacity-disabled": {
      disabledOpacity: 0.5,
      type: "opacity",
    },
  },
  raw: {
    ...spacingTokens,
    "border-radius": {
      value: `${defaults.borderRadius}px`,
      type: "borderRadius",
    },
    "box-shadow": {
      value: defaults.boxShadow,
      type: "boxShadow",
    },
  },
};

// write to file
fs.writeFileSync(
  `${__dirname}/../tokens.json`,
  JSON.stringify(finalTokens, null, 2),
);

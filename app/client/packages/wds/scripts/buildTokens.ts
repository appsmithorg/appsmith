import fs from "fs";
import inquirer from "inquirer";
import { camelCase, kebabCase, startCase } from "lodash";

import { createSemanticColorTokens } from "../src/utils/createTokens";

const DEFAULT_SEED_COLOR = "#1a7f37";
const spacing = ["0px", "4px", "8px", "12px", "16px", "20px", "24px", "28px"];

inquirer
  .prompt([
    {
      type: "input",
      name: "seedColor",
      message: "Enter the seed color",
      default: DEFAULT_SEED_COLOR,
    },
  ])
  .then((answers) => {
    const { seedColor } = answers;

    // generating semantic tokens
    const semanticColors = createSemanticColorTokens(seedColor);

    const transformedSemanticTokens: any = {};
    for (const [key, value] of Object.entries(semanticColors)) {
      transformedSemanticTokens[kebabCase(`color${startCase(key)}`)] = {
        value: value,
        type: "color",
      };
    }

    // generating spacing tokens
    const spacingTokens = spacing.map((value, index) => {
      return {
        [camelCase(`spacing-${index}`)]: {
          value: value,
          type: "sizing",
        },
      };
    });

    const finalTokens = {
      semantic: {
        ...transformedSemanticTokens,
      },
      raw: {
        ...spacingTokens,
      },
    };

    // write to file
    fs.writeFileSync(
      `${__dirname}/../tokens.json`,
      JSON.stringify(finalTokens, null, 2),
    );
  });

import fs from "fs";
import inquirer from "inquirer";

import { createSemanticColorTokens } from "../src/utils/createTokens";

inquirer
  .prompt([
    {
      type: "input",
      name: "seedColor",
      message: "Enter the seed color",
      default: "#1a7f37",
    },
  ])
  .then((answers) => {
    const { seedColor } = answers;

    const semanticColors = createSemanticColorTokens(seedColor);

    const transformedSemanticTokens: any = {};
    for (const [key, value] of Object.entries(semanticColors)) {
      transformedSemanticTokens[key] = {
        value: value,
        type: "color",
      };
    }

    const finalTokens = {
      semantic: {
        ...transformedSemanticTokens,
      },
      raw: {
        0: {
          value: "0px",
          type: "sizing",
        },
        1: {
          value: "4px",
          type: "sizing",
        },
        2: {
          value: "8px",
          type: "sizing",
        },
        3: {
          value: "12px",
          type: "sizing",
        },
      },
    };

    // write to file
    fs.writeFileSync(
      `${__dirname}/../tokens.json`,
      JSON.stringify(finalTokens, null, 2),
    );
  });

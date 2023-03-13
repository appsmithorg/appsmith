import fs from "fs";
import chalk from "chalk";
import inquirer from "inquirer";

import rawTokens from "../src/dictionary/raw.js";
import { createSemanticColorTokens } from "../src/utils/createTokens";

inquirer
  .prompt([
    {
      type: "input",
      name: "seedColor",
      message: "Enter the seed color",
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
      ...rawTokens,
      semantic: {
        ...transformedSemanticTokens,
      },
    };

    fs.writeFileSync(
      `${__dirname}/../src/dictionary/build.json`,
      JSON.stringify(finalTokens, null, 2),
    );
  })
  .catch((error) => {
    console.log({ error });
  });

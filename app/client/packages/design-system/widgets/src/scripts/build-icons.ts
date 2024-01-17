import path from "path";
import fs from "fs-extra";
import prettier from "prettier";
import kebabCase from "lodash/kebabCase";

import * as ICONS from "@tabler/icons-react";

let content = `export const ICONS = {`;

Object.keys(ICONS)
  .filter((name) => name !== "createReactComponent")
  .filter((name) => !name.endsWith("Filled"))
  .map((name) => {
    content += `\n  "${kebabCase(name).replace("icon-", "")}": "${name}",`;
  });

content += "} as const;";

prettier
  .format(content, {
    parser: "typescript",
    printWidth: 80,
    tabWidth: 2,
    useTabs: false,
    semi: true,
    singleQuote: false,
    trailingComma: "all",
    arrowParens: "always",
  })
  .then((formattedContent) => {
    content = formattedContent;

    fs.writeFileSync(
      path.join(__dirname, "../components/Icon/src/icons.ts"),
      content,
    );
  });

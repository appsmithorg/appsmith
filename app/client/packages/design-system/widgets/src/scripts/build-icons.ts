import path from "path";
import fs from "fs-extra";
import prettier from "prettier";
import kebabCase from "lodash/kebabCase";

import { icons } from "@tabler/icons-react";

let content = `export const ICONS = {`;

Object.keys(icons)
  .filter((name) => name !== "createReactComponent")
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

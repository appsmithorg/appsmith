import fs from "fs";

import { getSizing, getSpacing } from "../hooks";
import { TokensAccessor, defaultTokens, tokensConfigs } from "../token";
import type { TokenSource } from "../token";
import { cssRule } from "./cssRule";

const allTokens = new TokensAccessor({
  ...(defaultTokens as TokenSource),
  outerSpacing: getSpacing(tokensConfigs.outerSpacing),
  innerSpacing: getSpacing(tokensConfigs.innerSpacing),
  sizing: getSizing(tokensConfigs.sizing),
}).getAllTokens();

const ATTENTION_MESSAGE =
  "/* THIS FILE IS CREATED AUTOMATICALLY. PLEASE DON'T EDIT IT. */";
const cssStyles = `:root {${cssRule(allTokens)}}`;

fs.writeFileSync(
  `${__dirname}/../token/src/styles.module.css`,
  `${ATTENTION_MESSAGE}
${cssStyles}`,
);

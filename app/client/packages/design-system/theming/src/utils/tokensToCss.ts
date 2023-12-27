import fs from "fs";
import { TokensAccessor, defaultTokens } from "../token";
import { cssRule } from "./cssRule";
import { getFluidSizing, getFluidSpacing } from "../hooks";

import type { TokenSource } from "../token";

const { fluid, ...restDefaultTokens } = defaultTokens;
const { innerSpacing, maxVw, minVw, outerSpacing, sizing } = fluid;

const allTokens = new TokensAccessor({
  ...(restDefaultTokens as TokenSource),
  outerSpacing: getFluidSpacing(maxVw, minVw, outerSpacing),
  innerSpacing: getFluidSpacing(maxVw, minVw, innerSpacing),
  sizing: getFluidSizing(maxVw, minVw, sizing),
}).getAllTokens();

const ATTENTION_MESSAGE =
  "/* THIS FILE IS CREATED AUTOMATICALLY. PLEASE DON'T EDIT IT. */";
const cssStyles = `:root {${cssRule(allTokens)}}`;

fs.writeFileSync(
  `${__dirname}/../token/src/styles.module.css`,
  `${ATTENTION_MESSAGE}
${cssStyles}`,
);

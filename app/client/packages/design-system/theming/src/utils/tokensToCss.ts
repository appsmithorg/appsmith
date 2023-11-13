import fs from "fs";
import {
  TokensAccessor,
  defaultTokens,
  getFluidSizing,
  getFluidSpacing,
  getFluidRadii,
} from "../token";
import type { TokenSource } from "../token";
import { cssRule } from "./cssRule";

const { fluid, ...restDefaultTokens } = defaultTokens;
const { innerSpacing, maxVw, minVw, outerSpacing, sizing, borderRadius } =
  fluid;

const allTokens = new TokensAccessor({
  ...(restDefaultTokens as TokenSource),
  outerSpacing: getFluidSpacing(maxVw, minVw, outerSpacing),
  innerSpacing: getFluidSpacing(maxVw, minVw, innerSpacing),
  sizing: getFluidSizing(maxVw, minVw, sizing),
  borderRadius: getFluidRadii(maxVw, minVw, borderRadius),
}).getAllTokens();

const ATTENTION_MESSAGE =
  "/* THIS FILE IS CREATED AUTOMATICALLY. PLEASE DON'T EDIT IT. */";
const cssStyles = `:root {${cssRule(allTokens)}}`;

fs.writeFileSync(
  `${__dirname}/../token/src/styles.module.css`,
  `${ATTENTION_MESSAGE}
${cssStyles}`,
);

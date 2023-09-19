import fs from "fs";
import {
  TokensAccessor,
  defaultTokens,
  getFluidRootUnit,
  getFluidSizing,
  getFluidSpacing,
} from "../token";
import type { TokenSource, ThemeToken } from "../token";
import { cssRule } from "./cssRule";

const { fluid, ...restDefaultTokens } = defaultTokens;

const allTokens = new TokensAccessor({
  ...(restDefaultTokens as TokenSource),
  spacing: getFluidSpacing(fluid),
  sizing: getFluidSizing(),
}).getAllTokens();

const ATTENTION_MESSAGE =
  "//THIS FILE IS CREATED AUTOMATICALLY. PLEASE DON'T EDIT IT.";
let cssStyles = `:root {--root-unit: ${getFluidRootUnit(fluid)}}`;

Object.values(allTokens).forEach((token) => {
  if (token) {
    cssStyles += cssRule(":root", token as ThemeToken);
  }
});

fs.writeFileSync(
  `${__dirname}/../token/src/styles.module.css`,
  `${ATTENTION_MESSAGE}
${cssStyles}`,
);

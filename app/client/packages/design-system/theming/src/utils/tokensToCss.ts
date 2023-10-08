import fs from "fs";
import {
  TokensAccessor,
  defaultTokens,
  getFluidRootUnit,
  getFluidSizing,
  getFluidSpacing,
} from "../token";
import type { TokenSource } from "../token";
import { cssRule } from "./cssRule";

const { fluid, ...restDefaultTokens } = defaultTokens;

const allTokens = new TokensAccessor({
  ...(restDefaultTokens as TokenSource),
  spacing: getFluidSpacing(fluid),
  sizing: getFluidSizing(),
}).getAllTokens();

const ATTENTION_MESSAGE =
  "//THIS FILE IS CREATED AUTOMATICALLY. PLEASE DON'T EDIT IT.";
const cssStyles = `:root {--root-unit: ${getFluidRootUnit(fluid)}; ${cssRule(
  allTokens,
)}}`;

fs.writeFileSync(
  `${__dirname}/../token/src/styles.module.css`,
  `${ATTENTION_MESSAGE}
${cssStyles}`,
);

import fs from "fs";
import { TokensAccessor, defaultTokens } from "../";
import type { TokenSource } from "../token";

fs.writeFileSync(
  `${__dirname}/../token/themeTokens.json`,
  `${JSON.stringify(
    new TokensAccessor(defaultTokens as TokenSource).getAllTokens(),
    null,
    2,
  )}\r\n`,
);

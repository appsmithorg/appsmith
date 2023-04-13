import fs from "fs";
import { TokensAccessor } from "../";

fs.writeFileSync(
  `${__dirname}/../tokens/themeTokens.json`,
  `${JSON.stringify(new TokensAccessor().getAllTokens(), null, 2)}\r\n`,
);

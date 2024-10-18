import type { Components } from "react-markdown";

import { a } from "./mdComponents/Link";
import { code } from "./mdComponents/Code";
import { h1, h2, h3, h4, h5, h6 } from "./mdComponents/Heading";

export const components: Components = {
  a,
  h1,
  h2,
  h3,
  h4,
  h5,
  h6,
  code,
};

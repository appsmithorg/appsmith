import "styled-components";
import { Theme } from "../../src/constants/DefaultTheme";

declare module "styled-components" {
  // eslint-disable-next-line @typescript-eslint/no-empty-interface
  export interface DefaultTheme extends Theme {}
}

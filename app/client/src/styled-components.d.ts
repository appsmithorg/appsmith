import "styled-components";
import type { Theme } from "constants/DefaultTheme";

declare module "styled-components" {
  export interface DefaultTheme extends Theme {}
}

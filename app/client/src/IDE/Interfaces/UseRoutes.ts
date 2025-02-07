import type { ComponentType } from "react";

export type UseRoutes = Array<{
  key: string;
  component: ComponentType;
  path: string[];
  exact: boolean;
}>;

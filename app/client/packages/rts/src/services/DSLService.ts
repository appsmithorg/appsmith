import type { WidgetProps } from "@shared/dsl";
import { DSL } from "@shared/dsl";

export const getDSLForGit = (request: WidgetProps) => {
  const dsl = new DSL(request);
  return dsl.asGitDSL();
};

export const getNestedDSLFromGit = (request: WidgetProps) => {
  const dsl = new DSL(request);
  return dsl.asNestedDSLFromGit("0", dsl);
};

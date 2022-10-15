import React from "react";
import { astFromValue, print, ValueNode } from "graphql";

import { ExplorerFieldDef } from "./contexts/explorer";
import { DefaultValueWrapper } from "./css";

const printDefault = (ast?: ValueNode | null): string => {
  if (!ast) {
    return "";
  }
  return print(ast);
};

type DefaultValueProps = {
  /**
   * The field or argument for which to render the default value.
   */
  field: ExplorerFieldDef;
};

export default function DefaultValue({ field }: DefaultValueProps) {
  if (!("defaultValue" in field) || field.defaultValue === undefined) {
    return null;
  }
  const ast = astFromValue(field.defaultValue, field.type);
  if (!ast) {
    return null;
  }
  return (
    <>
      {" = "}
      <DefaultValueWrapper className="graphiql-doc-explorer-default-value">
        {printDefault(ast)}
      </DefaultValueWrapper>
    </>
  );
}

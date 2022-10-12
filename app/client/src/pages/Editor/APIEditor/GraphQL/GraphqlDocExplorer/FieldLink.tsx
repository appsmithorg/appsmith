import React, { useContext } from "react";
import { noop } from "utils/AppsmithUtils";
import { ExplorerFieldDef, ExplorerContext } from "./contexts/explorer";

type FieldLinkProps = {
  /**
   * The field or argument that should be linked to.
   */
  field: ExplorerFieldDef;
};

export default function FieldLink(props: FieldLinkProps) {
  const { push = noop } = useContext(ExplorerContext) || {};

  return (
    <a
      className="graphiql-doc-explorer-field-name"
      href="#"
      onClick={(event) => {
        event.preventDefault();
        push({ name: props.field.name, def: props.field });
      }}
    >
      {props.field.name}
    </a>
  );
}

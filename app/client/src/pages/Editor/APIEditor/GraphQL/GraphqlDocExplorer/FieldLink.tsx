import React, { useContext } from "react";
import { noop } from "utils/AppsmithUtils";
import { ExplorerFieldDef, ExplorerContext } from "./contexts/explorer";
import { FieldLinkWrapper } from "./css";

type FieldLinkProps = {
  /**
   * The field or argument that should be linked to.
   */
  field: ExplorerFieldDef;
};

export default function FieldLink(props: FieldLinkProps) {
  const { push = noop } = useContext(ExplorerContext) || {};

  return (
    <FieldLinkWrapper
      className="t--gql-field-name"
      onClick={(event) => {
        event.preventDefault();
        push({ name: props.field.name, def: props.field });
      }}
    >
      {props.field.name}
    </FieldLinkWrapper>
  );
}

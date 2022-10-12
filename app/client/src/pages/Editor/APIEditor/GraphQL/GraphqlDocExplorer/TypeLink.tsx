import React, { useContext } from "react";
import { GraphQLType } from "graphql";

import { ExplorerContext } from "./contexts/explorer";
import { renderType } from "./utils";

import { noop } from "utils/AppsmithUtils";

type TypeLinkProps = {
  /**
   * The type that should be linked to.
   */
  type: GraphQLType;
};

export default function TypeLink(props: TypeLinkProps) {
  const { push = noop } = useContext(ExplorerContext) || {};

  if (!props.type) {
    return null;
  }

  return renderType(props.type, (namedType) => (
    <a
      className="graphiql-doc-explorer-type-name"
      href="#"
      onClick={(event) => {
        event.preventDefault();
        push({ name: namedType.name, def: namedType });
      }}
    >
      {namedType.name}
    </a>
  ));
}

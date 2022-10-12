import React from "react";
import { DirectiveNode } from "graphql";

type DirectiveProps = {
  /**
   * The directive that should be rendered.
   */
  directive: DirectiveNode;
};

export default function Directive({ directive }: DirectiveProps) {
  return (
    <span className="graphiql-doc-explorer-directive">
      @{directive.name.value}
    </span>
  );
}

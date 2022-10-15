import React from "react";
import { DirectiveNode } from "graphql";
import { DirectiveWrapper } from "./css";

type DirectiveProps = {
  /**
   * The directive that should be rendered.
   */
  directive: DirectiveNode;
};

export default function Directive({ directive }: DirectiveProps) {
  return <DirectiveWrapper>@{directive.name.value}</DirectiveWrapper>;
}

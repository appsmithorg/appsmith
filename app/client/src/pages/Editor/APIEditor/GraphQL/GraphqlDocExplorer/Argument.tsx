import React from "react";
import { GraphQLArgument } from "graphql";

import DefaultValue from "./DefaultValue";
import TypeLink from "./TypeLink";

import MarkdownContent from "./MarkdownContent";
import { ArgumentDefNameWrapper, DefinitionWrapper } from "./css";

type ArgumentProps = {
  /**
   * The argument that should be rendered.
   */
  arg: GraphQLArgument;
  /**
   * Toggle if the default value for the argument is shown (if there is one)
   * @default false
   */
  showDefaultValue?: boolean;
  /**
   * Toggle whether to render the whole argument including description and
   * deprecation reason (`false`) or to just render the argument name, type,
   * and default value in a single line (`true`).
   * @default false
   */
  inline?: boolean;
};

export default function Argument({
  arg,
  inline,
  showDefaultValue,
}: ArgumentProps) {
  const definition = (
    <DefinitionWrapper>
      <ArgumentDefNameWrapper>{arg.name}</ArgumentDefNameWrapper>
      {" : "}
      <TypeLink type={arg.type} />
      {showDefaultValue !== false && <DefaultValue field={arg} />}
    </DefinitionWrapper>
  );
  if (inline) {
    return definition;
  }
  return (
    <div>
      {definition}
      {arg.description
        ? MarkdownContent.render({
            description: arg.description,
            type: "description",
          })
        : null}
      {arg.deprecationReason ? (
        <div>
          <div>Deprecated</div>
          {MarkdownContent.render({
            description: arg.deprecationReason,
            type: "deprecation",
          })}
        </div>
      ) : null}
    </div>
  );
}

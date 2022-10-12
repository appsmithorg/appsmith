import React from "react";
import { GraphQLArgument } from "graphql";

import DefaultValue from "./DefaultValue";
import TypeLink from "./TypeLink";

import MarkdownContent from "./MarkdownContent";

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
    <span>
      <span className="graphiql-doc-explorer-argument-name">{arg.name}</span>
      {": "}
      <TypeLink type={arg.type} />
      {showDefaultValue !== false && <DefaultValue field={arg} />}
    </span>
  );
  if (inline) {
    return definition;
  }
  return (
    <div className="graphiql-doc-explorer-argument">
      {definition}
      {arg.description
        ? MarkdownContent.render({
            description: arg.description,
            type: "description",
          })
        : null}
      {arg.deprecationReason ? (
        <div className="graphiql-doc-explorer-argument-deprecation">
          <div className="graphiql-doc-explorer-argument-deprecation-label">
            Deprecated
          </div>
          {MarkdownContent.render({
            description: arg.deprecationReason,
            type: "deprecation",
          })}
        </div>
      ) : null}
    </div>
  );
}

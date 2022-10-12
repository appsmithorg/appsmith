import React, { useState } from "react";
import { GraphQLArgument } from "graphql";

import { ExplorerFieldDef } from "./contexts/explorer";
import Argument from "./Argument";
import DeprecationReason from "./DeprecationReason";
import Directive from "./Directive";
import ExplorerSection from "./ExplorerSection";
import TypeLink from "./TypeLink";
import MarkdownContent from "./MarkdownContent";

function Arguments({ field }: { field: ExplorerFieldDef }) {
  const [showDeprecated, setShowDeprecated] = useState(false);

  if (!("args" in field)) {
    return null;
  }

  const args: GraphQLArgument[] = [];
  const deprecatedArgs: GraphQLArgument[] = [];
  for (const argument of field.args) {
    if (argument.deprecationReason) {
      deprecatedArgs.push(argument);
    } else {
      args.push(argument);
    }
  }

  return (
    <>
      {args.length > 0 ? (
        <ExplorerSection title="Arguments">
          {args.map((arg) => (
            <Argument arg={arg} key={arg.name} />
          ))}
        </ExplorerSection>
      ) : null}
      {deprecatedArgs.length > 0 ? (
        showDeprecated || args.length === 0 ? (
          <ExplorerSection title="Deprecated Arguments">
            {deprecatedArgs.map((arg) => (
              <Argument arg={arg} key={arg.name} />
            ))}
          </ExplorerSection>
        ) : (
          <button
            onClick={() => {
              setShowDeprecated(true);
            }}
            type="button"
          >
            Show Deprecated Arguments
          </button>
        )
      ) : null}
    </>
  );
}

function Directives({ field }: { field: ExplorerFieldDef }) {
  const directives = field.astNode?.directives || [];
  if (!directives || directives.length === 0) {
    return null;
  }
  return (
    <ExplorerSection title="Directives">
      {directives.map((directive) => (
        <div key={directive.name.value}>
          <Directive directive={directive} />
        </div>
      ))}
    </ExplorerSection>
  );
}

type FieldDocumentationProps = {
  /**
   * The field or argument that should be rendered.
   */
  field: ExplorerFieldDef;
};

export default function FieldDocumentation(props: FieldDocumentationProps) {
  return (
    <>
      {props.field.description
        ? MarkdownContent.render({
            description: props.field.description,
            type: "description",
          })
        : null}
      <DeprecationReason description={props.field.deprecationReason} />
      <ExplorerSection title="Type">
        <TypeLink type={props.field.type} />
      </ExplorerSection>
      <Arguments field={props.field} />
      <Directives field={props.field} />
    </>
  );
}

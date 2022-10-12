import React from "react";
import { GraphQLSchema } from "graphql";

import ExplorerSection from "./ExplorerSection";
import TypeLink from "./TypeLink";
import MarkdownContent from "./MarkdownContent";

type SchemaDocumentationProps = {
  /**
   * The schema that should be rendered.
   */
  schema: GraphQLSchema;
};

export default function SchemaDocumentation(props: SchemaDocumentationProps) {
  const queryType = props.schema.getQueryType();
  const mutationType = props.schema.getMutationType?.();
  const subscriptionType = props.schema.getSubscriptionType?.();

  return (
    <>
      {MarkdownContent.render({
        description:
          props.schema.description ||
          "A GraphQL schema provides a root type for each kind of operation.",
        type: "description",
      })}
      <ExplorerSection title="Root Types">
        {queryType ? (
          <div>
            <span className="graphiql-doc-explorer-root-type">query</span>
            {": "}
            <TypeLink type={queryType} />
          </div>
        ) : null}
        {mutationType && (
          <div>
            <span className="graphiql-doc-explorer-root-type">mutation</span>
            {": "}
            <TypeLink type={mutationType} />
          </div>
        )}
        {subscriptionType && (
          <div>
            <span className="graphiql-doc-explorer-root-type">
              subscription
            </span>
            {": "}
            <TypeLink type={subscriptionType} />
          </div>
        )}
      </ExplorerSection>
    </>
  );
}

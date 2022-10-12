import React from "react";
import MarkdownContent from "./MarkdownContent";

type DeprecationReasonProps = {
  /**
   * The deprecation reason as markdown string.
   */
  description?: string | null;
};

export default function DeprecationReason(props: DeprecationReasonProps) {
  return props.description ? (
    <div className="graphiql-doc-explorer-deprecation">
      <div className="graphiql-doc-explorer-deprecation-label">Deprecated</div>
      {MarkdownContent.render({
        description: props.description,
        type: "deprecation",
      })}
    </div>
  ) : null;
}

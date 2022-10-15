import MarkdownContent from "./MarkdownContent";

type DeprecationReasonProps = {
  /**
   * The deprecation reason as markdown string.
   */
  description?: string | null;
};

export default function DeprecationReason(props: DeprecationReasonProps) {
  return props.description
    ? MarkdownContent.render({
        description: props.description,
        type: "deprecation",
      })
    : null;
}

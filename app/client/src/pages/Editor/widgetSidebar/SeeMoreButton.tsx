import { Button } from "design-system";
import React from "react";

interface Props {
  showSeeLess: boolean;
  hidden: boolean;
  toggleSeeMore: () => void;
}

const SeeMoreButton = (props: Props) => {
  const SEE_MORE_LESS_TEXT = !props.showSeeLess ? "See more" : "See less";
  const SEE_MORE_ARROW = !props.showSeeLess
    ? "arrow-down-s-line"
    : "arrow-up-s-line";

  return (
    <Button
      className="mt-4"
      data-testid="t--explorer-ui-entity-tag-see-more"
      hidden={props.hidden}
      kind="tertiary"
      onClick={() => props.toggleSeeMore()}
      size="md"
      startIcon={SEE_MORE_ARROW}
    >
      {SEE_MORE_LESS_TEXT}
    </Button>
  );
};

export default SeeMoreButton;

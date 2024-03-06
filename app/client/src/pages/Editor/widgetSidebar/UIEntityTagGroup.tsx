import type { WidgetTags } from "constants/WidgetConstants";
import {
  SUGGESTED_WIDGETS_ORDER,
  WIDGET_TAGS,
  initialEntityCountForExplorerTag,
} from "constants/WidgetConstants";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Spinner,
  Text,
} from "design-system";
import { sortBy } from "lodash";
import React from "react";
import type { WidgetCardProps } from "widgets/BaseWidget";
import SeeMoreButton from "./SeeMoreButton";
import WidgetCard from "./WidgetCard";
import styled from "styled-components";

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 70px;
  margin-bottom: 70px;
`;

interface Props {
  tag: string;
  cards: WidgetCardProps[];
  isLoading: boolean;
}

const UIEntityTagGroup = (props: Props) => {
  const [showFullItems, setShowFullItems] = React.useState(false);
  const toggleShowFullItems = () => {
    setShowFullItems(!showFullItems);
  };
  const noOfItemsToRender = showFullItems
    ? props.cards.length
    : initialEntityCountForExplorerTag[props.tag as WidgetTags] ||
      props.cards.length;

  if (props.isLoading) {
    return (
      <LoadingWrapper key={props.tag}>
        <CollapsibleHeader arrowPosition="start">
          <Text
            className="select-none"
            color="var(--ads-v2-color-gray-600)"
            kind="heading-xs"
          >
            {props.tag}
          </Text>
        </CollapsibleHeader>
        <Spinner size={"lg"} />
      </LoadingWrapper>
    );
  }

  return (
    <Collapsible
      className={`pb-2 widget-tag-collapisble widget-tag-collapisble-${props.tag
        .toLowerCase()
        .replace(/ /g, "-")}`}
      isOpen
      key={props.tag}
    >
      <CollapsibleHeader arrowPosition="start">
        <Text
          className="select-none"
          color="var(--ads-v2-color-gray-600)"
          kind="heading-xs"
        >
          {props.tag}
        </Text>
      </CollapsibleHeader>
      <CollapsibleContent>
        <div className="grid items-stretch grid-cols-3 gap-x-1 gap-y-1 justify-items-stretch">
          {props.tag === WIDGET_TAGS.SUGGESTED_WIDGETS
            ? sortBy(
                props.cards,
                (widget) => SUGGESTED_WIDGETS_ORDER[widget.type],
              ).map((card) => <WidgetCard details={card} key={card.key} />)
            : props.cards
                .slice(0, noOfItemsToRender)
                .map((card) => <WidgetCard details={card} key={card.key} />)}
        </div>
        <SeeMoreButton
          hidden={noOfItemsToRender >= props.cards.length && !showFullItems}
          showSeeLess={showFullItems}
          toggleSeeMore={toggleShowFullItems}
        />
      </CollapsibleContent>
    </Collapsible>
  );
};

export default UIEntityTagGroup;

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
} from "@appsmith/ads";
import { sortBy } from "lodash";
import React from "react";
import type { WidgetCardProps } from "widgets/BaseWidget";
import SeeMoreButton from "./SeeMoreButton";
import styled from "styled-components";
import { EDITOR_PANE_TEXTS, createMessage } from "ee/constants/messages";
import WidgetCard from "./WidgetCard";

const LoadingWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  margin: 8px 0px;
`;

const LoadingContainer = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 30px 0px;
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
        <LoadingContainer>
          <Spinner size="md" />
          <Text
            className="select-none"
            color="var(--ads-v2-color-gray-600)"
            kind="body-m"
          >
            {createMessage(EDITOR_PANE_TEXTS.loading_building_blocks)}
          </Text>
        </LoadingContainer>
      </LoadingWrapper>
    );
  }

  return (
    <Collapsible
      className={`pb-2 widget-tag-collapsible widget-tag-collapsible-${props.tag
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
        <div
          className="grid items-stretch grid-cols-3 gap-x-1 gap-y-1 justify-items-stretch"
          data-testid="ui-entity-tag-group"
        >
          {props.tag === WIDGET_TAGS.SUGGESTED_WIDGETS
            ? sortBy(
                props.cards,
                (widget) => SUGGESTED_WIDGETS_ORDER[widget.type],
              ).map((card, index) => (
                <WidgetCard details={card} key={`${card.key}${index}`} />
              ))
            : props.cards
                .slice(0, noOfItemsToRender)
                .map((card, index) => (
                  <WidgetCard details={card} key={`${card.key}${index}`} />
                ))}
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

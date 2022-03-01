import Button from "components/ads/Button";
import styled from "constants/DefaultTheme";
import { createMessage, SNIPPET_TOOLTIP } from "@appsmith/constants/messages";
import { ENTITY_TYPE } from "entities/DataTree/dataTreeFactory";
import React from "react";
import { useDispatch } from "react-redux";
import { Category, Size } from "./Button";
import TooltipComponent from "./Tooltip";
import AdsIcon, { IconSize } from "components/ads/Icon";
import { executeCommandAction } from "actions/apiPaneActions";
import { SlashCommand } from "entities/Action";

type Props = {
  entityId?: string;
  entityType: ENTITY_TYPE;
  className?: string;
  showIconOnly?: boolean;
};

const StyledButton = styled(Button)`
  padding: 0 10px;
  svg {
    width: 18px;
    height: 18px;
  }
`;

export default function SearchSnippets(props: Props) {
  const dispatch = useDispatch();
  const className = props.className || "";
  function handleClick() {
    dispatch(
      executeCommandAction({
        actionType: SlashCommand.NEW_SNIPPET,
        args: {
          entityId: props.entityId,
          entityType: props.entityType,
        },
      }),
    );
  }

  return props.showIconOnly ? (
    <AdsIcon name="snippet" onClick={handleClick} size={IconSize.XL} />
  ) : (
    <TooltipComponent
      content={createMessage(SNIPPET_TOOLTIP)}
      hoverOpenDelay={50}
      position="bottom-right"
    >
      <StyledButton
        category={Category.tertiary}
        className={`t--search-snippets ${className}`}
        icon="snippet"
        onClick={handleClick}
        size={Size.medium}
        tag="button"
        text="Snippets"
        type="button"
      />
    </TooltipComponent>
  );
}

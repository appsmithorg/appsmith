import React, { useState } from "react";
import clsx from "classnames";

import type { ListItemProps, ListProps } from "./List.types";
import {
  BottomContentWrapper,
  GroupedList,
  GroupTitle,
  InlineDescriptionWrapper,
  RightControlWrapper,
  StyledGroup,
  StyledList,
  StyledListItem,
  TooltipTextWrapper,
  TopContentWrapper,
} from "./List.styles";
import type { TextProps } from "../Text";
import { Text } from "../Text";
import { Tooltip } from "../Tooltip";
import {
  ListClassName,
  ListItemBDescClassName,
  ListItemClassName,
  ListItemIDescClassName,
  ListItemTextOverflowClassName,
  ListItemTitleClassName,
} from "./List.constants";
import { useEventCallback } from "usehooks-ts";

function List({ children, className, groupTitle, ...rest }: ListProps) {
  return groupTitle ? (
    <StyledGroup flexDirection="column">
      <GroupTitle kind="body-s">{groupTitle}</GroupTitle>
      <GroupedList className={className}>{children}</GroupedList>
    </StyledGroup>
  ) : (
    <StyledList className={clsx(ListClassName, className)} {...rest}>
      {children}
    </StyledList>
  );
}

function TextWithTooltip(props: TextProps & { isMultiline?: boolean }) {
  const [disableTooltip, setDisableTooltip] = useState(true);

  const handleShowFullText = useEventCallback(
    (e: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      let isInEllipsis = false;
      const text_node = e.target;

      if (text_node instanceof HTMLElement) {
        if (props.isMultiline) {
          isInEllipsis =
            text_node && text_node.clientHeight < text_node.scrollHeight;
        } else {
          isInEllipsis =
            text_node && text_node.clientWidth < text_node.scrollWidth;
        }
      }

      setDisableTooltip(!isInEllipsis);
    },
  );

  return (
    <Tooltip content={props.children} isDisabled={disableTooltip}>
      <TooltipTextWrapper
        className={`${props.className}-wrapper`}
        onMouseOver={handleShowFullText}
      >
        <Text
          {...props}
          className={clsx(ListItemTextOverflowClassName, props.className)}
        >
          {props.children}
        </Text>
      </TooltipTextWrapper>
    </Tooltip>
  );
}

function ListItem(props: ListItemProps) {
  const {
    description,
    descriptionType = "inline",
    hasError,
    rightControl,
    rightControlVisibility = "always",
    size = "md",
    startIcon,
    title,
  } = props;
  const isBlockDescription = Boolean(
    descriptionType === "block" && description,
  );
  const isInlineDescription = Boolean(
    descriptionType === "inline" && description,
  );

  const handleOnClick = useEventCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (!props.isDisabled && props.onClick) {
      props.onClick(e);
    }
  });

  const handleDoubleClick = useEventCallback((e: React.MouseEvent) => {
    e.stopPropagation();

    if (!props.isDisabled && props.onDoubleClick) {
      props.onDoubleClick();
    }
  });

  const handleRightControlClick = useEventCallback((e: React.MouseEvent) => {
    e.stopPropagation();
  });

  return (
    <StyledListItem
      className={clsx(ListItemClassName, props.className)}
      data-disabled={props.isDisabled || false}
      data-isblockdescription={isBlockDescription}
      data-rightcontrolvisibility={rightControlVisibility}
      data-selected={props.isSelected}
      id={props.id}
      onClick={handleOnClick}
      onDoubleClick={handleDoubleClick}
      role="listitem"
      size={size}
    >
      <TopContentWrapper>
        {startIcon}
        {props.customTitleComponent ? (
          props.customTitleComponent
        ) : (
          <InlineDescriptionWrapper>
            <TextWithTooltip
              className={ListItemTitleClassName}
              color={hasError ? "var(--ads-v2-color-fg-error)" : undefined}
            >
              {title}
            </TextWithTooltip>
            {isInlineDescription && (
              <TextWithTooltip
                className={ListItemIDescClassName}
                color="var(--ads-v2-color-fg-muted)"
                kind="body-s"
              >
                {description}
              </TextWithTooltip>
            )}
          </InlineDescriptionWrapper>
        )}
        {rightControl && (
          <RightControlWrapper onClick={handleRightControlClick}>
            {rightControl}
          </RightControlWrapper>
        )}
      </TopContentWrapper>
      {isBlockDescription && (
        <BottomContentWrapper data-isiconpresent={Boolean(startIcon)}>
          <TextWithTooltip
            className={ListItemBDescClassName}
            color="var(--ads-v2-color-fg-muted)"
            isMultiline
            kind="body-s"
          >
            {description}
          </TextWithTooltip>
        </BottomContentWrapper>
      )}
    </StyledListItem>
  );
}

List.displayName = "List";

export { List, ListItem };

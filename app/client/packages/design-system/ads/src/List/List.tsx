import React, { useEffect, useState } from "react";
import clsx from "classnames";

import type { ListItemProps, ListProps } from "./List.types";
import {
  BottomContentWrapper,
  InlineDescriptionWrapper,
  RightControlWrapper,
  StyledList,
  StyledListItem,
  TooltipTextWrapper,
  TopContentWrapper,
} from "./List.styles";
import {
  ListClassName,
  ListItemBDescClassName,
  ListItemClassName,
  ListItemIDescClassName,
  ListItemTextOverflowClassName,
  ListItemTitleClassName,
} from "./List.constants";
import type { TextProps } from "../Text";
import { Text } from "../Text";
import { Tooltip } from "../Tooltip";

function List({ className, items, ...rest }: ListProps) {
  return (
    <StyledList className={clsx(ListClassName, className)} {...rest}>
      {items.map((item) => {
        return <ListItem key={item.title} {...item} />;
      })}
    </StyledList>
  );
}

function TextWithTooltip(props: TextProps & { isMultiline?: boolean }) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [disableTooltip, setDisableTooltip] = useState(true);

  const isEllipsisActive = () => {
    let active = false;

    if (ref.current) {
      const text_node = ref.current.children[0];

      if (props.isMultiline) {
        active = text_node && text_node.clientHeight < text_node.scrollHeight;
      } else {
        active = text_node && text_node.clientWidth < text_node.scrollWidth;
      }
    }

    setDisableTooltip(!active);
  };

  useEffect(() => {
    if (ref.current) {
      isEllipsisActive();
      ref.current.addEventListener("mouseover", isEllipsisActive);

      return () => {
        ref.current?.removeEventListener("mouseover", isEllipsisActive);
      };
    }
  }, []);

  return (
    <Tooltip content={props.children} isDisabled={disableTooltip}>
      <TooltipTextWrapper ref={ref}>
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
  const isBlockDescription = descriptionType === "block" && description;
  const isInlineDescription = descriptionType === "inline" && description;

  const handleOnClick = () => {
    if (!props.isDisabled && props.onClick) {
      props.onClick();
    }
  };

  const handleDoubleClick = () => {
    if (!props.isDisabled && props.onDoubleClick) {
      props.onDoubleClick();
    }
  };

  const handleRightControlClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  return (
    <StyledListItem
      className={clsx(ListItemClassName, props.className)}
      data-disabled={props.isDisabled || false}
      data-rightcontrolvisibility={rightControlVisibility}
      data-selected={props.isSelected}
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
        <BottomContentWrapper>
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

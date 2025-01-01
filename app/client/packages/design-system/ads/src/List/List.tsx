import React, { useEffect, useState } from "react";
import clsx from "classnames";

import type { ListItemProps, ListProps } from "./List.types";
import {
  ContentTextWrapper,
  DescriptionWrapper,
  InlineDescriptionWrapper,
  RightControlWrapper,
  StyledList,
  StyledListItem,
  TooltipTextWrapper,
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
  const isBlockDescription = descriptionType === "block";

  const listItemHandleKeyDown = (e: React.KeyboardEvent) => {
    if (!props.isDisabled && props.onClick) {
      switch (e.key) {
        case "Enter":
        case " ":
          props.onClick();
          break;
      }
    }
  };

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

  return (
    <StyledListItem
      className={clsx(ListItemClassName, props.className)}
      data-disabled={props.isDisabled || false}
      data-isblockdescription={isBlockDescription}
      data-rightcontrolvisibility={rightControlVisibility}
      data-selected={props.isSelected}
      onClick={handleOnClick}
      onKeyDown={listItemHandleKeyDown}
      size={size}
      // tabIndex={props.isDisabled ? -1 : 0}
    >
      <ContentTextWrapper onDoubleClick={handleDoubleClick}>
        {startIcon}
        {props.customTitleComponent ? (
          props.customTitleComponent
        ) : (
          <InlineDescriptionWrapper>
            <DescriptionWrapper>
              <TextWithTooltip
                className={ListItemTitleClassName}
                color={hasError ? "var(--ads-v2-color-fg-error)" : undefined}
              >
                {title}
              </TextWithTooltip>
              {isBlockDescription && description && (
                <TextWithTooltip
                  className={ListItemBDescClassName}
                  color="var(--ads-v2-color-fg-muted)"
                  isMultiline
                  kind="body-s"
                >
                  {description}
                </TextWithTooltip>
              )}
            </DescriptionWrapper>
            {!isBlockDescription && description && (
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
      </ContentTextWrapper>
      {rightControl && (
        <RightControlWrapper>{rightControl}</RightControlWrapper>
      )}
    </StyledListItem>
  );
}

List.displayName = "List";

export { List, ListItem };

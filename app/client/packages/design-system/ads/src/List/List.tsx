import React, { useEffect, useState } from "react";
import clsx from "classnames";

import type { ListItemProps, ListProps } from "./List.types";
import {
  ContentTextWrapper,
  DescriptionWrapper,
  EndIconWrapper,
  InlineDescriptionWrapper,
  StyledList,
  StyledListItem,
  TooltipTextWrapper,
  Wrapper,
} from "./List.styles";
import type { TextProps } from "../Text";
import { Text } from "../Text";
import { Button } from "../Button";
import { Tooltip } from "../Tooltip";
import {
  ListClassName,
  ListItemBDescClassName,
  ListItemClassName,
  ListItemIDescClassName,
  ListItemTextOverflowClassName,
  ListItemTitleClassName,
  ListItemWrapperClassName,
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
    endIcon,
    hasError,
    size = "md",
    startIcon,
    title,
  } = props;
  const isBlockDescription = descriptionType === "block";

  const listItemhandleKeyDown = (e: React.KeyboardEvent) => {
    if (!props.isDisabled && props.onClick) {
      switch (e.key) {
        case "Enter":
        case " ":
          props.onClick();
          break;
      }
    }
  };

  const endIconhandleKeyDown = (e: React.KeyboardEvent) => {
    e.stopPropagation();

    if (!props.isDisabled && props.onEndIconClick) {
      switch (e.key) {
        case "Enter":
        case " ":
          props.onEndIconClick();
          break;
      }
    }
  };

  const endIconOnClick = (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!props.isDisabled && props.onEndIconClick) {
      props.onEndIconClick();
    }
  };

  const handleOnClick = () => {
    if (!props.isDisabled && props.onClick) {
      props.onClick();
    }
  };

  return (
    <Wrapper className={clsx(ListItemWrapperClassName, props.wrapperClassName)}>
      <StyledListItem
        className={clsx(ListItemClassName, props.className)}
        data-disabled={props.isDisabled || false}
        data-selected={props.isSelected}
        endIcon={props.endIcon}
        isBlockDescription={isBlockDescription}
        onClick={handleOnClick}
        onKeyDown={listItemhandleKeyDown}
        size={size}
        tabIndex={props.isDisabled ? -1 : 0}
      >
        <ContentTextWrapper>
          {startIcon}
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
        </ContentTextWrapper>
      </StyledListItem>
      {endIcon && (
        <EndIconWrapper>
          <Button
            isDisabled={props.isDisabled}
            isIconButton
            kind="tertiary"
            onClick={endIconOnClick}
            onKeyDown={endIconhandleKeyDown}
            size={"sm"}
            startIcon={endIcon}
          />
        </EndIconWrapper>
      )}
    </Wrapper>
  );
}

List.displayName = "List";

export { List, ListItem };

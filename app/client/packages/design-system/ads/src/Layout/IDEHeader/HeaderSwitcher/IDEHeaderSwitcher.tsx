import React, { type ForwardedRef, useCallback } from "react";
import { Flex } from "../../../Flex";
import { Icon } from "../../../Icon";
import { Popover, PopoverTrigger } from "../../../Popover";
import { Text } from "../../../Text";
import * as Styled from "./HeaderSwitcher.styles";

interface Props {
  prefix: string;
  title?: string;
  titleTestId: string;
  active: boolean;
  setActive: (active: boolean) => void;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
  children: React.ReactNode;
}

export const IDEHeaderSwitcher = React.forwardRef(
  (props: Props, ref: ForwardedRef<HTMLDivElement>) => {
    const {
      active,
      children,
      className,
      onClick,
      prefix,
      setActive,
      title,
      titleTestId,
    } = props;

    const separator = title ? " /" : "";

    const closeSwitcher = useCallback(() => {
      return setActive(false);
    }, [setActive]);

    return (
      <Popover onOpenChange={setActive} open={active}>
        <PopoverTrigger>
          <Styled.SwitchTrigger
            active={active}
            className={`flex align-center items-center justify-center ${className}`}
            onClick={onClick}
            ref={ref}
          >
            <Text
              color="var(--ads-v2-colors-content-label-inactive-fg)"
              kind="body-m"
            >
              {prefix + separator}
            </Text>
            <Flex
              alignItems="center"
              className={titleTestId}
              data-active={active}
              gap="spaces-1"
              height="100%"
              justifyContent="center"
              paddingLeft="spaces-2"
            >
              <Text isBold kind="body-m">
                {title}
              </Text>
              <Icon
                color={
                  title
                    ? undefined
                    : "var(--ads-v2-colors-content-label-inactive-fg)"
                }
                name={active ? "arrow-up-s-line" : "arrow-down-s-line"}
                size="md"
              />
            </Flex>
          </Styled.SwitchTrigger>
        </PopoverTrigger>
        <Styled.ContentContainer align="start" onEscapeKeyDown={closeSwitcher}>
          {children}
        </Styled.ContentContainer>
      </Popover>
    );
  },
);

IDEHeaderSwitcher.displayName = "IDEHeaderSwitcher";

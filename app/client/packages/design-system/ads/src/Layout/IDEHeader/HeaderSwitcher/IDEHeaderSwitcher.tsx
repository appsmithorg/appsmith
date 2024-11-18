import { Flex, Icon, Text } from "../../../index";
import React, { type ForwardedRef } from "react";
import * as Styled from "./styles";

interface Props {
  prefix: string;
  title?: string;
  titleTestId: string;
  active: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
}

export const IDEHeaderSwitcher = React.forwardRef(
  (props: Props, ref: ForwardedRef<HTMLDivElement>) => {
    const { active, className, prefix, title, titleTestId, ...rest } = props;

    const separator = title ? " /" : "";

    return (
      <Styled.SwitchTrigger
        active={active}
        className={`flex align-center items-center justify-center ${className}`}
        ref={ref}
        {...rest}
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
    );
  },
);

IDEHeaderSwitcher.displayName = "IDEHeaderSwitcher";

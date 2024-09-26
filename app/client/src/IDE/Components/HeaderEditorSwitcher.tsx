import { Flex, Icon, Text } from "@appsmith/ads";
import React from "react";
import styled from "styled-components";

interface HeaderEditorSwitcherProps {
  prefix: string;
  title?: string;
  titleTestId: string;
  active: boolean;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  className?: string;
}

const SwitchTrigger = styled.div<{ active: boolean }>`
  border-radius: var(--ads-v2-border-radius);
  background-color: ${(props) =>
    props.active ? `var(--ads-v2-color-bg-subtle)` : "unset"};
  cursor: pointer;
  padding: var(--ads-v2-spaces-2);
  :hover {
    background-color: var(--ads-v2-color-bg-subtle);
  }
`;

const HeaderEditorSwitcher = React.forwardRef(
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (props: HeaderEditorSwitcherProps, ref: any) => {
    const { active, className, prefix, title, titleTestId, ...rest } = props;

    const separator = title ? " /" : "";

    return (
      <SwitchTrigger
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
      </SwitchTrigger>
    );
  },
);

export default HeaderEditorSwitcher;

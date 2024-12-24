import React, { useEffect, useState } from "react";
import { Flex, Popover, Text } from "@appsmith/ads";
import * as Styled from "./styles";
import type { Align, Side } from "@radix-ui/react-popper";

interface Props {
  trigger: React.ReactNode;
  onDismissClick: () => void;
  message: string;
  align?: Align;
  side?: Side;
  delayOpen?: number;
}

export const Nudge = (props: Props) => {
  const [open, setOpen] = useState(false);

  useEffect(
    function handleDelayOpenOnMount() {
      const timer = setTimeout(() => {
        setOpen(true);
      }, props.delayOpen || 0);

      return () => clearTimeout(timer);
    },
    [props.delayOpen],
  );

  return (
    <Popover open={open}>
      <Styled.PopoverTrigger data-active={open}>
        {props.trigger}
      </Styled.PopoverTrigger>
      <Styled.PopoverContent align={props.align} side={props.side} size="sm">
        <Flex
          alignItems="flex-start"
          backgroundColor="var(--ads-v2-color-bg-emphasis-max)"
          gap="spaces-2"
        >
          <Text color="#fff" kind="heading-xs">
            {props.message}
          </Text>
          <Styled.CloseIcon
            name="close-line"
            onClick={props.onDismissClick}
            size="md"
          />
        </Flex>
      </Styled.PopoverContent>
    </Popover>
  );
};

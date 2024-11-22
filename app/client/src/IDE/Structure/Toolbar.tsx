import React, { useEffect, useRef, useState } from "react";
import { Flex } from "@appsmith/ads";
import { debounce } from "lodash";
import { cn } from "@appsmith/utils";

interface ToolbarProps {
  children?: React.ReactNode[] | React.ReactNode;
}

const Toolbar = (props: ToolbarProps) => {
  const [shadow, setShadow] = useState(false);
  const toolbarRef = useRef<HTMLDivElement | null>(null);

  useEffect(function scrollHandler() {
    const handleScroll = debounce((e: Event) => {
      const scrolledElement = e.target as HTMLElement;

      if (!scrolledElement) return;

      const isScrolled = scrolledElement.scrollTop > 0;

      setShadow(isScrolled);
    }, 20);

    let adjacentElement: HTMLElement | null = null;

    if (toolbarRef.current) {
      adjacentElement = toolbarRef.current.nextElementSibling as HTMLElement;

      if (adjacentElement) {
        adjacentElement.addEventListener("scroll", handleScroll, {
          capture: true,
        });
      }
    }

    return () => {
      if (adjacentElement) {
        adjacentElement.removeEventListener("scroll", handleScroll, {
          capture: true,
        });
      }
    };
  }, []);

  return (
    <Flex
      alignItems="center"
      className={cn("sticky top-0 transition-shadow duration-300 ease-in-out", {
        "shadow-md": shadow,
      })}
      flexDirection="row"
      height="32px"
      justifyContent="space-between"
      padding="spaces-2"
      ref={toolbarRef}
      zIndex="10"
    >
      {props.children}
    </Flex>
  );
};

const Left = (props: ToolbarProps) => {
  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      gap="spaces-2"
      justifySelf="flex-start"
    >
      {props.children}
    </Flex>
  );
};

const Right = (props: ToolbarProps) => {
  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      gap="spaces-2"
      justifySelf="flex-end"
    >
      {props.children}
    </Flex>
  );
};

Toolbar.Left = Left;
Toolbar.Right = Right;

export default Toolbar;

import React, { useEffect } from "react";
import { Flex } from "@appsmith/ads";

interface ToolbarProps {
  children?: React.ReactNode[] | React.ReactNode;
}

const Toolbar = (props: ToolbarProps) => {
  useEffect(function detectScrollbar() {
    const ele = document.getElementById("uqi-editor-form-content");
    const toolbar = document.getElementById("action-toolbar");

    const handleScroll = function () {
      if (ele && ele.scrollTop > 0) {
        toolbar?.style.setProperty(
          "box-shadow",
          "0 4px 6px rgba(0, 0, 0, 0.1)",
        );
      } else {
        toolbar?.style.setProperty("box-shadow", "none");
      }
    };

    if (ele) {
      ele.addEventListener("scroll", handleScroll);
    }

    return function cleanup() {
      ele?.removeEventListener("scroll", handleScroll);
    };
  }, []);

  return (
    <Flex
      alignItems="center"
      flexDirection="row"
      height="32px"
      id="action-toolbar"
      justifyContent="space-between"
      padding="spaces-2"
      style={{
        transition: "box-shadow 0.3s ease",
        position: "sticky",
        top: 0,
      }}
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

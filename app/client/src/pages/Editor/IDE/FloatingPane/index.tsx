import React from "react";
import Wrapper from "./Wrapper";
import Content from "./Content";
import { useSelector } from "react-redux";
import { isFloatingPaneVisible } from "./selectors";

const FloatingPane = () => {
  const isVisible = useSelector(isFloatingPaneVisible);
  if (!isVisible) return null;
  return (
    <div>
      <Wrapper>
        <Content />
      </Wrapper>
    </div>
  );
};

export default FloatingPane;

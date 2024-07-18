import React, { useRef } from "react";
import Wrapper from "./Wrapper";
import Content from "./Content";
import { useDispatch, useSelector } from "react-redux";
import { isFloatingPaneVisible } from "./selectors";
import { useOnClickOutside } from "utils/hooks/useOnClickOutside";
import { updateFloatingPane } from "./actions";

const FloatingPane = () => {
  const isVisible = useSelector(isFloatingPaneVisible);
  const ref = useRef(null);
  const dispatch = useDispatch();
  useOnClickOutside([ref], () => {
    dispatch(updateFloatingPane({ selectedWidgetId: "0" }));
  });
  if (!isVisible) return null;
  return (
    <div ref={ref}>
      <Wrapper>
        <Content />
      </Wrapper>
    </div>
  );
};

export default FloatingPane;

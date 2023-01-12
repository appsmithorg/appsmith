import { Colors } from "constants/Colors";
import React from "react";
import { useSelector } from "react-redux";
import { getCommonWidgets } from "selectors/editorSelectors";
import styled from "styled-components";
import WidgetPaneTrigger from "./WidgetPaneCTA";

const Wrapper = styled.div`
  height: 40px;
  width: 100%;
  background-color: white;
  border-bottom: 1px solid ${Colors.GRAY_200};
`;

function WidgetTopBar() {
  const widgets = useSelector(getCommonWidgets);

  return (
    <Wrapper className="flex">
      <WidgetPaneTrigger />
      {widgets.map((widget) => {
        return (
          <div key={widget.type}>
            <img className="w-4 h-4" src={widget.icon} />
          </div>
        );
      })}
    </Wrapper>
  );
}

export default WidgetTopBar;

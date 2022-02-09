import React from "react";
import styled from "styled-components";
import Text, { FontWeight, TextType } from "components/ads/Text";
import { getWidgetIcon } from "pages/Editor/Explorer/ExplorerIcons";

const Wrapper = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

const IconWrapper = styled.span`
  div {
    height: 32px;
    width: 32px;
  }
  && {
    svg {
      height: 32px;
      width: 32px;
    }
  }
`;

function WidgetInfo() {
  return (
    <Wrapper>
      <IconWrapper>{getWidgetIcon("BUTTON_WIDGET")}</IconWrapper>
      <Text type={TextType.H4} weight={FontWeight.NORMAL}>
        Button
      </Text>
    </Wrapper>
  );
}

export default WidgetInfo;

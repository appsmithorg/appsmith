import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { Text, FontWeight, TextType } from "design-system-old";
import { IconWrapper } from "constants/IconConstants";
import { getWidgetCards } from "selectors/editorSelectors";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";

const Wrapper = styled.div`
  display: inline-flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
`;

interface WidgetInfoProps {
  widgetType: string;
}

function WidgetInfo({ widgetType }: WidgetInfoProps) {
  const widgetList = useSelector(getWidgetCards);
  const widgetInfo = useMemo(() => {
    return widgetList.find((widget) => widget.type === widgetType);
  }, [widgetType, widgetList.length]);

  return (
    <Wrapper>
      <IconWrapper>
        <img className="w-8 h-8" src={getAssetUrl(widgetInfo?.icon)} />
      </IconWrapper>
      <Text type={TextType.H4} weight={FontWeight.NORMAL}>
        {widgetInfo?.displayName}
      </Text>
    </Wrapper>
  );
}

export default WidgetInfo;

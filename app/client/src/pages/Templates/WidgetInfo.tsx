import React, { useMemo } from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import { Text } from "@appsmith/ads";
import { IconWrapper } from "constants/IconConstants";
import { getWidgetCards } from "selectors/editorSelectors";
import { getAssetUrl } from "ee/utils/airgapHelpers";

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
        <img
          className="w-5 h-5"
          src={getAssetUrl(widgetInfo?.icon as string)}
        />
      </IconWrapper>
      <Text kind="body-m">{widgetInfo?.displayName}</Text>
    </Wrapper>
  );
}

export default WidgetInfo;

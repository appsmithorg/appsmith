import React, { useMemo } from "react";

import { IconWrapper } from "constants/IconConstants";
import { getAssetUrl } from "ee/utils/airgapHelpers";
import { useSelector } from "react-redux";
import { getWidgetCards } from "selectors/editorSelectors";
import styled from "styled-components";

import { Text } from "@appsmith/ads";

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

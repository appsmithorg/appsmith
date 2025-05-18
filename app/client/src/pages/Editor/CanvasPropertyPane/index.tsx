import React from "react";
import ConversionButton from "../CanvasLayoutConversion/ConversionButton";
import styled from "styled-components";
import {
  LayoutSystemFeatures,
  useLayoutSystemFeatures,
} from "../../../layoutSystems/common/useLayoutSystemFeatures";
import { MainContainerWidthToggles } from "../MainContainerWidthToggles";

const Title = styled.p`
  color: var(--ads-v2-color-fg);
`;
const MainHeading = styled.h3`
  color: var(--ads-v2-color-fg-emphasis);
`;

export function CanvasPropertyPane() {
  const checkLayoutSystemFeatures = useLayoutSystemFeatures();
  const [enableLayoutControl, enableLayoutConversion] =
    checkLayoutSystemFeatures([
      LayoutSystemFeatures.ENABLE_CANVAS_LAYOUT_CONTROL,
      LayoutSystemFeatures.ENABLE_LAYOUT_CONVERSION,
    ]);

  return (
    <div className="relative ">
      <MainHeading className="px-4 py-3 text-sm font-medium">
        Properties
      </MainHeading>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          {enableLayoutControl && (
            <>
              <Title className="text-sm">Canvas size</Title>
              <MainContainerWidthToggles />
            </>
          )}
          {enableLayoutConversion && <ConversionButton />}
        </div>
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default CanvasPropertyPane;

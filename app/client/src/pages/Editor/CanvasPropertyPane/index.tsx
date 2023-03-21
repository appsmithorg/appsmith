import * as Sentry from "@sentry/react";

import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { PopoverPosition } from "@blueprintjs/core";
import { Button, Category, Size, TooltipComponent } from "design-system-old";

import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import ConversionButton from "../CanvasLayoutConversion/ConversionButton";
import { MainContainerLayoutControl } from "../MainContainerLayoutControl";
import {
  getIsAutoLayout,
  isAutoLayoutEnabled,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const Title = styled.p`
  color: ${Colors.GRAY_800};
`;
export function CanvasPropertyPane() {
  const dispatch = useDispatch();

  const openAppSettingsPane = () => {
    dispatch(openAppSettingsPaneAction());
  };
  const isAutoLayoutFeatureEnabled = useSelector(isAutoLayoutEnabled);
  const isAutoLayout = useSelector(getIsAutoLayout);
  return (
    <div className="relative ">
      <h3 className="px-4 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          {!isAutoLayout && (
            <>
              <Title className="text-sm">Canvas Size</Title>
              <MainContainerLayoutControl />
            </>
          )}
          {isAutoLayoutFeatureEnabled && <ConversionButton />}
          <TooltipComponent
            content={
              <>
                <p className="text-center">Update your app theme, URL</p>
                <p className="text-center">and other settings</p>
              </>
            }
            position={PopoverPosition.BOTTOM}
          >
            <Button
              category={Category.secondary}
              fill
              id="t--app-settings-cta"
              onClick={openAppSettingsPane}
              size={Size.medium}
              text="App Settings"
            />
          </TooltipComponent>
        </div>
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);

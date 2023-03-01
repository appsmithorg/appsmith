import React from "react";
import styled from "styled-components";
import * as Sentry from "@sentry/react";

import { Colors } from "constants/Colors";
import { MainContainerLayoutControl } from "../MainContainerLayoutControl";

const Title = styled.p`
  color: ${Colors.GRAY_800};
`;

export function CanvasPropertyPane() {
  // const openAppSettingsPane = () => {
  //   dispatch(openAppSettingsPaneAction());
  // };

  return (
    <div className="relative ">
      <h3 className="px-4 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          <Title className="text-sm">Canvas Size</Title>
          <MainContainerLayoutControl />

          {/* <TooltipComponent
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
          </TooltipComponent> */}
        </div>
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);

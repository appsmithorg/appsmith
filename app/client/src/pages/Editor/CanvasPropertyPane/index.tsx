import * as Sentry from "@sentry/react";

import React from "react";
import { useDispatch } from "react-redux";

import { PopoverPosition } from "@blueprintjs/core";
import { TooltipComponent } from "design-system-old";
import { Button } from "design-system";

import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import { AppPositionTypeControl } from "../AppPositionTypeControl";

export function CanvasPropertyPane() {
  const dispatch = useDispatch();

  const openAppSettingsPane = () => {
    dispatch(openAppSettingsPaneAction());
  };
  return (
    <div className="relative ">
      <h3 className="px-4 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          <AppPositionTypeControl />
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
              className="t--app-settings-cta"
              kind="secondary"
              onClick={openAppSettingsPane}
              size="md"
            >
              App Settings
            </Button>
          </TooltipComponent>
        </div>
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);

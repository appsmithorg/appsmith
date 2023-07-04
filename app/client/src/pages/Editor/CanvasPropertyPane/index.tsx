import * as Sentry from "@sentry/react";

import React from "react";
import { useDispatch, useSelector } from "react-redux";

import { Button, Tooltip } from "design-system";

import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import ConversionButton from "../CanvasLayoutConversion/ConversionButton";
import { MainContainerLayoutControl } from "../MainContainerLayoutControl";
import { getIsAutoLayout } from "selectors/editorSelectors";
import styled from "styled-components";
import AnalyticsUtil from "utils/AnalyticsUtil";

const Title = styled.p`
  color: var(--ads-v2-color-fg);
`;
const MainHeading = styled.h3`
  color: var(--ads-v2-color-fg-emphasis);
`;
export function CanvasPropertyPane() {
  const dispatch = useDispatch();

  const openAppSettingsPane = () => {
    AnalyticsUtil.logEvent("APP_SETTINGS_BUTTON_CLICK");
    dispatch(openAppSettingsPaneAction());
  };
  const isAutoLayout = useSelector(getIsAutoLayout);
  return (
    <div className="relative ">
      <MainHeading className="px-4 py-3 text-sm font-medium">
        Properties
      </MainHeading>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          {!isAutoLayout && (
            <>
              <Title className="text-sm">Canvas size</Title>
              <MainContainerLayoutControl />
            </>
          )}
          <ConversionButton />
          <Tooltip
            content={
              <>
                <p className="text-center">Update your app theme, URL</p>
                <p className="text-center">and other settings</p>
              </>
            }
            placement="bottom"
          >
            <Button
              UNSAFE_width="100%"
              className="t--app-settings-cta"
              kind="secondary"
              onClick={openAppSettingsPane}
              size="md"
            >
              App settings
            </Button>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);

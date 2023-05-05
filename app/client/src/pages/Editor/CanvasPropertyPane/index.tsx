import * as Sentry from "@sentry/react";

import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";

import { Collapse, PopoverPosition } from "@blueprintjs/core";
import {
  Button,
  Category,
  Size,
  TooltipComponent,
  Icon,
} from "design-system-old";

import { openAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import ConversionButton from "../CanvasLayoutConversion/ConversionButton";
import { MainContainerLayoutControl } from "../MainContainerLayoutControl";
import {
  getCurrentApplicationId,
  getCurrentPageId,
  getIsAutoLayout,
  isAutoLayoutEnabled,
} from "selectors/editorSelectors";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { isPackage } from "ce/pages/Applications/helper";
import { Switch } from "design-system-old";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import type { AppState } from "ce/reducers";
// import { StyledIcon } from "ce/pages/Applications";
import {
  SectionWrapper,
  CollapseContext,
  SectionTitle,
} from "../PropertyPane/PropertySection";

const Title = styled.p`
  color: ${Colors.GRAY_800};
`;

export function CanvasPropertyPane() {
  const dispatch = useDispatch();
  const applicationId = useSelector(getCurrentApplicationId);
  const pageId = useSelector(getCurrentPageId);
  const hasUI = useSelector((state: AppState) => {
    return state.ui.mods.config[pageId]?.hasUI || false;
  });
  const isPkg = isPackage(applicationId);
  const openAppSettingsPane = () => {
    dispatch(openAppSettingsPaneAction());
  };
  const isAutoLayoutFeatureEnabled = useSelector(isAutoLayoutEnabled);
  const isAutoLayout = useSelector(getIsAutoLayout);
  const [isParamsOpen, setIsParamsOpen] = useState(true);

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  const onHasUIChange = () => {
    dispatch({
      type: ReduxActionTypes.TOGGLE_HAS_UI,
      payload: {
        moduleId: pageId,
      },
    });
  };

  const parameters = (
    <SectionWrapper>
      <div
        className="section-title-wrapper flex items-center cursor-pointer"
        onClick={() => setIsParamsOpen((prev: boolean) => !prev)}
      >
        <SectionTitle>Parameters</SectionTitle>
        <Icon
          className="t--chevron-icon"
          name={isParamsOpen ? "arrow-down" : "arrow-right"}
          size={Size.small}
        />
      </div>
      <Collapse
        isOpen={isParamsOpen}
        keepChildrenMounted
        transitionDuration={0}
      >
        <div style={{ position: "relative", zIndex: 1 }}>
          <CollapseContext.Provider value={isParamsOpen}>
            <div className="flex flex-col">
              <div className="flex flex-row justify-between items-start action-callback-add">
                <span className="text-gray-800 py-1">Inputs</span>
                <button>
                  <span className="icon w-7 h-7 flex items-center justify-center">
                    <Icon
                      fillColor="var(--ads-color-black-700)"
                      name="plus"
                      size="extraLarge"
                    />
                  </span>
                </button>
              </div>
              <div className="flex flex-row justify-between items-start action-callback-add">
                <span className="text-gray-800 py-1">Outputs</span>
                <button>
                  <span className="icon w-7 h-7 flex items-center justify-center">
                    <Icon
                      fillColor="var(--ads-color-black-700)"
                      name="plus"
                      size="extraLarge"
                    />
                  </span>
                </button>
              </div>
            </div>
          </CollapseContext.Provider>
        </div>
      </Collapse>
    </SectionWrapper>
  );

  return (
    <div className="relative ">
      <h3 className="px-4 py-3 text-sm font-medium uppercase">Properties</h3>

      <div className="mt-3 space-y-6">
        <div className="px-4 space-y-2">
          {isPkg && (
            <Switch
              alignIndicator="right"
              checked={hasUI}
              label="Has UI"
              onChange={onHasUIChange}
            />
          )}
          {!isAutoLayout && (
            <>
              <Title className="text-sm">Canvas Size</Title>
              <MainContainerLayoutControl />
            </>
          )}
          {isAutoLayoutFeatureEnabled && !isPkg && <ConversionButton />}
          {isPkg && parameters}
          <TooltipComponent
            content={
              <>
                <p className="text-center">
                  Update your {isPkg ? "package" : "app"} theme, URL
                </p>
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
              text={isPkg ? "Package Settings" : "App Settings"}
            />
          </TooltipComponent>
        </div>
      </div>
    </div>
  );
}

CanvasPropertyPane.displayName = "CanvasPropertyPane";

export default Sentry.withProfiler(CanvasPropertyPane);

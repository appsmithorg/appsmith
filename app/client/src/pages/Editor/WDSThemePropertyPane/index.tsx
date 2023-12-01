import {
  SegmentedControl,
  Switch,
  Tooltip,
  Select,
  Option,
} from "design-system";
import styled from "styled-components";
import React, { useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import type { ThemeSetting } from "constants/AppConstants";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateApplication } from "@appsmith/actions/applicationActions";
import type { UpdateApplicationPayload } from "@appsmith/api/ApplicationApi";
import { getAppThemeSettings } from "@appsmith/selectors/applicationSelectors";
import ColorPickerComponent from "components/propertyControls/ColorPickerComponentV2";

import {
  THEME_SETTINGS_BORDER_RADIUS_OPTIONS,
  THEME_SETTINGS_DENSITY_OPTIONS,
  THEME_SETTINGS_SIZING_OPTIONS,
} from "./constants";
import SettingSection from "../ThemePropertyPane/SettingSection";
import { FONT_METRICS } from "@design-system/theming";

const SubText = styled.p`
  font-size: var(--ads-v2-font-size-4);
  line-height: 1rem;
  font-weight: var(--ads-v2-font-weight-normal);
  color: var(--ads-v2-color-fg);
`;

const FontText = styled.div`
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  font-size: 11px;
  height: 18px;
  width: 18px;
`;

const buttonGroupOptions = THEME_SETTINGS_BORDER_RADIUS_OPTIONS.map(
  (optionKey) => ({
    label: (
      <Tooltip content={optionKey.label} key={optionKey.label}>
        <div
          className="w-5 h-5 border-t-2 border-l-2 t--theme-appBorderRadius"
          style={{
            borderTopLeftRadius: optionKey.value,
            borderColor: "var(--ads-v2-color-fg)",
          }}
        />
      </Tooltip>
    ),
    value: optionKey.value,
  }),
);

function WDSThemePropertyPane() {
  const dispatch = useDispatch();
  const theme = useSelector(getAppThemeSettings);
  const applicationId = useSelector(getCurrentApplicationId);
  const [isFullColorPicker, setFullColorPicker] = React.useState(false);

  const updateTheme = useCallback(
    (theme: ThemeSetting) => {
      // (TODO): Add analytics to track theming updates

      const payload: UpdateApplicationPayload = {
        currentApp: true,
      };

      payload.applicationDetail = {
        themeSetting: theme,
      };

      dispatch(updateApplication(applicationId, payload));
    },
    [updateApplication],
  );

  return (
    <main className="mt-1">
      {/* COLORS */}
      <SettingSection className="px-4 pb-3" isDefaultOpen title="Color">
        <section className="space-y-2">
          <ColorPickerComponent
            changeColor={(color: string) => {
              updateTheme({
                ...theme,
                accentColor: color,
              });
            }}
            color={theme.accentColor}
            isFullColorPicker={isFullColorPicker}
            portalContainer={
              document.getElementById("app-settings-portal") || undefined
            }
            setFullColorPicker={setFullColorPicker}
          />
        </section>
        <Switch
          defaultSelected={theme.colorMode === "dark"}
          onChange={(isSelected: boolean) => {
            updateTheme({
              ...theme,
              colorMode: isSelected ? "dark" : "light",
            });
          }}
        >
          Dark Mode
        </Switch>
      </SettingSection>

      <SettingSection
        className="px-4 py-3 border-t "
        isDefaultOpen
        title="Typography"
      >
        <section className="space-y-2">
          <Select
            dropdownClassName="t--theme-font-dropdown"
            onSelect={(value: string) => {
              updateTheme({
                ...theme,
                fontFamily: value,
              });
            }}
            value={theme.fontFamily}
          >
            {Object.keys(FONT_METRICS)
              .filter((item) => {
                return (
                  ["-apple-system", "BlinkMacSystemFont", "Segoe UI"].includes(
                    item,
                  ) === false
                );
              })
              .map((option, index) => (
                <Option key={index} value={option}>
                  <div className="flex items-center w-full space-x-2 cursor-pointer">
                    <FontText className="flex items-center justify-center">
                      Aa
                    </FontText>
                    <div className="leading-normal">{option}</div>
                  </div>
                </Option>
              ))}
          </Select>
        </section>
      </SettingSection>

      {/* Dimensions */}
      <SettingSection
        className="px-4 py-3 border-t"
        isDefaultOpen
        title="Dimensions"
      >
        <section className="space-y-2">
          <SubText>Density</SubText>
          <SegmentedControl
            isFullWidth={false}
            onChange={(value: string) => {
              updateTheme({
                ...theme,
                density: Number(value),
              });
            }}
            options={THEME_SETTINGS_DENSITY_OPTIONS}
            value={theme.density.toString()}
          />
        </section>
        <section className="space-y-2">
          <SubText>Sizing</SubText>
          <SegmentedControl
            isFullWidth={false}
            onChange={(value: string) => {
              updateTheme({
                ...theme,
                sizing: Number(value),
              });
            }}
            options={THEME_SETTINGS_SIZING_OPTIONS}
            value={theme.sizing.toString()}
          />
        </section>
      </SettingSection>

      {/* BORDER RADIUS */}
      <SettingSection
        className="px-4 py-3 border-t "
        isDefaultOpen
        title="Corners"
      >
        <section className="space-y-2">
          <SegmentedControl
            isFullWidth={false}
            onChange={(value: string) => {
              updateTheme({
                ...theme,
                borderRadius: value,
              });
            }}
            options={buttonGroupOptions}
            value={theme.borderRadius}
          />
        </section>
      </SettingSection>
    </main>
  );
}

export { WDSThemePropertyPane };

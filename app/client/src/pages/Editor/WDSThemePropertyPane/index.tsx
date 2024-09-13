import { debounce } from "lodash";
import styled from "styled-components";
import { isValidColor } from "utils/helpers";
import { useDispatch, useSelector } from "react-redux";
import React, { useCallback, useRef, useState } from "react";
import type { ThemeSetting } from "constants/AppConstants";
import { getCurrentApplicationId } from "selectors/editorSelectors";
import { updateApplication } from "ee/actions/applicationActions";
import type { UpdateApplicationPayload } from "ee/api/ApplicationApi";
import { getAppThemeSettings } from "ee/selectors/applicationSelectors";
import {
  LeftIcon,
  StyledInputGroup,
} from "components/propertyControls/ColorPickerComponentV2";
import { SegmentedControl, Tooltip, Icon } from "@appsmith/ads";

import styles from "./styles.module.css";

import {
  THEME_SETTINGS_BORDER_RADIUS_OPTIONS,
  THEME_SETTINGS_DENSITY_OPTIONS,
  THEME_SETTINGS_ICON_STYLE_OPTIONS,
  THEME_SETTINGS_SIZING_OPTIONS,
  THEME_SETTINGS_COLOR_MODE_OPTIONS,
  THEME_SETTING_COLOR_PRESETS,
} from "./constants";
import SettingSection from "../ThemePropertyPane/SettingSection";
import { AppMaxWidthSelect } from "./components/AppMaxWidthSelect";

const SubText = styled.p`
  font-size: var(--ads-v2-font-size-4);
  line-height: 1rem;
  font-weight: var(--ads-v2-font-weight-normal);
  color: var(--ads-v2-color-fg);
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
  const inputRef = useRef<HTMLInputElement>(null);
  const dispatch = useDispatch();
  const theme = useSelector(getAppThemeSettings);
  const applicationId = useSelector(getCurrentApplicationId);
  const [accentColor, setAccentColor] = useState(theme.accentColor);
  const isCustomColor = THEME_SETTING_COLOR_PRESETS[theme.colorMode].includes(
    theme.accentColor,
  );

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
    [updateApplication, dispatch],
  );

  const debouncedOnColorChange = useCallback(
    debounce((e: React.ChangeEvent<HTMLInputElement>) => {
      updateTheme({
        ...theme,
        accentColor: e.target.value,
      });
      setAccentColor(e.target.value);
    }, 250),
    [theme, updateTheme],
  );

  const onColorInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isValidColor(e.target.value)) {
      updateTheme({
        ...theme,
        accentColor: e.target.value,
      });

      (document.querySelector("#color-picker") as HTMLInputElement).value =
        e.target.value;
    }

    setAccentColor(e.target.value);
  };

  return (
    <main className={styles.main}>
      {/* COLORS */}
      <SettingSection className="px-4 pb-3" isDefaultOpen title="Color">
        <section className="space-y-2">
          <SegmentedControl
            data-testid="t--anvil-theme-settings-color-mode"
            isFullWidth
            onChange={(value: string) => {
              updateTheme({
                ...theme,
                colorMode: value as ThemeSetting["colorMode"],
              });
              inputRef.current?.focus();
            }}
            options={THEME_SETTINGS_COLOR_MODE_OPTIONS}
            value={theme.colorMode ?? "LIGHT"}
          />
          <StyledInputGroup
            $isValid={isValidColor(accentColor)}
            data-testid="t--color-picker-input"
            inputRef={inputRef}
            leftIcon={<LeftIcon color={accentColor} />}
            onChange={onColorInputChange}
            placeholder={"Enter color name or hex"}
            type="text"
            value={accentColor}
          />
          <div
            className={styles["presets-list"]}
            data-testid="t--anvil-theme-settings-accent-color-list"
          >
            {THEME_SETTING_COLOR_PRESETS[theme.colorMode].map((color) => (
              <button
                data-selected={theme.accentColor === color ? "" : undefined}
                key={color}
                onClick={() => {
                  updateTheme({
                    ...theme,
                    accentColor: color,
                  });
                  inputRef.current?.focus();
                  setAccentColor(color);
                  (
                    document.querySelector("#color-picker") as HTMLInputElement
                  ).value = color;
                }}
                style={{ backgroundColor: color, color }}
              >
                {theme.accentColor === color && (
                  <Icon color="white" name="check-line" size="md" />
                )}
              </button>
            ))}
            <label
              data-selected={isCustomColor === false ? "" : undefined}
              htmlFor="color-picker"
              style={{ color: theme.accentColor }}
            >
              {isCustomColor === false && (
                <Icon color="white" name="check-line" size="md" />
              )}
              <input
                defaultValue={theme.accentColor}
                id="color-picker"
                onChange={debouncedOnColorChange}
                type="color"
              />
            </label>
          </div>
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
            data-testid="t--anvil-theme-settings-density"
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
            data-testid="t--anvil-theme-settings-sizing"
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
            data-testid="t--anvil-theme-settings-corners"
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

      {/* Icon Style */}
      <SettingSection
        className="px-4 py-3 border-t"
        isDefaultOpen
        title="Icons"
      >
        <section className="space-y-2">
          <SubText>Icon Style</SubText>
          <SegmentedControl
            data-testid="t--anvil-theme-settings-icon-style"
            isFullWidth={false}
            onChange={(value: string) => {
              updateTheme({
                ...theme,
                iconStyle: value as ThemeSetting["iconStyle"],
              });
            }}
            options={THEME_SETTINGS_ICON_STYLE_OPTIONS}
            value={theme.iconStyle}
          />
        </section>
      </SettingSection>

      {/* Layout Style */}
      <SettingSection
        className="px-4 py-3 border-t"
        isDefaultOpen
        title="Layout"
      >
        <section className="space-y-2">
          <SubText>Max app width</SubText>
          <AppMaxWidthSelect
            onSelect={(value) => {
              updateTheme({
                ...theme,
                appMaxWidth: value as ThemeSetting["appMaxWidth"],
              });
            }}
            value={theme.appMaxWidth}
          />
        </section>
      </SettingSection>
    </main>
  );
}

export { WDSThemePropertyPane };

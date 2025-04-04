import { Form } from "@storybook/components";
import React, { useCallback } from "react";
import { Flex } from "@appsmith/wds";
import { ColorControl, BooleanControl, RangeControl } from "@storybook/blocks";
import styled from "styled-components";
import { debounce } from "lodash";
import { AddonPanel } from "@storybook/components";

const StyledSelect = styled(Form.Select)`
  appearance: none;
  padding-right: 30px;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23696969%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat, repeat;
  background-position:
    right 0.8em top 50%,
    0 0;
  background-size:
    0.65em auto,
    100%;
`;

interface ThemeSettingsProps {
  seedColor?: string;
  setSeedColor?: (value?: string) => void;
  isDarkMode?: boolean;
  setDarkMode?: (value?: boolean) => void;
  borderRadius?: string;
  setBorderRadius?: (value: string) => void;
  fontFamily?: string;
  setFontFamily?: (value: string) => void;
  userDensity?: number;
  userSizing?: number;
  setUserDensity?: (value: number) => void;
  setUserSizing?: (value: number) => void;
  direction?: "column" | "row";
  isHintVisible?: boolean;
}

export const ThemeSettings = ({
  borderRadius,
  direction = "column",
  isDarkMode,
  isHintVisible = false,
  seedColor,
  setBorderRadius,
  setDarkMode,
  setSeedColor,
  setUserDensity,
  setUserSizing,
  userDensity = 1,
  userSizing = 1,
}: ThemeSettingsProps) => {
  const colorChange = (value?: string) => setSeedColor && setSeedColor(value);
  const debouncedSeedColorChange = useCallback(debounce(colorChange, 300), []);

  return (
    // AddonPanel is necessary that ColorControl works correctly
    <AddonPanel active>
      <Flex direction={direction} gap="12px" padding="4px">
        {setDarkMode && (
          <Flex
            alignItems="start"
            direction="column"
            gap="4px"
            marginBottom="-8px"
          >
            <small>Dark mode</small>
            <BooleanControl
              name="color-scheme"
              onChange={setDarkMode}
              value={isDarkMode}
            />
          </Flex>
        )}

        {setSeedColor && (
          <Flex direction="column" gap="4px">
            <small>Seed</small>
            <ColorControl
              defaultValue={seedColor}
              name="seed-color"
              onChange={debouncedSeedColorChange}
              value={seedColor}
            />
          </Flex>
        )}

        {setBorderRadius && (
          <Flex direction="column" gap="4px">
            <small>Border Radius</small>
            <StyledSelect
              defaultValue={borderRadius}
              id="border-radius"
              onChange={(e) => setBorderRadius(e.target.value)}
              size="100%"
              title="Border Radius"
            >
              <option value="8px">Rounded</option>
              <option value="0px">Sharp</option>
              <option value="20px">Pill</option>
            </StyledSelect>
          </Flex>
        )}

        {setUserDensity && (
          <Flex direction="column" gap="4px">
            <small>Density</small>
            <RangeControl
              max={120}
              min={80}
              name="root-unit-ratio"
              onChange={(value) =>
                setUserDensity(value != null ? value / 100 : 1)
              }
              step={10}
              value={userDensity * 100}
            />
          </Flex>
        )}

        {setUserSizing && (
          <Flex direction="column" gap="4px">
            <small>Sizing</small>
            <RangeControl
              max={120}
              min={80}
              name="root-unit-ratio"
              onChange={(value) =>
                setUserSizing(value != null ? value / 100 : 1)
              }
              step={10}
              value={userSizing * 100}
            />
          </Flex>
        )}

        {isHintVisible && (
          <small style={{ borderTop: "1px solid #ccc", paddingTop: "10px" }}>
            This add-on tests WDS widget theming and may impact other stories.
            Dark mode works correctly only for WDS component pages.
          </small>
        )}
      </Flex>
    </AddonPanel>
  );
};

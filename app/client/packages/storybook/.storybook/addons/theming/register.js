import styled from "styled-components";
import React, { useEffect } from "react";
import { addons, types } from "@storybook/addons";
import {
  Icons,
  IconButton,
  WithTooltip,
  Form,
  H6,
  ColorControl,
} from "@storybook/components";

import { useGlobals } from "@storybook/api";
import { fontMetricsMap } from "@design-system/wds";

const { Select } = Form;

const Wrapper = styled.div`
  padding: 10px;
  display: flex;
  flex-direction: column;
  gap: 10px;
`;

const StyledSelect = styled(Select)`
  appearance: none;
  padding-right: 30px;
  -moz-appearance: none;
  -webkit-appearance: none;
  appearance: none;
  background-image: url("data:image/svg+xml;charset=US-ASCII,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22292.4%22%20height%3D%22292.4%22%3E%3Cpath%20fill%3D%22%23696969%22%20d%3D%22M287%2069.4a17.6%2017.6%200%200%200-13-5.4H18.4c-5%200-9.3%201.8-12.9%205.4A17.6%2017.6%200%200%200%200%2082.2c0%205%201.8%209.3%205.4%2012.9l128%20127.9c3.6%203.6%207.8%205.4%2012.8%205.4s9.2-1.8%2012.8-5.4L287%2095c3.5-3.5%205.4-7.8%205.4-12.8%200-5-1.9-9.2-5.5-12.8z%22%2F%3E%3C%2Fsvg%3E");
  background-repeat: no-repeat, repeat;
  background-position: right 0.8em top 50%, 0 0;
  background-size: 0.65em auto, 100%;
`;

addons.register("wds/theming", () => {
  addons.add("wds-addon/toolbar", {
    id: "wds-addon/toolbar",
    title: "Theming",
    type: types.TOOL,
    match: (args) => {
      const { viewMode, storyId } = args;

      // show the addon only on wds
      if (
        storyId &&
        storyId?.includes("wds") &&
        !!(viewMode && viewMode.match(/^(story|docs)$/))
      )
        return true;

      return false;
    },
    render: ({ active }) => {
      const [globals, updateGlobals] = useGlobals();

      const updateGlobal = (key, value) => {
        updateGlobals({
          [key]: value,
        });
      };

      return (
        <WithTooltip
          trigger="click"
          placement="bottom"
          tooltipShown={active}
          closeOnClick
          tooltip={
            <Wrapper>
              <div>
                <H6>Border Radius</H6>
                <StyledSelect
                  id="border-radius"
                  label="Border Radius"
                  size="100%"
                  defaultValue={globals.borderRadius}
                  onChange={(e) => updateGlobal("borderRadius", e.target.value)}
                >
                  <option value="0px">Sharp</option>
                  <option value="0.375rem">Rounded</option>
                  <option value="1rem">Pill</option>
                </StyledSelect>
              </div>

              <div>
                <H6>Accent Color</H6>
                <ColorControl
                  id="accent-color"
                  name="accent-color"
                  label="Accent Color"
                  defaultValue={globals.accentColor}
                  value={globals.accentColor}
                  onChange={(value) => updateGlobal("accentColor", value)}
                />
              </div>

              <div>
                <H6>Font Family</H6>
                <StyledSelect
                  id="font-family"
                  label="Font Family"
                  size="100%"
                  defaultValue={globals.fontFamily}
                  onChange={(e) => updateGlobal("fontFamily", e.target.value)}
                >
                  <option value="">System Default</option>
                  {Object.keys(fontMetricsMap)
                    .filter((item) => {
                      return (
                        [
                          "-apple-system",
                          "BlinkMacSystemFont",
                          "Segoe UI",
                        ].includes(item) === false
                      );
                    })
                    .map((font) => (
                      <option value={font} key={`font-famiy-${font}`}>
                        {font}
                      </option>
                    ))}
                </StyledSelect>
              </div>
            </Wrapper>
          }
        >
          <IconButton key="wds-addon/toolbar" active={active} title="Theming">
            <Icons icon="paintbrush" />
          </IconButton>
        </WithTooltip>
      );
    },
  });
});

import React from "react";
import { Select, Option } from "@appsmith/ads";
import type { AppTheme } from "entities/AppTheming";
import styled from "styled-components";

interface ThemeFontControlProps {
  theme: AppTheme;
  sectionName: string;
  options: string[];
  selectedOption: string;
  updateTheme: (theme: AppTheme) => void;
}

const FontText = styled.div`
  border-radius: var(--ads-v2-border-radius);
  border: 1px solid var(--ads-v2-color-border);
  font-size: 11px;
  height: 18px;
  width: 18px;
`;

function ThemeFontControl(props: ThemeFontControlProps) {
  const { options, sectionName, selectedOption, theme, updateTheme } = props;

  const onSelect = (value: string) => {
    updateTheme({
      ...theme,
      properties: {
        ...theme.properties,
        fontFamily: {
          ...theme.properties.fontFamily,
          [sectionName]: value || selectedOption,
        },
      },
    });
  };

  return (
    <section className="space-y-2">
      <Select
        dropdownClassName="t--theme-font-dropdown"
        onSelect={onSelect}
        value={selectedOption}
      >
        {options.map((option, index) => (
          <Option key={index} value={option}>
            <div className="flex space-x-2  w-full cursor-pointer items-center">
              <FontText className="flex items-center justify-center">
                Aa
              </FontText>
              <div className="leading-normal">{option}</div>
            </div>
          </Option>
        ))}
      </Select>
    </section>
  );
}

export default ThemeFontControl;

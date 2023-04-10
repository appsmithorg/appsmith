import React from "react";
import { Select, Option } from "design-system";
import type { AppTheme } from "entities/AppTheming";

interface ThemeFontControlProps {
  theme: AppTheme;
  sectionName: string;
  options: any[];
  selectedOption: string;
  updateTheme: (theme: AppTheme) => void;
}

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
      <Select defaultValue={selectedOption} onSelect={onSelect}>
        {options.map((option, index) => (
          <Option key={index} value={option}>
            <div className="flex space-x-2  w-full cursor-pointer">
              <div className="flex items-center justify-center w-6 h-6 bg-white border">
                Aa
              </div>
              <div className="leading-normal">{option}</div>
            </div>
          </Option>
        ))}
      </Select>
    </section>
  );
}

export default ThemeFontControl;

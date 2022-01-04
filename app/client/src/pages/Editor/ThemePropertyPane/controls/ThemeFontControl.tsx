import React from "react";

import Dropdown, { DropdownOption } from "components/ads/Dropdown";
import { AppTheme } from "entities/AppTheming";

interface ThemeFontControlProps {
  theme: AppTheme;
  sectionName: string;
  options: string[];
  selectedOption: string;
  updateTheme: (theme: AppTheme) => void;
}

function ThemeFontControl(props: ThemeFontControlProps) {
  const { options, sectionName, selectedOption, theme, updateTheme } = props;

  return (
    <section className="space-y-2">
      <Dropdown
        className="px-0"
        options={options.map((option) => ({
          value: option,
          label: option,
        }))}
        renderOption={({ isSelectedNode, option }) => (
          <div
            className={`flex  space-x-2 w-full ${
              isSelectedNode ? "" : "px-2 py-2 hover:bg-gray-100 cursor-pointer"
            }`}
            onClick={() => {
              if (!isSelectedNode) {
                updateTheme({
                  ...theme,
                  properties: {
                    ...theme.properties,
                    fontFamily: {
                      ...theme.properties.fontFamily,
                      [sectionName]:
                        (option as DropdownOption).value || selectedOption,
                    },
                  },
                });
              }
            }}
          >
            <div className="flex items-center justify-center w-6 h-6 bg-trueGray-100">
              A
            </div>
            <div>{(option as DropdownOption).label}</div>
          </div>
        )}
        selected={{
          label: selectedOption,
          value: selectedOption,
        }}
        showLabelOnly
        width="100%"
      />
    </section>
  );
}

export default ThemeFontControl;

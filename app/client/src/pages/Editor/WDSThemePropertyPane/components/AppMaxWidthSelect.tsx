import { APP_MAX_WIDTH } from "@design-system/theming";
import { Option, Select } from "design-system";
import React from "react";
import { useSelector } from "react-redux";
import { getAppThemeSettings } from "@appsmith/selectors/applicationSelectors";

interface AppMaxWidthSelectProps {
  onSelect: (value: string) => void;
}

const resolveOptionLabelText = (option: APP_MAX_WIDTH) => {
  switch (option) {
    case APP_MAX_WIDTH.Unlimited:
      return "Unlimited";
    case APP_MAX_WIDTH.Large:
      return "Large";
    case APP_MAX_WIDTH.Medium:
      return "Medium";
    default: {
      const exhaustiveCheck: never = option;
      throw new Error(`Unhandled app max width: ${exhaustiveCheck}`);
    }
  }
};

export const AppMaxWidthSelect = ({ onSelect }: AppMaxWidthSelectProps) => {
  const theme = useSelector(getAppThemeSettings);

  return (
    <Select
      dropdownClassName="t--theme-layout-dropdown"
      onSelect={onSelect}
      value={theme.appMaxWidth}
    >
      {Object.values(APP_MAX_WIDTH).map((option, index) => (
        <Option key={index} value={option}>
          <div className="flex items-center w-full space-x-2 cursor-pointer">
            <div className="leading-normal">
              {resolveOptionLabelText(option)}
            </div>
          </div>
        </Option>
      ))}
    </Select>
  );
};

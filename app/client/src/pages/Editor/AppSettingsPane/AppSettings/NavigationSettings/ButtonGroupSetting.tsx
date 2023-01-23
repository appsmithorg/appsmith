import React from "react";
import {
  TextType,
  Text,
  ButtonGroup,
  ButtonGroupOption,
} from "design-system-old";
import {
  NavigationSetting,
  StringsFromNavigationSetting,
} from "constants/AppConstants";
import { UpdateSetting } from ".";

export type ButtonGroupSettingProps = {
  heading: string;
  options: ButtonGroupOption[];
  navigationSetting: NavigationSetting;
  keyName: keyof StringsFromNavigationSetting;
  updateSetting: UpdateSetting;
};

const ButtonGroupSetting = ({
  heading,
  keyName,
  navigationSetting,
  options,
  updateSetting,
}: ButtonGroupSettingProps) => {
  const onChange = (value: string) => {
    updateSetting(keyName as keyof NavigationSetting, value);
  };

  return (
    <div className="pt-4">
      <Text type={TextType.P1}>{heading}</Text>
      <div className="pt-1">
        <ButtonGroup
          fullWidth
          options={options}
          selectButton={onChange}
          values={[navigationSetting[keyName]]}
        />
      </div>
    </div>
  );
};

export default ButtonGroupSetting;

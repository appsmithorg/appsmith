import React, { useEffect, useState } from "react";
import { TextType, Text, ButtonGroup, ButtonGroupOption } from "design-system";
import {
  NavigationSetting,
  StringsFromNavigationSetting,
} from "constants/AppConstants";
import { UpdateSetting } from ".";
import equal from "fast-deep-equal/es6";
import usePrevious from "utils/hooks/usePrevious";

export type ButtonGroupSettingProps = {
  heading: string;
  options: ButtonGroupOption[];
  navigationSetting: StringsFromNavigationSetting;
  keyName: string;
  updateSetting: UpdateSetting;
};

const ButtonGroupSetting = ({
  heading,
  keyName,
  navigationSetting,
  options,
  updateSetting,
}: ButtonGroupSettingProps) => {
  const [selectedValue, setSelectedValue] = useState<string[]>([]);
  const previousNavigationSetting = usePrevious(navigationSetting);

  useEffect(() => {
    if (!equal(previousNavigationSetting, navigationSetting)) {
      const currentValue =
        navigationSetting?.[keyName as keyof StringsFromNavigationSetting] ||
        "";

      setSelectedValue([currentValue]);
    }
  }, [navigationSetting]);

  const onChange = (value: string) => {
    setSelectedValue([value]);
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
          values={selectedValue}
        />
      </div>
    </div>
  );
};

export default ButtonGroupSetting;

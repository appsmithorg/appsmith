import React, { useEffect, useState } from "react";
import { TextType, Text, ButtonGroup, ButtonGroupOption } from "design-system";
import {
  PublishedNavigationSetting,
  StringsFromPublishedNavigationSetting,
} from "constants/AppConstants";
import { UpdateSetting } from ".";
import equal from "fast-deep-equal/es6";
import usePrevious from "utils/hooks/usePrevious";

export type ButtonGroupSettingProps = {
  heading: string;
  options: ButtonGroupOption[];
  publishedNavigationSetting: StringsFromPublishedNavigationSetting;
  keyName: string;
  updateSetting: UpdateSetting;
};

const ButtonGroupSetting = ({
  heading,
  keyName,
  options,
  publishedNavigationSetting,
  updateSetting,
}: ButtonGroupSettingProps) => {
  const [selectedValue, setSelectedValue] = useState<string[]>([]);
  const previousPublishedNavigationSetting = usePrevious(
    publishedNavigationSetting,
  );

  useEffect(() => {
    if (
      !equal(previousPublishedNavigationSetting, publishedNavigationSetting)
    ) {
      const currentValue =
        publishedNavigationSetting?.[
          keyName as keyof StringsFromPublishedNavigationSetting
        ] || "";

      setSelectedValue([currentValue]);
    }
  }, [publishedNavigationSetting]);

  const onChange = (value: string) => {
    setSelectedValue([value]);
    updateSetting(keyName as keyof PublishedNavigationSetting, value);
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

import {
  APP_NAVIGATION_SETTING,
  createMessage,
} from "@appsmith/constants/messages";
import type { NavigationSetting } from "constants/AppConstants";
import type { DropdownOption } from "design-system-old";
import { Dropdown, Text, TextType } from "design-system-old";
import React from "react";
import type { UpdateSetting } from ".";

const LogoConfiguration = (props: {
  options: DropdownOption[];
  navigationSetting: NavigationSetting;
  updateSetting: UpdateSetting;
}) => {
  const { options } = props;

  const unavailableLabel = " - [Unavailable atm]";

  const handleOnSelect = (value?: { label: string; value: string }) => {
    props.updateSetting("logoConfiguration", value?.value || "");
  };

  return (
    <div className="pt-4">
      <Text type={TextType.P1}>
        {createMessage(APP_NAVIGATION_SETTING.logoConfigurationLabel) +
          unavailableLabel}
      </Text>
      <Dropdown
        onSelect={handleOnSelect}
        options={options}
        selected={options.find(
          (item) => item.value === props.navigationSetting?.logoConfiguration,
        )}
        showLabelOnly
        width="100%"
      />
    </div>
  );
};

export default LogoConfiguration;

import {
  APP_NAVIGATION_SETTING,
  createMessage,
} from "@appsmith/constants/messages";
import { NavigationSetting } from "constants/AppConstants";
import { Dropdown, DropdownOption } from "design-system";
import _ from "lodash";
import React from "react";
import { UpdateSetting } from ".";
import StyledPropertyHelpLabel from "./StyledPropertyHelpLabel";

const LogoConfiguration = (props: {
  options: DropdownOption[];
  navigationSetting: NavigationSetting;
  updateSetting: UpdateSetting;
}) => {
  const { options } = props;

  const doesntWorkRightNowLabel = " - [Doesn't work (...right now)]";

  const handleOnSelect = (value?: { label: string; value: string }) => {
    props.updateSetting("logoConfiguration", value?.value || "");
  };

  return (
    <div className="pt-4">
      <StyledPropertyHelpLabel
        label={
          createMessage(APP_NAVIGATION_SETTING.logoConfigurationLabel) +
          doesntWorkRightNowLabel
        }
        lineHeight="1.17"
        maxWidth="270px"
      />
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

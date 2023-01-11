import {
  APP_NAVIGATION_SETTING,
  createMessage,
} from "@appsmith/constants/messages";
import {
  NAVIGATION_SETTINGS,
  PublishedNavigationSetting,
} from "constants/AppConstants";
import { Dropdown } from "design-system";
import _ from "lodash";
import React from "react";
import { UpdateSetting } from ".";
import StyledPropertyHelpLabel from "./StyledPropertyHelpLabel";

const LogoConfiguration = (props: {
  publishedNavigationSetting: PublishedNavigationSetting;
  updateSetting: UpdateSetting;
}) => {
  const options = [
    {
      label: _.startCase(
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
      ),
      value: NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_AND_APPLICATION_TITLE,
    },
    {
      label: _.startCase(NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY),
      value: NAVIGATION_SETTINGS.LOGO_CONFIGURATION.LOGO_ONLY,
    },
    {
      label: _.startCase(
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY,
      ),
      value: NAVIGATION_SETTINGS.LOGO_CONFIGURATION.APPLICATION_TITLE_ONLY,
    },
    {
      label: _.startCase(
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE,
      ),
      value:
        NAVIGATION_SETTINGS.LOGO_CONFIGURATION.NO_LOGO_OR_APPLICATION_TITLE,
    },
  ];
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
          (item) =>
            item.value === props.publishedNavigationSetting?.logoConfiguration,
        )}
        showLabelOnly
        width="100%"
      />
    </div>
  );
};

export default LogoConfiguration;

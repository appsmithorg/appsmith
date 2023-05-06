import React from "react";
import type { Dispatch, SetStateAction } from "react";
import StyledPropertyHelpLabel from "./StyledPropertyHelpLabel";
import SwitchWrapper from "../../Components/SwitchWrapper";
import { Switch } from "design-system-old";
import type { LogoConfigurationSwitches } from ".";
import _ from "lodash";

const SwitchSettingForLogoConfiguration = (props: {
  label: string;
  keyName: keyof LogoConfigurationSwitches;
  tooltip?: string;
  logoConfigurationSwitches: LogoConfigurationSwitches;
  setLogoConfigurationSwitches: Dispatch<
    SetStateAction<LogoConfigurationSwitches>
  >;
}) => {
  const {
    keyName,
    label,
    logoConfigurationSwitches,
    setLogoConfigurationSwitches,
    tooltip,
  } = props;

  // updateSetting("logoConfiguration", !isChecked);
  // logEvent(keyName as keyof StringsFromNavigationSetting, !isChecked);

  return (
    <div className="pt-4">
      <div className="flex justify-between content-center">
        <StyledPropertyHelpLabel
          label={label}
          lineHeight="1.17"
          maxWidth="270px"
          tooltip={tooltip}
        />

        <SwitchWrapper>
          <Switch
            checked={logoConfigurationSwitches[keyName]}
            className="mb-0"
            id={`t--navigation-settings-${_.kebabCase(keyName)}`}
            large
            onChange={() => {
              setLogoConfigurationSwitches({
                ...logoConfigurationSwitches,
                [keyName]: !logoConfigurationSwitches[keyName],
              });
            }}
          />
        </SwitchWrapper>
      </div>
    </div>
  );
};

export default SwitchSettingForLogoConfiguration;

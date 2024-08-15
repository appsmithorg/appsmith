import React from "react";
import type { Dispatch, SetStateAction } from "react";
import { Switch } from "@appsmith/ads";
import type { LogoConfigurationSwitches } from ".";
import kebabCase from "lodash/kebabCase";

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
  } = props;

  // updateSetting("logoConfiguration", !isChecked);
  // logEvent(keyName as keyof StringsFromNavigationSetting, !isChecked);

  return (
    <div className="pt-4">
      <Switch
        className="mb-0"
        id={`t--navigation-settings-${kebabCase(keyName)}`}
        isSelected={logoConfigurationSwitches[keyName]}
        onChange={() => {
          setLogoConfigurationSwitches({
            ...logoConfigurationSwitches,
            [keyName]: !logoConfigurationSwitches[keyName],
          });
        }}
      >
        {label}
      </Switch>
    </div>
  );
};

export default SwitchSettingForLogoConfiguration;

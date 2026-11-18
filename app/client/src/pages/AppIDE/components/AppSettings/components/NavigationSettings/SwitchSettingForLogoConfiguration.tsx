import React from "react";
import { Switch } from "@appsmith/ads";
import type { LogoConfigurationSwitches } from "../../types";
import kebabCase from "lodash/kebabCase";

const SwitchSettingForLogoConfiguration = (props: {
  label: string;
  keyName: keyof LogoConfigurationSwitches;
  isSelected: boolean;
  onChange: () => void;
}) => {
  const { isSelected, keyName, label, onChange } = props;

  return (
    <div className="pt-4">
      <Switch
        className="mb-0"
        id={`t--navigation-settings-${kebabCase(keyName)}`}
        isSelected={isSelected}
        onChange={onChange}
      >
        {label}
      </Switch>
    </div>
  );
};

export default SwitchSettingForLogoConfiguration;

import React from "react";
import type {
  NavigationSetting,
  StringsFromNavigationSetting,
} from "constants/AppConstants";
import StyledPropertyHelpLabel from "./StyledPropertyHelpLabel";
import { Switch } from "@appsmith/ads";
import type { UpdateSetting } from "../../types";
import kebabCase from "lodash/kebabCase";
import { logEvent } from "./utils";

const SwitchSetting = (props: {
  label: string;
  keyName: keyof StringsFromNavigationSetting | keyof NavigationSetting;
  value: boolean;
  updateSetting: UpdateSetting;
  tooltip?: string;
}) => {
  const { keyName, label, tooltip, updateSetting, value } = props;

  return (
    <div className="pt-4">
      <div className="flex justify-between content-center">
        <Switch
          id={`t--navigation-settings-${kebabCase(keyName)}`}
          isSelected={value}
          onChange={() => {
            updateSetting(keyName, !value);
            logEvent(keyName as keyof StringsFromNavigationSetting, !value);
          }}
        >
          <StyledPropertyHelpLabel
            label={label}
            onClick={() => {
              updateSetting(keyName, !value);
              logEvent(keyName as keyof StringsFromNavigationSetting, !value);
            }}
            tooltip={tooltip}
          />
        </Switch>
      </div>
    </div>
  );
};

export default SwitchSetting;

import React from "react";
import styled from "styled-components";
import { TextType, Text } from "@appsmith/ads-old";
import type { SegmentedControlOption } from "@appsmith/ads";
import { SegmentedControl } from "@appsmith/ads";
import type {
  NavigationSetting,
  StringsFromNavigationSetting,
} from "constants/AppConstants";
import { logEvent } from "./utils";
import type { UpdateSetting } from ".";

const StyledSegmentedControl = styled(SegmentedControl)`
  > .ads-v2-segmented-control__segments-container {
    flex: 1 1 0%;
  }
`;

export interface ButtonGroupSettingProps {
  heading: string;
  options: Array<
    // TODO: Fix this the next time the file is edited
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    SegmentedControlOption & { startIcon?: any; hidden?: boolean }
  >;
  navigationSetting: NavigationSetting;
  keyName: keyof StringsFromNavigationSetting;
  updateSetting: UpdateSetting;
}

const ButtonGroupSetting = ({
  heading,
  keyName,
  navigationSetting,
  options,
  updateSetting,
}: ButtonGroupSettingProps) => {
  const onChange = (value: string) => {
    updateSetting(keyName as keyof NavigationSetting, value);
    logEvent(keyName, value);
  };

  const visibleOptions = options.filter((item) => !item.hidden);

  return (
    <div className={`pt-4 t--navigation-settings-${keyName}`}>
      <Text type={TextType.P1}>{heading}</Text>
      <div className="pt-1">
        <StyledSegmentedControl
          defaultValue={navigationSetting[keyName]}
          onChange={onChange}
          options={visibleOptions}
        />
      </div>
    </div>
  );
};

export default ButtonGroupSetting;

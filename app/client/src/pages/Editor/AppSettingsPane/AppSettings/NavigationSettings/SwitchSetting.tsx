import React from "react";
import { NavigationSetting } from "constants/AppConstants";
import StyledPropertyHelpLabel from "./StyledPropertyHelpLabel";
import SwitchWrapper from "../../Components/SwitchWrapper";
import { Switch } from "design-system-old";
import { UpdateSetting } from ".";
import _ from "lodash";

const SwitchSetting = (props: {
  label: string;
  keyName: keyof NavigationSetting;
  value: boolean;
  updateSetting: UpdateSetting;
}) => {
  const { keyName, label, updateSetting, value } = props;

  return (
    <div className="pt-4">
      <div className="flex justify-between content-center">
        <StyledPropertyHelpLabel
          label={label}
          lineHeight="1.17"
          maxWidth="270px"
        />
        <SwitchWrapper>
          <Switch
            checked={value}
            className="mb-0"
            // disabled={isFetchingApplication || isChangingViewAccess}
            id={`t--navigation-settings-${_.kebabCase(keyName)}`}
            large
            onChange={() => {
              // application &&
              // dispatch(
              //   changeAppViewAccessInit(
              //     application?.id,
              //     !value?.showNavbar,
              //   ),
              // )

              updateSetting(keyName, !value);
            }}
          />
        </SwitchWrapper>
      </div>
    </div>
  );
};

export default SwitchSetting;

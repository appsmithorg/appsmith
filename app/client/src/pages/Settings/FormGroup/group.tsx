import React from "react";
import styled from "styled-components";
import {
  Setting,
  SettingTypes,
} from "@appsmith/pages/AdminSettings/config/types";
import { StyledLabel } from "./Common";
import TextInput from "./TextInput";
import Toggle from "./Toggle";
import Text from "./Text";
import Button from "./Button";
import { getFormValues } from "redux-form";
import { SETTINGS_FORM_NAME } from "constants/forms";
import { useSelector } from "store";
import { createMessage } from "@appsmith/constants/messages";
import { Callout } from "components/ads/CalloutV2";

type GroupProps = {
  name?: string;
  settings?: Setting[];
  isHidden?: boolean;
  category?: string;
  subCategory?: string;
};

const GroupWrapper = styled.div`
  position: relative;
  z-index: 1;
  &.hide {
    display: none;
  }
`;

const GroupHeader = styled(StyledLabel)`
  text-transform: capitalize;
  margin-bottom: ${(props) => props.theme.spaces[9]}px;
  font-size: 20px;
  font-weight: 500;
`;

const GroupBody = styled.div`
  & .hide {
    display: none;
  }
  & .callout-link {
    max-width: 634px;
    > div {
      margin-top: 0px;
    }
  }
`;

const formValuesSelector = getFormValues(SETTINGS_FORM_NAME);

export default function Group({
  category,
  name,
  settings,
  subCategory,
}: GroupProps) {
  const state = useSelector((state) => state);
  return (
    <GroupWrapper data-testid="admin-settings-group-wrapper">
      {name && <GroupHeader>{createMessage(() => name)}</GroupHeader>}
      <GroupBody>
        {settings &&
          settings.map((setting) => {
            if (
              (setting.isVisible &&
                !setting.isVisible(formValuesSelector(state))) ||
              (setting.category !== category &&
                setting.category !== subCategory)
            ) {
              return null;
            }
            switch (setting.controlType) {
              case SettingTypes.TEXTINPUT:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-text-input"
                    key={setting.name}
                  >
                    <TextInput setting={setting} />
                  </div>
                );
              case SettingTypes.TOGGLE:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-toggle"
                    key={setting.name}
                  >
                    <Toggle setting={setting} />
                  </div>
                );
              case SettingTypes.LINK:
                return (
                  <div
                    className={`${
                      setting.isHidden ? "hide" : "callout-link"
                    } t--read-more-link`}
                    data-testid="admin-settings-group-link"
                    key={setting.name}
                  >
                    <Callout
                      action={setting.action}
                      actionLabel="READ MORE"
                      title={createMessage(() => setting.label || "")}
                      type="Info"
                      url={setting.url}
                    />
                  </div>
                );
              case SettingTypes.TEXT:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-text"
                    key={setting.name}
                  >
                    <Text setting={setting} />
                  </div>
                );
              case SettingTypes.BUTTON:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-button"
                    key={setting.name}
                  >
                    <Button setting={setting} />
                  </div>
                );
              case SettingTypes.GROUP:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group"
                    key={setting.name}
                  >
                    <Group
                      category={category}
                      name={setting.name}
                      settings={setting.children}
                      subCategory={subCategory}
                    />
                  </div>
                );
            }
          })}
      </GroupBody>
    </GroupWrapper>
  );
}

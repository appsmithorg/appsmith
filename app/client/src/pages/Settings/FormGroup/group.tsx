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
import { SETTINGS_FORM_NAME } from "@appsmith/constants/forms";
import { useSelector } from "react-redux";
import {
  createMessage,
  LEARN_MORE,
  REDIRECT_URL_TOOLTIP,
} from "@appsmith/constants/messages";
import { CalloutV2 } from "design-system";
import { CopyUrlReduxForm } from "pages/Settings/FormGroup/CopyUrlForm";
import Accordion from "./Accordion";
import TagInputField from "./TagInputField";
import Dropdown from "./Dropdown";
import { Classes } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import Checkbox from "./Checkbox";
import Radio from "./Radio";
import { useDispatch } from "react-redux";
import { getTypographyByKey } from "constants/DefaultTheme";

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
    > div {
      margin-top: 0px;
    }
  }
  &&&& {
    // TagInput in design system has a right margin
    .tag-input > div {
      margin: 0;
    }

    .tag-input .${Classes.TAG_INPUT} {
      box-shadow: none;
    }

    .tag-input .${Classes.TAG} {
      color: ${Colors.GRAY_700};
      background-color: ${Colors.GRAY_200};
      ${(props) => getTypographyByKey(props, "h5")}
      // Cursor on close icon need to be a pointer
      svg:hover {
        cursor: pointer;
      }
    }

    .tag-input .${Classes.TAG_INPUT}.${Classes.ACTIVE} {
      border: 1.2px solid var(--appsmith-color-black-900);
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
  const calloutDispatch = useDispatch();

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
              case SettingTypes.RADIO:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-radio"
                    key={setting.name || setting.id}
                  >
                    <Radio setting={setting} />
                  </div>
                );
              case SettingTypes.TEXTINPUT:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-text-input"
                    key={setting.name || setting.id}
                  >
                    <TextInput setting={setting} />
                  </div>
                );
              case SettingTypes.TOGGLE:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-toggle"
                    key={setting.name || setting.id}
                  >
                    <Toggle setting={setting} />
                  </div>
                );
              case SettingTypes.CHECKBOX:
                return (
                  <div
                    className={`admin-settings-group-${setting.name ||
                      setting.id} ${setting.isHidden ? "hide" : ""}`}
                    data-testid="admin-settings-group-checkbox"
                    key={setting.name || setting.id}
                  >
                    <Checkbox setting={setting} />
                  </div>
                );
              case SettingTypes.LINK:
                return (
                  <div
                    className={`${
                      setting.isHidden ? "hide" : "callout-link"
                    } t--read-more-link`}
                    data-testid="admin-settings-group-link"
                    key={setting.name || setting.id}
                  >
                    {setting.action ? (
                      <CalloutV2
                        actionLabel={createMessage(LEARN_MORE)}
                        desc={createMessage(() => setting.label || "")}
                        onClick={
                          ((() => {
                            if (setting.action) {
                              setting.action(calloutDispatch);
                            }
                          }) as unknown) as React.MouseEvent<HTMLElement>
                        }
                        type={setting.calloutType || "Notify"}
                      />
                    ) : (
                      <CalloutV2
                        actionLabel={createMessage(LEARN_MORE)}
                        desc={createMessage(() => setting.label || "")}
                        type={setting.calloutType || "Notify"}
                        url={setting.url}
                      />
                    )}
                  </div>
                );
              case SettingTypes.TEXT:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-text"
                    key={setting.name || setting.id}
                  >
                    <Text setting={setting} />
                  </div>
                );
              case SettingTypes.BUTTON:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-button"
                    key={setting.name || setting.id}
                  >
                    <Button setting={setting} />
                  </div>
                );
              case SettingTypes.GROUP:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group"
                    key={setting.name || setting.id}
                  >
                    <Group
                      category={category}
                      name={setting.name}
                      settings={setting.children}
                      subCategory={subCategory}
                    />
                  </div>
                );
              case SettingTypes.UNEDITABLEFIELD:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-uneditable-field"
                    key={setting.name || setting.id}
                  >
                    <CopyUrlReduxForm
                      fieldName={setting.fieldName}
                      form={setting.formName}
                      helpText={setting.helpText}
                      title={setting.label}
                      tooltip={createMessage(REDIRECT_URL_TOOLTIP)}
                      value={setting.value}
                    />
                  </div>
                );
              case SettingTypes.TAGINPUT:
                return (
                  <div
                    className={setting.isHidden ? "hide" : "tag-input"}
                    data-testid="admin-settings-tag-input"
                    key={setting.name || setting.id}
                  >
                    <TagInputField
                      data-cy="t--tag-input"
                      intent="success"
                      label={setting.label}
                      name={setting.name || setting.id}
                      placeholder=""
                      setting={setting}
                      type="text"
                    />
                  </div>
                );
              case SettingTypes.ACCORDION:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-accordion"
                    key={setting.name || setting.id}
                  >
                    <Accordion
                      category={category}
                      label={setting.label}
                      settings={setting.advanced}
                      subCategory={subCategory}
                    />
                  </div>
                );
              case SettingTypes.DROPDOWN:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-dropdown"
                    key={setting.name || setting.id}
                  >
                    {setting.dropdownOptions && (
                      <Dropdown
                        dropdownOptions={setting.dropdownOptions}
                        setting={setting}
                      />
                    )}
                  </div>
                );
            }
          })}
      </GroupBody>
    </GroupWrapper>
  );
}

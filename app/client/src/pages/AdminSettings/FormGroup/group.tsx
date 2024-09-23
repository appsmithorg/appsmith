import React from "react";
import styled from "styled-components";
import type { Setting } from "ee/pages/AdminSettings/config/types";
import { SettingTypes } from "ee/pages/AdminSettings/config/types";
import TextInput from "./TextInput";
import Toggle from "./Toggle";
import TextComponent from "./Text";
import Button from "./Button";
import { getFormValues } from "redux-form";
import { SETTINGS_FORM_NAME } from "ee/constants/forms";
import { useDispatch, useSelector } from "react-redux";
import { createMessage, LEARN_MORE } from "ee/constants/messages";
import { Callout, Text } from "@appsmith/ads";
import CopyUrlForm from "./CopyUrlForm";
import Accordion from "./Accordion";
import TagInputField from "./TagInputField";
import Dropdown from "./Dropdown";
import { Classes } from "@blueprintjs/core";
import Checkbox from "./Checkbox";
import Radio from "./Radio";
import { getTypographyByKey } from "constants/DefaultTheme";
import classNames from "classnames";

interface GroupProps {
  name?: string;
  settings?: Setting[];
  isHidden?: boolean;
  category?: string;
  subCategory?: string;
}

const GroupWrapper = styled.div`
  position: relative;
  z-index: 1;
  &.hide {
    display: none;
  }
`;

const GroupHeader = styled(Text)`
  margin-bottom: ${(props) => props.theme.spaces[9]}px;
  font-size: 20px;
  font-weight: 500;
  margin-bottom: 8px;
`;

const GroupBody = styled.div`
  & .hide {
    display: none;
  }
  & .callout-link {
    > div {
      margin-top: 0px;
      margin-bottom: 12px;
    }
  }
  &&&& {
    // TagInput in design system has a right margin
    .tag-input > div {
      margin-right: 0;
    }

    .tag-input .${Classes.TAG_INPUT} {
      box-shadow: none;
      border-radius: var(--ads-v2-border-radius);
      border: 1px solid var(--ads-v2-color-border);
    }

    .tag-input .${Classes.TAG} {
      color: var(--ads-v2-color-fg);
      background-color: var(--ads-v2-color-bg-subtle);
      border-radius: var(--ads-v2-border-radius);
      ${(props) => getTypographyByKey(props, "h5")}
      // Cursor on close icon need to be a pointer
      svg:hover {
        cursor: pointer;
      }
    }

    .tag-input .${Classes.TAG_INPUT}.${Classes.ACTIVE} {
      border: 1px solid var(--ads-v2-color-border-emphasis-plus);
    }
  }

  .t--admin-settings-toggle {
    width: fit-content;
    min-width: 260px;
  }

  label {
    user-select: none;
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
      {name && (
        <GroupHeader
          color="var(--ads-v2-color-fg-emphasis-plus)"
          data-testid="admin-settings-form-group-label"
          renderAs="span"
        >
          {createMessage(() => name)}
        </GroupHeader>
      )}
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
                    className={`admin-settings-group-${
                      setting.name || setting.id
                    } ${setting.isHidden ? "hide" : ""}`}
                    data-testid="admin-settings-group-checkbox"
                    key={setting.name || setting.id}
                  >
                    <Checkbox setting={setting} />
                  </div>
                );
              case SettingTypes.CALLOUT:
                return (
                  <div
                    className={classNames({
                      "t--read-more-link mb-2 callout-link": true,
                      hide:
                        setting.isHidden ||
                        (setting.isVisible &&
                          !setting.isVisible(formValuesSelector(state))),
                    })}
                    data-testid="admin-settings-group-link"
                    key={setting.name || setting.id}
                  >
                    <Callout
                      kind={setting?.calloutType || "info"}
                      links={
                        setting.url || setting.action
                          ? [
                              {
                                children: createMessage(LEARN_MORE),
                                ...(setting.url && { to: setting.url }),
                                ...(setting.action && {
                                  onClick: () => {
                                    if (setting.action) {
                                      setting.action(
                                        calloutDispatch,
                                      ) as unknown as React.MouseEventHandler<HTMLElement>;
                                    }
                                  },
                                }),
                              },
                            ]
                          : []
                      }
                    >
                      {setting.label || ""}
                    </Callout>
                  </div>
                );
              case SettingTypes.TEXT:
                return (
                  <div
                    className={setting.isHidden ? "hide" : ""}
                    data-testid="admin-settings-group-text"
                    key={setting.name || setting.id}
                  >
                    <TextComponent setting={setting} />
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
                    <CopyUrlForm
                      fieldName={setting.fieldName || ""}
                      helpText={setting.helpText}
                      title={setting.label || ""}
                      tooltip={setting.tooltip}
                      value={setting.value || ""}
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
                      data-testid="t--tag-input"
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

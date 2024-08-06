import React, { useState } from "react";
import type { FieldGroupProps, SwitchType } from "../types";
import { Field } from "../Field";
import { getCodeFromMoustache, isValueValidURL } from "../utils";
import { getFieldFromValue } from "../helpers";
import { useSelector } from "react-redux";
import { getDataTreeForActionCreator } from "sagas/selectors";

function FieldGroup(props: FieldGroupProps) {
  const { isChainedAction = false, ...otherProps } = props;
  const dataTree = useSelector(getDataTreeForActionCreator);

  const NAVIGATE_TO_TAB_SWITCHER: Array<SwitchType> = [
    {
      id: "page-name",
      text: "Page name",
      action: () => {
        setActiveTabNavigateTo(NAVIGATE_TO_TAB_SWITCHER[0]);
      },
    },
    {
      id: "url",
      text: "URL",
      action: () => {
        setActiveTabNavigateTo(NAVIGATE_TO_TAB_SWITCHER[1]);
      },
    },
  ];

  const apiAndQueryCallbackTabSwitches: SwitchType[] = [
    {
      id: "onSuccess",
      text: "onSuccess",
      action: () =>
        setActiveTabApiAndQueryCallback(apiAndQueryCallbackTabSwitches[0]),
    },
    {
      id: "onFailure",
      text: "onFailure",
      action: () =>
        setActiveTabApiAndQueryCallback(apiAndQueryCallbackTabSwitches[1]),
    },
  ];

  const [activeTabNavigateTo, setActiveTabNavigateTo] = useState(
    NAVIGATE_TO_TAB_SWITCHER[isValueValidURL(props.value) ? 1 : 0],
  );
  const [activeTabApiAndQueryCallback, setActiveTabApiAndQueryCallback] =
    useState<SwitchType>(apiAndQueryCallbackTabSwitches[0]);

  const fields = getFieldFromValue(
    getCodeFromMoustache(props.value),
    activeTabApiAndQueryCallback,
    activeTabNavigateTo,
    undefined,
    dataTree,
    isChainedAction,
  );

  if (fields.length === 0) return null;

  const remainingFields = fields.slice(1);
  return (
    <>
      {Field({
        ...otherProps,
        field: fields[0],
        activeNavigateToTab: activeTabNavigateTo,
        activeTabApiAndQueryCallback: activeTabApiAndQueryCallback,
        apiAndQueryCallbackTabSwitches: apiAndQueryCallbackTabSwitches,
        navigateToSwitches: NAVIGATE_TO_TAB_SWITCHER,
      })}

      <ul className="flex flex-col mt-2 gap-2">
        {/* TODO: Fix this the next time the file is edited */}
        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
        {remainingFields.map((field: any, index: number) => {
          if (Array.isArray(field)) {
            const selectorField = field[0];
            return (
              <li key={index}>
                <FieldGroup
                  additionalAutoComplete={props.additionalAutoComplete}
                  dataTreePath={props.dataTreePath}
                  integrationOptions={props.integrationOptions}
                  key={selectorField.label + index}
                  label={selectorField.label}
                  modalDropdownList={props.modalDropdownList}
                  onValueChange={(
                    // TODO: Fix this the next time the file is edited
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    value: any,
                    isUpdatedViaKeyboard: boolean,
                  ) => {
                    const parentValue =
                      selectorField.getParentValue &&
                      selectorField.getParentValue(value);
                    props.onValueChange(
                      parentValue || value,
                      isUpdatedViaKeyboard,
                    );
                  }}
                  pageDropdownOptions={props.pageDropdownOptions}
                  value={selectorField.value}
                  widgetOptionTree={props.widgetOptionTree}
                />
              </li>
            );
          } else {
            return (
              <li key={field.field + index}>
                {Field({
                  field: field,
                  ...otherProps,
                  activeNavigateToTab: activeTabNavigateTo,
                  activeTabApiAndQueryCallback: activeTabApiAndQueryCallback,
                  apiAndQueryCallbackTabSwitches:
                    apiAndQueryCallbackTabSwitches,
                  navigateToSwitches: NAVIGATE_TO_TAB_SWITCHER,
                })}
              </li>
            );
          }
        })}
      </ul>
    </>
  );
}

export default FieldGroup;

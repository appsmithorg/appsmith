import React from "react";
import { TreeDropdownOption } from "design-system";
import {
  StyledDividerContainer,
  StyledNavigateToFieldsContainer,
  StyledNavigateToFieldWrapper,
} from "components/propertyControls/StyledControls";
import HightlightedCode from "components/editorComponents/HighlightedCode";
import { Skin } from "constants/DefaultTheme";
import { DropdownOption } from "components/constants";
import DividerComponent from "widgets/DividerWidget/component";
import store from "store";
import { getPageList } from "selectors/entitiesSelector";
import {
  RESET_CHILDREN_OPTIONS,
  FILE_TYPE_OPTIONS,
  NAVIGATION_TARGET_FIELD_OPTIONS,
  ViewTypes,
  AppsmithFunction,
  FieldType,
} from "./constants";
import { ACTION_TRIGGER_REGEX } from "./regex";
import {
  SwitchType,
  ActionType,
  SelectorViewProps,
  KeyValueViewProps,
  TextViewProps,
  TabViewProps,
  FieldConfigs,
} from "./types";
import {
  modalSetter,
  modalGetter,
  textSetter,
  textGetter,
  enumTypeSetter,
  enumTypeGetter,
} from "./utils";
import { ALERT_STYLE_OPTIONS } from "../../../ce/constants/messages";
import { SelectorView } from "./viewComponents/SelectorView/SelectorView";
import { KeyValueView } from "./viewComponents/KeyValueView";
import { TextView } from "./viewComponents/TextView/TextView";
import { TabView } from "./viewComponents/TabView/TabView";

/**
 ******** Steps to add a new function *******
 * In this file:
 * 1. Create a new entry in ActionType object. This is the name of the function
 *
 * 2. Define new fields in FieldType object. This is the field names
 * for each argument the function accepts.
 *
 * 3. Update fieldConfigs with your field's getter, setting and view. getter is
 * the setting used to extract the field value from the function. setter is used to
 * set the value in function when the field is updated. View is the component used
 * to edit the field value
 *
 * 4. Update renderField function to change things like field label etc.
 *
 * On the index file:
 * 1. Add the new action entry and its text in the baseOptions array
 * 2. Attach fields to the new action in the getFieldFromValue function
 **/

const views = {
  [ViewTypes.SELECTOR_VIEW]: (props: SelectorViewProps) => (
    <SelectorView {...props} />
  ),
  [ViewTypes.KEY_VALUE_VIEW]: (props: KeyValueViewProps) => (
    <KeyValueView {...props} />
  ),
  [ViewTypes.TEXT_VIEW]: (props: TextViewProps) => <TextView {...props} />,
  [ViewTypes.TAB_VIEW]: (props: TabViewProps) => <TabView {...props} />,
};

const fieldConfigs: FieldConfigs = {
  [FieldType.ACTION_SELECTOR_FIELD]: {
    getter: (storedValue: string) => {
      let matches: any[] = [];
      if (storedValue) {
        matches = storedValue
          ? [...storedValue.matchAll(ACTION_TRIGGER_REGEX)]
          : [];
      }
      let mainFuncSelectedValue = AppsmithFunction.none;
      if (matches.length) {
        mainFuncSelectedValue = matches[0][1] || AppsmithFunction.none;
      }
      const mainFuncSelectedValueSplit = mainFuncSelectedValue.split(".");
      if (mainFuncSelectedValueSplit[1] === "run") {
        return mainFuncSelectedValueSplit[0];
      }
      return mainFuncSelectedValue;
    },
    setter: (option: TreeDropdownOption) => {
      const type: ActionType = option.type || option.value;
      let value = option.value;
      let defaultParams = "";
      let defaultArgs: Array<any> = [];
      switch (type) {
        case AppsmithFunction.integration:
          value = `${value}.run`;
          break;
        case AppsmithFunction.navigateTo:
          defaultParams = `'', {}, 'SAME_WINDOW'`;
          break;
        case AppsmithFunction.jsFunction:
          defaultArgs = option.args ? option.args : [];
          break;
        case AppsmithFunction.setInterval:
          defaultParams = "() => { \n\t // add code here \n}, 5000";
          break;
        case AppsmithFunction.getGeolocation:
          defaultParams = "(location) => { \n\t // add code here \n  }";
          break;
        case AppsmithFunction.resetWidget:
          defaultParams = `"",true`;
          break;
        default:
          break;
      }
      return value === "none"
        ? ""
        : defaultArgs && defaultArgs.length
        ? `{{${value}(${defaultArgs})}}`
        : `{{${value}(${defaultParams})}}`;
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.SHOW_MODAL_FIELD]: {
    getter: (value: any) => {
      return modalGetter(value);
    },
    setter: (option: any, currentValue: string) => {
      return modalSetter(option.value, currentValue);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.CLOSE_MODAL_FIELD]: {
    getter: (value: any) => {
      return modalGetter(value);
    },
    setter: (option: any, currentValue: string) => {
      return modalSetter(option.value, currentValue);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.PAGE_SELECTOR_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 0, "");
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.KEY_VALUE_FIELD]: {
    getter: (value: any) => {
      return value;
    },
    setter: (value: any) => {
      return value;
    },
    view: ViewTypes.KEY_VALUE_VIEW,
  },
  [FieldType.ARGUMENT_KEY_VALUE_FIELD]: {
    getter: (value: any, index: number) => {
      return textGetter(value, index);
    },
    setter: (value: any, currentValue: string, index: number) => {
      if (value === "") {
        value = undefined;
      }
      return textSetter(value, currentValue, index);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.URL_FIELD]: {
    getter: (value: string) => {
      const appState = store.getState();
      const pageList = getPageList(appState).map((page) => page.pageName);
      const urlFieldValue = textGetter(value, 0);
      return pageList.includes(urlFieldValue) ? "" : urlFieldValue;
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.NAVIGATION_TARGET_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 2, NAVIGATION_TARGET_FIELD_OPTIONS[0].value);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 2);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.ALERT_TEXT_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.ALERT_TYPE_SELECTOR_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 1, "success");
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 1);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.KEY_TEXT_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.VALUE_TEXT_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.QUERY_PARAMS_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 1);
    },
    setter: (value: any, currentValue: string) => {
      if (value === "") {
        value = undefined;
      }
      return textSetter(value, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DOWNLOAD_DATA_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DOWNLOAD_FILE_NAME_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DOWNLOAD_FILE_TYPE_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 2);
    },
    setter: (option: any, currentValue: string) =>
      enumTypeSetter(option.value, currentValue, 2),
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.COPY_TEXT_FIELD]: {
    getter: (value: any) => {
      return textGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return textSetter(option, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.WIDGET_NAME_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.RESET_CHILDREN_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 1);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 1);
    },
    view: ViewTypes.SELECTOR_VIEW,
  },
  [FieldType.CALLBACK_FUNCTION_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.DELAY_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 1);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.ID_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 2);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 2);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.CLEAR_INTERVAL_ID_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.MESSAGE_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 0);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 0);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.TARGET_ORIGIN_FIELD]: {
    getter: (value: string) => {
      return textGetter(value, 1);
    },
    setter: (value: string, currentValue: string) => {
      return textSetter(value, currentValue, 1);
    },
    view: ViewTypes.TEXT_VIEW,
  },
  [FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD]: {
    getter: (value: any) => {
      return enumTypeGetter(value, 0);
    },
    setter: (option: any, currentValue: string) => {
      return enumTypeSetter(option.value, currentValue, 0);
    },
    view: ViewTypes.TAB_VIEW,
  },
};

function renderField(props: {
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  value: string;
  field: { field: FieldType; value: string; label: string; index: number };
  label?: string;
  widgetOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  integrationOptionTree: TreeDropdownOption[];
  depth: number;
  maxDepth: number;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
  activeNavigateToTab: SwitchType;
  navigateToSwitches: Array<SwitchType>;
}) {
  const { field } = props;
  const fieldType = field.field;
  const fieldConfig = fieldConfigs[fieldType];
  if (!fieldConfig) return;
  const view = views[fieldConfig.view];
  let viewElement: JSX.Element | null = null;

  switch (fieldType) {
    case FieldType.ACTION_SELECTOR_FIELD:
    case FieldType.ON_SUCCESS_FIELD:
    case FieldType.ON_ERROR_FIELD:
    case FieldType.SHOW_MODAL_FIELD:
    case FieldType.CLOSE_MODAL_FIELD:
    case FieldType.PAGE_SELECTOR_FIELD:
    case FieldType.ALERT_TYPE_SELECTOR_FIELD:
    case FieldType.DOWNLOAD_FILE_TYPE_FIELD:
    case FieldType.NAVIGATION_TARGET_FIELD:
    case FieldType.RESET_CHILDREN_FIELD:
    case FieldType.WIDGET_NAME_FIELD:
      let label = "";
      let defaultText = "Select Action";
      let options = props.integrationOptionTree;
      let selectedLabelModifier = undefined;
      let displayValue = undefined;
      let getDefaults = undefined;
      if (fieldType === FieldType.ACTION_SELECTOR_FIELD) {
        label = props.label || "";
        displayValue =
          field.value !== "{{undefined}}" &&
          field.value !== "{{()}}" &&
          field.value !== "{{{}, ()}}"
            ? field.value
            : undefined;
        // eslint-disable-next-line react/display-name
        selectedLabelModifier = function(
          option: TreeDropdownOption,
          displayValue?: string,
        ) {
          if (option.type === AppsmithFunction.integration) {
            return (
              <HightlightedCode
                codeText={`{{${option.label}.run()}}`}
                skin={Skin.LIGHT}
              />
            );
          } else if (displayValue) {
            return (
              <HightlightedCode codeText={displayValue} skin={Skin.LIGHT} />
            );
          }
          return <span>{option.label}</span>;
        };
        getDefaults = (value: string) => {
          return {
            [AppsmithFunction.navigateTo]: `'${props.pageDropdownOptions[0].label}'`,
          }[value];
        };
      }
      if (
        fieldType === FieldType.SHOW_MODAL_FIELD ||
        fieldType === FieldType.CLOSE_MODAL_FIELD
      ) {
        label = "Modal Name";
        options = props.modalDropdownList;
        defaultText = "Select Modal";
      }
      if (fieldType === FieldType.RESET_CHILDREN_FIELD) {
        label = "Reset Children";
        options = RESET_CHILDREN_OPTIONS;
        defaultText = "true";
      }
      if (fieldType === FieldType.WIDGET_NAME_FIELD) {
        label = "Widget";
        options = props.widgetOptionTree;
        defaultText = "Select Widget";
      }
      if (fieldType === FieldType.PAGE_SELECTOR_FIELD) {
        label = "Choose Page";
        options = props.pageDropdownOptions;
        defaultText = "Select Page";
      }
      if (fieldType === FieldType.ALERT_TYPE_SELECTOR_FIELD) {
        label = "Type";
        options = ALERT_STYLE_OPTIONS;
        defaultText = "Select type";
      }
      if (fieldType === FieldType.DOWNLOAD_FILE_TYPE_FIELD) {
        label = "Type";
        options = FILE_TYPE_OPTIONS;
        defaultText = "Select file type (optional)";
      }
      if (fieldType === FieldType.NAVIGATION_TARGET_FIELD) {
        label = "Target";
        options = NAVIGATION_TARGET_FIELD_OPTIONS;
        defaultText = NAVIGATION_TARGET_FIELD_OPTIONS[0].label;
      }
      viewElement = (view as (props: SelectorViewProps) => JSX.Element)({
        options: options,
        label: label,
        get: fieldConfig.getter,
        set: (
          value: string | DropdownOption,
          defaultValue?: string,
          isUpdatedViaKeyboard = false,
        ) => {
          const finalValueToSet = fieldConfig.setter(
            value,
            props.value,
            defaultValue,
          );
          props.onValueChange(finalValueToSet, isUpdatedViaKeyboard);
        },
        value: props.value,
        defaultText: defaultText,
        getDefaults: getDefaults,
        selectedLabelModifier: selectedLabelModifier,
        displayValue: displayValue ? displayValue : "",
      });
      break;
    case FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD:
      viewElement = (view as (props: TabViewProps) => JSX.Element)({
        activeObj: props.activeNavigateToTab,
        switches: props.navigateToSwitches,
        label: "Type",
        value: props.value,
      });
      break;
    case FieldType.ARGUMENT_KEY_VALUE_FIELD:
      viewElement = (view as (props: TextViewProps) => JSX.Element)({
        label: props.field.label || "",
        get: fieldConfig.getter,
        set: (value: string) => {
          const finalValueToSet = fieldConfig.setter(
            value,
            props.value,
            props.field.index,
          );
          props.onValueChange(finalValueToSet, false);
        },
        index: props.field.index,
        value: props.value || "",
      });
      break;
    case FieldType.KEY_VALUE_FIELD:
      viewElement = (view as (props: SelectorViewProps) => JSX.Element)({
        options: props.integrationOptionTree,
        label: "",
        get: fieldConfig.getter,
        set: (value: string | DropdownOption) => {
          const finalValueToSet = fieldConfig.setter(value, props.value);
          props.onValueChange(finalValueToSet, false);
        },
        value: props.value,
        defaultText: "Select Action",
      });
      break;
    case FieldType.ALERT_TEXT_FIELD:
    case FieldType.URL_FIELD:
    case FieldType.KEY_TEXT_FIELD:
    case FieldType.VALUE_TEXT_FIELD:
    case FieldType.QUERY_PARAMS_FIELD:
    case FieldType.DOWNLOAD_DATA_FIELD:
    case FieldType.DOWNLOAD_FILE_NAME_FIELD:
    case FieldType.COPY_TEXT_FIELD:
    case FieldType.CALLBACK_FUNCTION_FIELD:
    case FieldType.DELAY_FIELD:
    case FieldType.ID_FIELD:
    case FieldType.CLEAR_INTERVAL_ID_FIELD:
      let fieldLabel = "";
      if (fieldType === FieldType.ALERT_TEXT_FIELD) {
        fieldLabel = "Message";
      } else if (fieldType === FieldType.URL_FIELD) {
        fieldLabel = "Enter URL";
      } else if (fieldType === FieldType.KEY_TEXT_FIELD) {
        fieldLabel = "Key";
      } else if (fieldType === FieldType.VALUE_TEXT_FIELD) {
        fieldLabel = "Value";
      } else if (fieldType === FieldType.QUERY_PARAMS_FIELD) {
        fieldLabel = "Query Params";
      } else if (fieldType === FieldType.DOWNLOAD_DATA_FIELD) {
        fieldLabel = "Data to download";
      } else if (fieldType === FieldType.DOWNLOAD_FILE_NAME_FIELD) {
        fieldLabel = "File name with extension";
      } else if (fieldType === FieldType.COPY_TEXT_FIELD) {
        fieldLabel = "Text to be copied to clipboard";
      } else if (fieldType === FieldType.CALLBACK_FUNCTION_FIELD) {
        fieldLabel = "Callback function";
      } else if (fieldType === FieldType.DELAY_FIELD) {
        fieldLabel = "Delay (ms)";
      } else if (fieldType === FieldType.ID_FIELD) {
        fieldLabel = "Id";
      } else if (fieldType === FieldType.CLEAR_INTERVAL_ID_FIELD) {
        fieldLabel = "Id";
      }
      viewElement = (view as (props: TextViewProps) => JSX.Element)({
        label: fieldLabel,
        get: fieldConfig.getter,
        set: (value: string | DropdownOption, isUpdatedViaKeyboard = false) => {
          const finalValueToSet = fieldConfig.setter(value, props.value);
          props.onValueChange(finalValueToSet, isUpdatedViaKeyboard);
        },
        value: props.value,
        additionalAutoComplete: props.additionalAutoComplete,
      });
      break;
    default:
      break;
  }

  return (
    <div data-guided-tour-iid={field.label} key={fieldType}>
      {viewElement}
    </div>
  );
}

function Fields(props: {
  onValueChange: (newValue: string, isUpdatedViaKeyboard: boolean) => void;
  value: string;
  fields: any;
  label?: string;
  integrationOptionTree: TreeDropdownOption[];
  widgetOptionTree: TreeDropdownOption[];
  modalDropdownList: TreeDropdownOption[];
  pageDropdownOptions: TreeDropdownOption[];
  depth: number;
  maxDepth: number;
  additionalAutoComplete?: Record<string, Record<string, unknown>>;
  navigateToSwitches: Array<SwitchType>;
  activeNavigateToTab: SwitchType;
}) {
  const { fields, ...otherProps } = props;

  if (fields[0].field === FieldType.ACTION_SELECTOR_FIELD) {
    const remainingFields = fields.slice(1);
    if (
      remainingFields[0]?.field ===
      FieldType.PAGE_NAME_AND_URL_TAB_SELECTOR_FIELD
    ) {
      /* Navigate to does not follow the tree like structure
       * other global functions have
       * This if condition achieves that design */
      return (
        <>
          {renderField({
            field: fields[0],
            ...otherProps,
          })}

          <StyledNavigateToFieldWrapper>
            <StyledDividerContainer>
              <DividerComponent
                capType="dot"
                dividerColor="#b3b3b3"
                orientation="vertical"
                thickness={2}
              />
            </StyledDividerContainer>
            <StyledNavigateToFieldsContainer>
              {remainingFields.map((paramField: any) => {
                return renderField({ field: paramField, ...otherProps });
              })}
            </StyledNavigateToFieldsContainer>
          </StyledNavigateToFieldWrapper>
        </>
      );
    }
    return (
      <>
        {renderField({
          field: fields[0],
          ...otherProps,
        })}

        <ul className={props.depth === 1 ? "tree" : ""}>
          {remainingFields.map((field: any, index: number) => {
            if (Array.isArray(field)) {
              if (props.depth > props.maxDepth) {
                return null;
              }
              const selectorField = field[0];
              return (
                <li key={index}>
                  <Fields
                    activeNavigateToTab={props.activeNavigateToTab}
                    additionalAutoComplete={props.additionalAutoComplete}
                    depth={props.depth + 1}
                    fields={field}
                    integrationOptionTree={props.integrationOptionTree}
                    key={selectorField.label + index}
                    label={selectorField.label}
                    maxDepth={props.maxDepth}
                    modalDropdownList={props.modalDropdownList}
                    navigateToSwitches={props.navigateToSwitches}
                    onValueChange={(
                      value: any,
                      isUpdatedViaKeyboard: boolean,
                    ) => {
                      const parentValue =
                        selectorField.getParentValue &&
                        selectorField.getParentValue(
                          value.substring(2, value.length - 2),
                        );
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
                  {renderField({
                    field: field,
                    ...otherProps,
                  })}
                </li>
              );
            }
          })}
        </ul>
      </>
    );
  } else {
    const ui = fields.map((field: any, index: number) => {
      if (Array.isArray(field)) {
        if (props.depth > props.maxDepth) {
          return null;
        }
        const selectorField = field[0];
        return (
          <Fields
            activeNavigateToTab={props.activeNavigateToTab}
            depth={props.depth + 1}
            fields={field}
            integrationOptionTree={props.integrationOptionTree}
            key={index}
            label={selectorField.label}
            maxDepth={props.maxDepth}
            modalDropdownList={props.modalDropdownList}
            navigateToSwitches={props.navigateToSwitches}
            onValueChange={(value: any, isUpdatedViaKeyboard: boolean) => {
              const parentValue = selectorField.getParentValue(
                value.substring(2, value.length - 2),
              );
              props.onValueChange(parentValue, isUpdatedViaKeyboard);
            }}
            pageDropdownOptions={props.pageDropdownOptions}
            value={selectorField.value}
            widgetOptionTree={props.widgetOptionTree}
          />
        );
      } else {
        return renderField({
          field: field,
          ...otherProps,
        });
      }
    });
    return ui;
  }
}

export default Fields;

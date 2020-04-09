import React, { ChangeEvent } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { DropdownOption } from "widgets/DropdownWidget";
import {
  ReduxActionWithoutPayload,
  ReduxAction,
} from "constants/ReduxActionConstants";
import _ from "lodash";
import { ControlWrapper } from "components/propertyControls/StyledControls";
import { InputText } from "components/propertyControls/InputTextControl";
import StyledDropdown from "components/editorComponents/DynamicActionSelectorDropdown";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";
import {
  getModalDropdownList,
  getNextModalName,
} from "selectors/widgetSelectors";
import { getActionsForCurrentPage } from "selectors/entitiesSelector";
import { KeyValueComponent } from "components/propertyControls/KeyValueComponent";
import { createModalAction } from "actions/widgetActions";

const ACTION_TRIGGER_REGEX = /^{{([\s\S]*?)\(([\s\S]*?)\)}}$/g;
const ACTION_ANONYMOUS_FUNC_REGEX = /\(\) => ([\s\S]*?)(\([\s\S]*?\))/g;

const ALERT_STYLE_OPTIONS = [
  { label: "Info", value: "'info'", id: "info" },
  { label: "Success", value: "'success'", id: "success" },
  { label: "Error", value: "'error'", id: "error" },
  { label: "Warning", value: "'warning'", id: "warning" },
];

type ValueType = string | DropdownOption[];

type ValueChangeHandler = (
  changeValue: ValueType,
  currentValue: string,
) => string;
type ActionCreatorArgumentConfig = {
  label: string;
  field: string;
  create?: {
    text: string;
    action: (...args: any) => ReduxAction<any>;
  };
  valueChangeHandler: ValueChangeHandler;
  getSelectedValue: (value: string, returnArguments: boolean) => ValueType;
};

interface ActionCreatorDropdownOption extends DropdownOption {
  arguments: ActionCreatorArgumentConfig[];
}

const handleTopLevelFuncUpdate: ValueChangeHandler = (
  value: ValueType,
): string => {
  return value === "none" ? "" : `{{${value}()}}`;
};

const handleApiArgSelect = (
  changeValue: string,
  currentValue: string,
  label: "onSuccess" | "onError",
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = [...matches[0][2].matchAll(ACTION_ANONYMOUS_FUNC_REGEX)];
  let successArg = args[0] ? args[0][0] : "() => {}";
  let errorArg = args[1] ? args[1][0] : "() => {}";
  if (label === "onSuccess") {
    successArg = changeValue.endsWith(")")
      ? `() => ${changeValue}`
      : `() => ${changeValue}()`;
  }
  if (label === "onError") {
    errorArg = changeValue.endsWith(")")
      ? `() => ${changeValue}`
      : `() => ${changeValue}()`;
  }
  return currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${successArg}, ${errorArg})}}`,
  );
};

const handlePageNameArgSelect = (
  changeValue: ValueType,
  currentValue: string,
) => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",");
  args[0] = `${changeValue}`;

  return currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
};
/* eslint-disable @typescript-eslint/no-unused-vars */
const handlePageParamsArgSelect = (
  changeValue: ValueType,
  currentValue: string,
) => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",").slice(0, 2);
  const paramsObject: Record<string, string> = {};
  (changeValue as DropdownOption[]).forEach(pageParam => {
    paramsObject[pageParam.label] = pageParam.value;
  });
  args[1] = JSON.stringify(paramsObject);
  return currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
};
/* eslint-enable @typescript-eslint/no-unused-vars */

const handleTextArgChange = (
  changeValue: ValueType,
  currentValue: string,
): string => {
  return currentValue.replace(ACTION_TRIGGER_REGEX, `{{$1('${changeValue}')}}`);
};

const handleAlertTextChange = (
  changeValue: ValueType,
  currentValue: string,
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",");
  args[0] = `'${changeValue}'`;
  const result = currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
  return result;
};

const handleAlertTypeChange = (
  changeValue: ValueType,
  currentValue: string,
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",");
  args[1] = changeValue as string;
  return currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
};

const getApiArgumentValue = (
  value: string,
  label: "onSuccess" | "onError",
  returnSubArguments = false,
): string => {
  let selectedValue = "none";
  let selectedValueArgs = "";
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const funcArgs = matches[0][2];
    const argIndex = label === "onSuccess" ? 0 : 1;
    const args = [...funcArgs.matchAll(ACTION_ANONYMOUS_FUNC_REGEX)];
    const selectedArg = args[argIndex];
    if (selectedArg && selectedArg.length) {
      selectedValue = selectedArg[1];
      selectedValueArgs = selectedArg[2];
    }
  }
  if (returnSubArguments) return selectedValueArgs;
  return selectedValue;
};

const getPageNameSelectedValue = (value: string) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  return matches.length ? matches[0][2].split(",")[0] : "none";
};
/* eslint-disable @typescript-eslint/no-unused-vars */

const getPageParamsSelectedValue = (value: ValueType) => {
  const match = getPageSelectedParamsObject(value as string);
  const keyPairs: DropdownOption[] = [];
  Object.keys(match).forEach((key: string) => {
    keyPairs.push({
      label: key,
      value: match[key],
    });
  });
  return keyPairs;
};
/* eslint-enable @typescript-eslint/no-unused-vars */

const getPageSelectedParamsObject = (value: string) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  let match: Record<string, string> = {};

  if (matches.length) {
    try {
      match = JSON.parse(
        matches[0][2].substring(
          matches[0][2].indexOf(",") + 1,
          matches[0][2].length,
        ),
      );
    } catch {}
  }
  return match;
};

export const getTextArgValue = (value: string) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const stringValue = matches[0][2];
    return stringValue.substring(1, stringValue.length - 1);
  }
  return "";
};

const getAlertTextValue = (value: string) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const funcArgs = matches[0][2];
    const arg = funcArgs.split(",")[0];
    return arg.substring(1, arg.length - 1);
  }
  return "";
};

const getAlertTypeValue = (value: string) => {
  const matches = [...value.matchAll(ACTION_TRIGGER_REGEX)];
  if (matches.length) {
    const funcArgs = matches[0][2];
    const arg = funcArgs.split(",")[1];
    return arg ? arg.trim() : "'primary'";
  }
  return "";
};

export const PropertyPaneActionDropdownOptions: ActionCreatorDropdownOption[] = [
  {
    label: "No action",
    value: "none",
    id: "none",
    arguments: [],
  },
  {
    label: "Call API",
    value: "api",
    id: "api",
    arguments: [
      {
        label: "onSuccess",
        field: "ACTION_SELECTOR_FIELD",
        valueChangeHandler: (changeValue, currentValue) =>
          handleApiArgSelect(changeValue as string, currentValue, "onSuccess"),
        getSelectedValue: (value: string, returnArgs = false) =>
          getApiArgumentValue(value, "onSuccess", returnArgs),
      },
      {
        label: "onError",
        field: "ACTION_SELECTOR_FIELD",
        valueChangeHandler: (changeValue, currentValue) =>
          handleApiArgSelect(changeValue as string, currentValue, "onError"),
        getSelectedValue: (value: string, returnArgs = false) =>
          getApiArgumentValue(value, "onError", returnArgs),
      },
    ],
  },
  {
    label: "Show Modal",
    value: "showModal",
    id: "showModal",
    arguments: [
      {
        label: "Modal Name",
        field: "MODAL_SELECTOR_FIELD",
        create: {
          text: "Modal",
          action: createModalAction,
        },
        valueChangeHandler: handlePageNameArgSelect,
        getSelectedValue: getPageNameSelectedValue,
      },
    ],
  },
  {
    label: "Close Modal",
    value: "closeModal",
    id: "closeModal",
    arguments: [
      {
        label: "Modal Name",
        field: "MODAL_SELECTOR_FIELD",
        valueChangeHandler: handlePageNameArgSelect,
        getSelectedValue: getPageNameSelectedValue,
      },
    ],
  },
  {
    label: "Navigate to Page",
    value: "navigateTo",
    id: "navigateTo",
    arguments: [
      {
        label: "pageName",
        field: "PAGE_SELECTOR_FIELD",
        valueChangeHandler: handlePageNameArgSelect,
        getSelectedValue: getPageNameSelectedValue,
      },
      // {
      //   label: "params",
      //   field: "KEY_VALUE_FIELD",
      //   valueChangeHandler: handlePageParamsArgSelect,
      //   getSelectedValue: getPageParamsSelectedValue,
      // },
    ],
  },
  {
    label: "Navigate to URL",
    value: "navigateToUrl",
    id: "navigateToUrl",
    arguments: [
      {
        label: "URL",
        field: "TEXT_FIELD",
        valueChangeHandler: handleTextArgChange,
        getSelectedValue: getTextArgValue,
      },
    ],
  },
  {
    label: "Show Alert",
    value: "showAlert",
    id: "showAlert",
    arguments: [
      {
        label: "text",
        field: "TEXT_FIELD",
        valueChangeHandler: handleAlertTextChange,
        getSelectedValue: getAlertTextValue,
      },
      {
        label: "type",
        field: "ALERT_TYPE_SELECTOR_FIELD",
        valueChangeHandler: handleAlertTypeChange,
        getSelectedValue: getAlertTypeValue,
      },
    ],
  },
];

type ReduxStateProps = {
  actions: ActionDataState;
  pageNameDropdown: DropdownOption[];
  modalDropdown?: DropdownOption[];
  nextModalName: string;
  dispatchAction: (payload: ReduxActionWithoutPayload) => void;
};

interface Props {
  value: string;
  isValid: boolean;
  validationMessage?: string;
  onValueChange: (newValue: string) => void;
}

class DynamicActionCreator extends React.Component<Props & ReduxStateProps> {
  getTopLevelFuncValue = (value: string) => {
    let matches: any[] = [];
    if (value) {
      matches = value ? [...value.matchAll(ACTION_TRIGGER_REGEX)] : [];
    }
    let mainFuncSelectedValue = "none";
    if (matches.length) {
      mainFuncSelectedValue = matches[0][1] || "none";
    }
    return mainFuncSelectedValue;
  };

  handleValueUpdate = (
    updateValueOrEvent: ValueType | ChangeEvent<HTMLTextAreaElement>,
    valueUpdateHandler: ValueChangeHandler,
  ) => {
    const { value, onValueChange } = this.props;
    let updateValue = updateValueOrEvent;
    if (
      typeof updateValueOrEvent !== "string" &&
      (updateValueOrEvent as any).target
    ) {
      updateValue = (updateValueOrEvent as any).target.value;
    }
    const newValue = valueUpdateHandler(updateValue as ValueType, value);
    onValueChange(newValue);
  };

  renderSubArgumentFields = (
    argValue: string,
    allOptions: ActionCreatorDropdownOption[],
    parentChangeHandler: (
      updateValueOrEvent: ValueType | ChangeEvent<HTMLTextAreaElement>,
      valueUpdateHandler: ValueChangeHandler,
    ) => void,
    argumentConfig: ActionCreatorArgumentConfig,
  ) => {
    const subArgValue = argumentConfig.getSelectedValue(argValue, false);
    const subArguments = argumentConfig.getSelectedValue(argValue, true);
    let selectedOption = allOptions[0];
    allOptions
      .filter(o => o.value !== "api")
      .forEach(o => {
        if (o.value === subArgValue) {
          selectedOption = o;
        }
      });
    const handleValueUpdate = (
      updateValueOrEvent: ValueType | ChangeEvent<HTMLTextAreaElement>,
      valueUpdateHandler: ValueChangeHandler,
    ) => {
      let updateValue = updateValueOrEvent;
      if (
        typeof updateValueOrEvent !== "string" &&
        (updateValueOrEvent as any).target
      ) {
        updateValue = (updateValueOrEvent as any).target.value;
      }
      const tempArg = `{{${subArgValue}${subArguments}}}`;
      const newValue = valueUpdateHandler(updateValue as ValueType, tempArg);
      const newArgValue = newValue.substring(2, newValue.length - 2);
      parentChangeHandler(newArgValue, argumentConfig.valueChangeHandler);
    };
    const subFunctionCall = `{{${subArgValue}${subArguments}}}`;
    return this.renderActionArgumentFields(
      subFunctionCall,
      selectedOption,
      allOptions,
      handleValueUpdate,
    );
  };

  renderActionArgumentFields = (
    value: string,
    selectedOption: ActionCreatorDropdownOption,
    allOptions: ActionCreatorDropdownOption[],
    handleUpdate: (
      updateValueOrEvent: ValueType | ChangeEvent<HTMLTextAreaElement>,
      valueUpdateHandler: ValueChangeHandler,
    ) => void,
  ) => {
    return (
      <div>
        {selectedOption.arguments.map(arg => {
          switch (arg.field) {
            case "ACTION_SELECTOR_FIELD":
              return (
                <ControlWrapper key={arg.label}>
                  <label>{arg.label}</label>
                  <StyledDropdown
                    options={allOptions}
                    selectedValue={arg.getSelectedValue(value, false) as string}
                    defaultText={"Select Action"}
                    onSelect={value =>
                      handleUpdate(value, arg.valueChangeHandler)
                    }
                  />
                  {this.renderSubArgumentFields(
                    value,
                    allOptions,
                    handleUpdate,
                    arg,
                  )}
                </ControlWrapper>
              );
            case "PAGE_SELECTOR_FIELD":
              return (
                <ControlWrapper key={arg.label}>
                  <label>{arg.label}</label>
                  <StyledDropdown
                    options={this.props.pageNameDropdown}
                    selectedValue={arg.getSelectedValue(value, false) as string}
                    defaultText={"Select Page"}
                    onSelect={newValue => {
                      handleUpdate(newValue, arg.valueChangeHandler);
                    }}
                  />
                </ControlWrapper>
              );
            case "KEY_VALUE_FIELD":
              return (
                <ControlWrapper key={arg.label}>
                  <KeyValueComponent
                    pairs={
                      arg.getSelectedValue(value, false) as DropdownOption[]
                    }
                    addLabel={"QueryParam"}
                    updatePairs={(pageParams: DropdownOption[]) => {
                      handleUpdate(pageParams as any, arg.valueChangeHandler);
                    }}
                  />
                </ControlWrapper>
              );
            case "MODAL_SELECTOR_FIELD":
              return (
                <ControlWrapper key={arg.label}>
                  <label>{arg.label}</label>
                  <StyledDropdown
                    options={this.props.modalDropdown || []}
                    selectedValue={arg.getSelectedValue(value, false) as string}
                    defaultText="Select Modal"
                    createButton={
                      arg.create && {
                        text: arg.create.text,
                        args: [this.props.nextModalName],
                        onClick: (...args: any) => {
                          arg.create &&
                            this.props.dispatchAction(
                              arg.create.action(...args),
                            );
                        },
                      }
                    }
                    onSelect={value => {
                      handleUpdate(value, arg.valueChangeHandler);
                    }}
                  />
                </ControlWrapper>
              );
            case "TEXT_FIELD":
              return (
                <ControlWrapper key={arg.label}>
                  <label>{arg.label}</label>
                  <InputText
                    label={arg.label}
                    value={arg.getSelectedValue(value, false) as string}
                    onChange={e => handleUpdate(e, arg.valueChangeHandler)}
                    isValid={this.props.isValid}
                    validationMessage={this.props.validationMessage}
                  />
                </ControlWrapper>
              );
            case "ALERT_TYPE_SELECTOR_FIELD":
              return (
                <ControlWrapper key={arg.label}>
                  <label>{arg.label}</label>
                  <StyledDropdown
                    options={ALERT_STYLE_OPTIONS}
                    defaultText={"Select type"}
                    selectedValue={arg.getSelectedValue(value, false) as string}
                    onSelect={value =>
                      handleUpdate(value, arg.valueChangeHandler)
                    }
                  />
                </ControlWrapper>
              );
            default:
              return null;
          }
        })}
      </div>
    );
  };

  render() {
    const { actions, value } = this.props;
    const stringValue = typeof value === "string" ? value : "";
    const topLevelFuncValue = this.getTopLevelFuncValue(stringValue);
    const actionOptions = PropertyPaneActionDropdownOptions.map(o => {
      if (o.id === "api") {
        return {
          ...o,
          children: actions.map(a => ({
            ...o,
            label: a.config.name,
            id: a.config.id,
            value: `${a.config.name}.run`,
          })),
        };
      } else {
        return o;
      }
    });

    let selectedOption = actionOptions[0];
    actionOptions.forEach(o => {
      if (
        o.value === topLevelFuncValue ||
        _.some(o.children, {
          value: topLevelFuncValue,
        })
      ) {
        selectedOption = o;
      }
    });

    return (
      <React.Fragment>
        <StyledDropdown
          options={actionOptions}
          selectedValue={topLevelFuncValue}
          defaultText={"Select"}
          onSelect={value =>
            this.handleValueUpdate(value, handleTopLevelFuncUpdate)
          }
        />
        {this.renderActionArgumentFields(
          value,
          selectedOption,
          actionOptions,
          this.handleValueUpdate,
        )}
      </React.Fragment>
    );
  }
}

const mapStateToProps = (state: AppState) => ({
  actions: getActionsForCurrentPage(state),
  pageNameDropdown: state.entities.pageList.pages.map(p => ({
    label: p.pageName,
    id: p.pageId,
    value: `'${p.pageName}'`,
  })),
  modalDropdown: getModalDropdownList(state),
  nextModalName: getNextModalName(state),
});

const mapDispatchToProps = (dispatch: any) => {
  return {
    dispatchAction: (payload: ReduxActionWithoutPayload) => dispatch(payload),
  };
};

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(DynamicActionCreator);

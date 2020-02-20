import React, { ChangeEvent } from "react";
import { connect } from "react-redux";
import { AppState } from "reducers";
import { DropdownOption } from "widgets/DropdownWidget";
import _ from "lodash";
import { ControlWrapper } from "components/propertyControls/StyledControls";
import { InputText } from "components/propertyControls/InputTextControl";
import StyledDropdown from "components/editorComponents/StyledDropdown";
import { ActionDataState } from "reducers/entityReducers/actionsReducer";

const ACTION_TRIGGER_REGEX = /^{{([\s\S]*?)\(([\s\S]*?)\)}}$/g;
const ACTION_ANONYMOUS_FUNC_REGEX = /\(\) => ([\s\S]*?)(\([\s\S]*?\))/g;

const ALERT_STYLE_OPTIONS = [
  { label: "Info", value: "'info'", id: "info" },
  { label: "Success", value: "'success'", id: "success" },
  { label: "Error", value: "'error'", id: "error" },
  { label: "Warning", value: "'warning'", id: "warning" },
];

type ValueChangeHandler = (changeValue: string, currentValue: string) => string;
type ActionCreatorArgumentConfig = {
  label: string;
  field: string;
  valueChangeHandler: ValueChangeHandler;
  getSelectedValue: (value: string, returnArguments: boolean) => string;
};

interface ActionCreatorDropdownOption extends DropdownOption {
  arguments: ActionCreatorArgumentConfig[];
}

const handleTopLevelFuncUpdate: ValueChangeHandler = (
  value: string,
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

const handlePageNameArgSelect = (changeValue: string, currentValue: string) => {
  return currentValue.replace(ACTION_TRIGGER_REGEX, `{{$1(${changeValue})}}`);
};

const handleTextArgChange = (
  changeValue: string,
  currentValue: string,
): string => {
  return currentValue.replace(ACTION_TRIGGER_REGEX, `{{$1('${changeValue}')}}`);
};

const handleAlertTextChange = (
  changeValue: string,
  currentValue: string,
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",");
  args[0] = `'${changeValue}'`;
  return currentValue.replace(
    ACTION_TRIGGER_REGEX,
    `{{$1(${args.join(",")})}}`,
  );
};

const handleAlertTypeChange = (
  changeValue: string,
  currentValue: string,
): string => {
  const matches = [...currentValue.matchAll(ACTION_TRIGGER_REGEX)];
  const args = matches[0][2].split(",");
  args[1] = changeValue;
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
  return matches.length ? matches[0][2] : "none";
};

const getTextArgValue = (value: string) => {
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
          handleApiArgSelect(changeValue, currentValue, "onSuccess"),
        getSelectedValue: (value: string, returnArgs = false) =>
          getApiArgumentValue(value, "onSuccess", returnArgs),
      },
      {
        label: "onError",
        field: "ACTION_SELECTOR_FIELD",
        valueChangeHandler: (changeValue, currentValue) =>
          handleApiArgSelect(changeValue, currentValue, "onError"),
        getSelectedValue: (value: string, returnArgs = false) =>
          getApiArgumentValue(value, "onError", returnArgs),
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
};

interface Props {
  value: string;
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
    updateValueOrEvent: string | ChangeEvent<HTMLTextAreaElement>,
    valueUpdateHandler: ValueChangeHandler,
  ) => {
    const { value, onValueChange } = this.props;
    let updateValue = updateValueOrEvent;
    if (typeof updateValueOrEvent !== "string") {
      updateValue = updateValueOrEvent.target.value;
    }
    const newValue = valueUpdateHandler(updateValue as string, value);
    onValueChange(newValue);
  };

  renderSubArgumentFields = (
    argValue: string,
    allOptions: ActionCreatorDropdownOption[],
    parentChangeHandler: (
      updateValueOrEvent: string | ChangeEvent<HTMLTextAreaElement>,
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
      updateValueOrEvent: string | ChangeEvent<HTMLTextAreaElement>,
      valueUpdateHandler: ValueChangeHandler,
    ) => {
      let updateValue = updateValueOrEvent;
      if (typeof updateValueOrEvent !== "string") {
        updateValue = updateValueOrEvent.target.value;
      }
      const tempArg = `{{${subArgValue}${subArguments}}}`;
      const newValue = valueUpdateHandler(updateValue as string, tempArg);
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
      updateValueOrEvent: string | ChangeEvent<HTMLTextAreaElement>,
      valueUpdateHandler: ValueChangeHandler,
    ) => void,
  ) => {
    return (
      <div style={{ paddingLeft: 5 }}>
        {selectedOption.arguments.map(arg => {
          switch (arg.field) {
            case "ACTION_SELECTOR_FIELD":
              return (
                <ControlWrapper key={arg.label}>
                  <label>{arg.label}</label>
                  <StyledDropdown
                    options={allOptions}
                    selectedValue={arg.getSelectedValue(value, false)}
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
                    selectedValue={arg.getSelectedValue(value, false)}
                    onSelect={value =>
                      handleUpdate(value, arg.valueChangeHandler)
                    }
                  />
                </ControlWrapper>
              );
            case "TEXT_FIELD":
              return (
                <React.Fragment key={arg.label}>
                  <InputText
                    label={arg.label}
                    value={arg.getSelectedValue(value, false)}
                    onChange={e => handleUpdate(e, arg.valueChangeHandler)}
                    isValid={true}
                  />
                </React.Fragment>
              );
            case "ALERT_TYPE_SELECTOR_FIELD":
              return (
                <ControlWrapper key={arg.label}>
                  <label>{arg.label}</label>
                  <StyledDropdown
                    options={ALERT_STYLE_OPTIONS}
                    selectedValue={arg.getSelectedValue(value, false)}
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

const mapStateToProps = (state: AppState): ReduxStateProps => ({
  actions: state.entities.actions,
  pageNameDropdown: state.entities.pageList.pages.map(p => ({
    label: p.pageName,
    id: p.pageId,
    value: `'${p.pageName}'`,
  })),
});

export default connect(mapStateToProps)(DynamicActionCreator);

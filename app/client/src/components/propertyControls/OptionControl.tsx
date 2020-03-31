import React from "react";
import BaseControl, { ControlProps } from "./BaseControl";
import {
  ControlWrapper,
  StyledInputGroup,
  StyledPropertyPaneButton,
} from "./StyledControls";
import { DropdownOption } from "widgets/DropdownWidget";
import { ControlType } from "constants/PropertyControlConstants";
import styled from "constants/DefaultTheme";
import { FormIcons } from "icons/FormIcons";
import { AnyStyledComponent } from "styled-components";
import { generateReactKey } from "utils/generators";

const StyledDeleteIcon = styled(FormIcons.DELETE_ICON as AnyStyledComponent)`
  padding: 5px 5px;
  position: absolute;
  right: -4px;
  cursor: pointer;
`;

const StyledOptionControlInputGroup = styled(StyledInputGroup)`
  margin-right: 2px;
`;

const StyledOptionControlWrapper = styled(ControlWrapper)`
  display: flex;
  justify-content: flex-start;
  padding-right: 16px;
`;

function updateOptionLabel<T>(
  options: Array<T>,
  index: number,
  updatedLabel: string,
) {
  return options.map((option: T, optionIndex) => {
    if (index !== optionIndex) {
      return option;
    }
    return {
      ...option,
      label: updatedLabel,
    };
  });
}

function updateOptionValue<T>(
  options: Array<T>,
  index: number,
  updatedValue: string,
) {
  return options.map((option, optionIndex) => {
    if (index !== optionIndex) {
      return option;
    }
    return {
      ...option,
      value: updatedValue,
    };
  });
}

type DropDownOptionWithKey = DropdownOption & {
  key: string;
};

class OptionControl extends BaseControl<
  ControlProps,
  {
    renderOptions: DropDownOptionWithKey[];
  }
> {
  constructor(props: ControlProps) {
    super(props);
    this.state = {
      renderOptions: [],
    };
  }
  render() {
    const { renderOptions } = this.state;
    return (
      <React.Fragment>
        {renderOptions.map((option, index) => {
          return (
            <StyledOptionControlWrapper
              orientation={"HORIZONTAL"}
              key={option.key}
            >
              <StyledOptionControlInputGroup
                type={"text"}
                placeholder={"Name"}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  this.updateOptionLabel(index, event.target.value);
                }}
                defaultValue={option.label}
              />
              <StyledOptionControlInputGroup
                type={"text"}
                placeholder={"Value"}
                onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
                  this.updateOptionValue(index, event.target.value);
                }}
                defaultValue={option.value}
              />
              <StyledDeleteIcon
                height={20}
                width={20}
                onClick={() => {
                  this.deleteOption(index);
                }}
              />
            </StyledOptionControlWrapper>
          );
        })}
        <StyledPropertyPaneButton
          text={"Option"}
          icon={"plus"}
          color={"#FFFFFF"}
          minimal={true}
          onClick={this.addOption}
        />
      </React.Fragment>
    );
  }

  componentDidMount() {
    const { propertyValue } = this.props;

    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];

    options.map(option => {
      return {
        ...option,
        key: generateReactKey(),
      };
    });
    this.setState({
      renderOptions: options.map(option => {
        return {
          ...option,
          key: generateReactKey(),
        };
      }),
    });
  }

  deleteOption = (index: number) => {
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
    const { renderOptions } = this.state;

    const newOptions = options.filter((o, i) => i !== index);
    const newRenderOptions = renderOptions.filter((o, i) => i !== index);

    this.updateProperty("options", newOptions);
    this.setState({
      renderOptions: newRenderOptions,
    });
  };

  updateOptionLabel = (index: number, updatedLabel: string) => {
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
    this.updateProperty(
      "options",
      updateOptionLabel(options, index, updatedLabel),
    );

    this.setState({
      renderOptions: updateOptionLabel(
        this.state.renderOptions,
        index,
        updatedLabel,
      ),
    });
  };

  updateOptionValue = (index: number, updatedValue: string) => {
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
    this.updateProperty(
      "options",
      updateOptionValue(options, index, updatedValue),
    );

    this.setState({
      renderOptions: updateOptionValue(
        this.state.renderOptions,
        index,
        updatedValue,
      ),
    });
  };

  addOption = () => {
    const { propertyValue } = this.props;
    const options: DropdownOption[] = Array.isArray(propertyValue)
      ? propertyValue
      : [{}];
    const { renderOptions } = this.state;

    options.push({ label: "", value: "" });
    renderOptions.push({
      label: "",
      value: "",
      key: generateReactKey(),
    });

    this.setState({
      renderOptions: renderOptions,
    });
    this.updateProperty("options", options);
  };

  getControlType(): ControlType {
    return "OPTION_INPUT";
  }
}

export default OptionControl;

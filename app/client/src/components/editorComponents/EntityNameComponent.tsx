import styled from "styled-components";
import React from "react";

import Edit from "assets/images/EditPen.svg";
import ErrorTooltip from "components/editorComponents/ErrorTooltip";
import {
  FIELD_REQUIRED_ERROR,
  VALID_FUNCTION_NAME_ERROR,
  UNIQUE_NAME_ERROR,
  createMessage,
} from "@appsmith/constants/messages";

const InputContainer = styled.div<{ focused: boolean; isValid: boolean }>`
  align-items: center;
  display: flex;
  position: relative;
  width: 250px;
  input {
    padding: 3px 6px;
    margin-left: 10px;
    transition: font-size 0.2s;
    font-size: ${(props) => (props.focused ? "17px" : "18px")};
    border 1px solid;
    border-radius: 3px;
    border-color: ${(props) => {
      let color = props.focused ? "hsl(0,0%,80%)" : "white";
      color = !props.isValid ? "red" : color;
      return color;
    }};
    display: block;
    width: 100%;
    font-weight: 200;
    line-height: 24px;
    text-overflow: ellipsis;
    :hover {
      border-color: hsl(0, 0 %, 80 %);
      cursor: ${(props) => (props.focused ? "auto" : "pointer")};
    }
  }
`;

const EditPen = styled.img`
  height: 14px;
  width: 14px;
  position: absolute;
  right: 7px;
  : hover {
    cursor: pointer;
  }
`;

export function validateEntityName(name: string, allNames?: string[]) {
  const validation = {
    isValid: true,
    validationMessage: "",
  };

  if (!/^[a-zA-Z_][0-9a-zA-Z_]*$/.test(name)) {
    validation.isValid = false;
    validation.validationMessage += createMessage(VALID_FUNCTION_NAME_ERROR);
  }
  if (!name) {
    validation.isValid = false;
    validation.validationMessage += createMessage(FIELD_REQUIRED_ERROR);
  }

  if (
    allNames &&
    allNames.findIndex((entityName) => entityName === name) !== -1
  ) {
    validation.isValid = false;
    validation.validationMessage += createMessage(UNIQUE_NAME_ERROR);
  }

  return validation;
}

interface EntityNameProps {
  onBlur: (event?: any) => void;
  onChange: (event: React.ChangeEvent<HTMLInputElement>) => void;
  value: string;
  isValid: boolean;
  validationMessage?: string;
  focusOnMount?: boolean;
  readOnly?: boolean;
  disabled?: boolean;
  placeholder: string;
}

interface EntityNameState {
  focused: boolean;
}

class EntityNameComponent extends React.Component<
  EntityNameProps,
  EntityNameState
> {
  nameInput!: HTMLInputElement | null;

  constructor(props: EntityNameProps) {
    super(props);

    this.state = {
      focused: false,
    };
  }

  handleFocus = (event: { target: { select: () => any } }) => {
    event.target.select();
  };

  onFocus = () => {
    this.setState({ focused: true });
  };

  onBlur = () => {
    this.setState({ focused: false });
    this.props.onBlur();
  };

  onPressEnter = (event: any) => {
    event.preventDefault();
    event.target.blur();
  };

  render() {
    const { focused } = this.state;
    const {
      isValid,
      onChange,
      placeholder,
      validationMessage,
      value,
    } = this.props;

    return (
      <ErrorTooltip isOpen={!isValid} message={validationMessage || ""}>
        <InputContainer focused={focused} isValid={isValid}>
          <input
            onBlur={this.onBlur}
            onChange={onChange}
            onFocus={this.onFocus}
            onKeyPress={(e) => {
              if (e.key === "Enter") {
                this.onPressEnter(e);
              }
            }}
            placeholder={placeholder}
            value={value}
          />
          {!focused && (
            <EditPen alt="Edit pen" onClick={this.onFocus} src={Edit} />
          )}
        </InputContainer>
      </ErrorTooltip>
    );
  }
}

export default EntityNameComponent;

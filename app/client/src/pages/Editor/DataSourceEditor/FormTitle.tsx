import styled from "styled-components";
import React from "react";
import { WrappedFieldInputProps } from "redux-form";

import Edit from "assets/images/EditPen.svg";

const InputContainer = styled.div<{ focused: boolean }>`
  align-items: center;
  display: flex;
  width: 300px;
  input {
    margin-left: 10px;
    font-size: 18px;
    border: ${props => (props.focused ? 1 : 0)};
    display: block;
    width: 100%;
    font-weight: 500;
    line-height: 24px;
    text-overflow: ellipsis;
    :hover {
      cursor: ${props => (props.focused ? "auto" : "pointer")};
    }
  }
`;

const EditPen = styled.img`
  height: 17px;
  width: 17px;
  :hover {
    cursor: pointer;
  }
`;

interface FormTitleProps {
  input?: Partial<WrappedFieldInputProps>;
  focusOnMount: boolean;
}

interface FormTitleState {
  readOnly: boolean;
  focused: boolean;
}

class FormTitle extends React.Component<FormTitleProps, FormTitleState> {
  nameInput!: HTMLInputElement | null;

  constructor(props: FormTitleProps) {
    super(props);

    this.state = {
      readOnly: false,
      focused: false,
    };
  }

  componentDidMount() {
    const { focusOnMount } = this.props;

    if (focusOnMount) {
      this.nameInput?.select();
    }
  }

  handleFocus = (event: { target: { select: () => any } }) => {
    event.target.select();
  };

  onFocus = () => {
    this.nameInput?.select();
    this.setState({ focused: true });
  };

  onBlur = () => {
    this.setState({ focused: false });
  };

  onPressEnter = (event: any) => {
    event.preventDefault();
    event.target.blur();
  };

  render() {
    const { input } = this.props;
    const { focused } = this.state;

    return (
      <InputContainer focused={focused}>
        <input
          ref={input => {
            this.nameInput = input;
          }}
          placeholder="Datasource Name"
          onKeyPress={e => {
            if (e.key === "Enter") {
              this.onPressEnter(e);
            }
          }}
          {...input}
          onFocus={this.onFocus}
          onBlur={this.onBlur}
        />
        {!focused && (
          <EditPen onClick={this.onFocus} src={Edit} alt="Edit pen" />
        )}
      </InputContainer>
    );
  }
}

export default FormTitle;

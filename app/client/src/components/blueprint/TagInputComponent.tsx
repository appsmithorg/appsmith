import * as React from "react";
import { ComponentProps } from "../appsmith/BaseComponent";
import { Intent, ITagProps, TagInput, HTMLInputProps } from "@blueprintjs/core";
import { Container } from "../appsmith/ContainerComponent";
class TagInputComponent extends React.Component<TagInputComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <TagInput
          placeholder={this.props.placeholder}
          values={this.props.values}
        />
      </Container>
    );
  }
}

export interface TagInputComponentProps extends ComponentProps {
  addOnPaste?: boolean;
  className?: string;
  disabled?: boolean;
  fill?: boolean;
  inputProps?: HTMLInputProps;
  inputValue?: string; //Controlled value of the <input> element.
  intent?: Intent;
  large?: boolean; //Whether the tag input should use a large size
  onInputChange?: React.FormEventHandler<HTMLInputElement>;
  placeholder?: string;
  rightElement?: JSX.Element;
  separator?: string | RegExp | false;
  tagProps?: ITagProps;
  values?: string[]; //Required field
}

export default TagInputComponent;

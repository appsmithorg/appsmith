import * as React from "react"
import { IComponentProps } from "./BaseComponent"
import { Intent, ITagProps, TagInput, HTMLInputProps } from "@blueprintjs/core"
import { Container } from "./ContainerComponent"
class TagInputComponent extends React.Component<ITagInputComponentProps> {
  render() {
    return (
      <Container {...this.props}>
        <TagInput
          placeholder={this.props.placeholder}
          values={this.props.values}
        />
      </Container>
    )
  }
}

export interface ITagInputComponentProps extends IComponentProps {
  addOnPaste?: boolean
  className?: string
  disabled?: boolean
  fill?: boolean
  inputProps?: HTMLInputProps
  inputValue?: string //Controlled value of the <input> element.
  intent?: Intent
  large?: boolean //Whether the tag input should use a large size
  onInputChange?: React.FormEventHandler<HTMLInputElement>
  placeholder?: string
  rightElement?: JSX.Element
  separator?: string | RegExp | false
  tagProps?: ITagProps
  values?: string[] //Required field
}

export default TagInputComponent

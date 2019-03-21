import * as React from "react";
import BaseWidget, { IWidgetProps, IWidgetState } from "./BaseWidget";
import { WidgetType, CSSUnits } from "../constants/WidgetConstants";
import TagInputComponent from "../editorComponents/TagInputComponent";
import { Intent, ITagProps, TagInput, HTMLInputProps } from "@blueprintjs/core";

import _ from "lodash";

class TagInputWidget extends BaseWidget<ITagInputWidgetProps, IWidgetState> {
  constructor(widgetProps: ITagInputWidgetProps) {
    super(widgetProps);
  }

  getPageView() {
    return (
      <TagInputComponent
        widgetId={this.props.widgetId}
        key={this.props.widgetId}
        style={this.getPositionStyle()}
        placeholder={this.props.placeholder}
        values={this.props.values}
      />
    );
  }

  getWidgetType(): WidgetType {
    return "TAG_INPUT_WIDGET";
  }
}

export interface ITagInputWidgetProps extends IWidgetProps {
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

export default TagInputWidget;

import * as React from "react";
import { Text, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { ComponentProps } from "../appsmith/BaseComponent";
import { TextStyle } from "../../../widgets/TextWidget";

type TextStyleProps = {
  styleName: "primary" | "secondary" | "error";
};

export const BaseText = styled(Text)<TextStyleProps>``;

export interface TextComponentProps extends ComponentProps {
  text?: string;
  ellipsize?: boolean;
  textStyle?: TextStyle;
}

class TextComponent extends React.Component<TextComponentProps> {
  getTextClass(textStyle?: TextStyle) {
    switch (textStyle) {
      case "HEADING":
        return Classes.TEXT_LARGE;
      case "LABEL":
        return undefined;
      case "BODY":
        return Classes.TEXT_SMALL;
      default:
        return undefined;
    }
  }

  render() {
    return (
      <Text
        className={this.getTextClass(this.props.textStyle)}
        ellipsize={this.props.ellipsize}
      >
        {this.props.text}
      </Text>
    );
  }
}

export default TextComponent;

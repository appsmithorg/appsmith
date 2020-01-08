import * as React from "react";
import { Text, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { TextStyle } from "widgets/TextWidget";
import Interweave from "interweave";
import { UrlMatcher, EmailMatcher } from "interweave-autolink";

type TextStyleProps = {
  accent: "primary" | "secondary" | "error";
};

export const BaseText = styled(Text)<TextStyleProps>``;

export interface TextComponentProps extends ComponentProps {
  text?: string;
  ellipsize?: boolean;
  textStyle?: TextStyle;
  isLoading: boolean;
}

class TextComponent extends React.Component<TextComponentProps> {
  getTextClass(textStyle?: TextStyle) {
    let className = this.props.isLoading ? "bp3-skeleton " : "";
    switch (textStyle) {
      case "HEADING":
        className += Classes.TEXT_LARGE;
        break;
      case "BODY":
        className += Classes.TEXT_SMALL;
        break;
      case "LABEL":
        break;
      default:
        break;
    }

    return className;
  }

  render() {
    const { textStyle, text, ellipsize } = this.props;
    return (
      <Text className={this.getTextClass(textStyle)} ellipsize={ellipsize}>
        <Interweave
          content={text}
          matchers={[new UrlMatcher("url"), new EmailMatcher("email")]}
        />
      </Text>
    );
  }
}

export default TextComponent;

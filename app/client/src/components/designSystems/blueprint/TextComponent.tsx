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

/*
  Note:
  -webkit-line-clamp may seem like a wierd way to doing this
  however, it is getting more and more useful with more browser support.
  It suffices for our target browsers
  More info: https://css-tricks.com/line-clampin/
*/

export const TextContainer = styled.div`
  && {
    text-overflow: hidden;
    height: 100%;
    width: 100%;
  }
`;
export const StyledText = styled(Text)`
  height: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  display: flex;
  width: 100%;
  justify-content: flex-start;
  align-items: center;

  span {
  }
`;

export interface TextComponentProps extends ComponentProps {
  text?: string;
  ellipsize?: boolean;
  textStyle?: TextStyle;
  isLoading: boolean;
}

class TextComponent extends React.Component<TextComponentProps> {
  getTextClass(textStyle?: TextStyle) {
    const className = [];

    if (this.props.isLoading) {
      className.push("bp3-skeleton");
    }
    switch (textStyle) {
      case "HEADING":
        className.push(Classes.TEXT_LARGE);
        break;
      case "BODY":
        className.push(Classes.RUNNING_TEXT);
        break;
      case "LABEL":
        break;
      default:
        break;
    }

    return className.join(" ");
  }

  render() {
    const { textStyle, text, ellipsize } = this.props;
    return (
      <TextContainer>
        <StyledText
          className={this.getTextClass(textStyle)}
          ellipsize={ellipsize}
        >
          <Interweave
            content={text}
            matchers={[new UrlMatcher("url"), new EmailMatcher("email")]}
          />
        </StyledText>
      </TextContainer>
    );
  }
}

export default TextComponent;

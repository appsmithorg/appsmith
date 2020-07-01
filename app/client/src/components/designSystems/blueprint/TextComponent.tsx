import * as React from "react";
import { Text, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { TextStyle, TextAlign } from "widgets/TextWidget";
import Interweave from "interweave";
import { UrlMatcher, EmailMatcher } from "interweave-autolink";
import { labelStyle } from "constants/DefaultTheme";
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
    height: 100%;
    width: 100%;
  }
`;
export const StyledText = styled(Text)<{
  scroll: boolean;
  textAlign: string;
}>`
  height: 100%;
  overflow-y: ${props => (props.scroll ? "auto" : "hidden")};
  text-overflow: ellipsis;
  text-align: ${props => props.textAlign.toLowerCase()}
  display: flex;
  width: 100%;
  justify-content: flex-start;
  align-items: ${props => (props.scroll ? "flex-start" : "center")};
  &.bp3-heading {
    font-weight: ${props => props.theme.fontWeights[3]};
    font-size: ${props => props.theme.fontSizes[4]}px;
  }
  &.bp3-ui-text {
    ${labelStyle}
  }
  span {
    width: 100%;
  }
`;

export interface TextComponentProps extends ComponentProps {
  text?: string;
  textAlign: TextAlign;
  ellipsize?: boolean;
  textStyle?: TextStyle;
  isLoading: boolean;
  shouldScroll?: boolean;
}

class TextComponent extends React.Component<TextComponentProps> {
  getTextClass(textStyle?: TextStyle) {
    const className = [];

    if (this.props.isLoading) {
      className.push("bp3-skeleton");
    }
    switch (textStyle) {
      case "HEADING":
        className.push(Classes.HEADING);
        break;
      case "BODY":
        className.push(Classes.RUNNING_TEXT);
        break;
      case "LABEL":
        className.push(Classes.UI_TEXT);
        break;
      default:
        break;
    }

    return className.join(" ");
  }

  render() {
    const { textStyle, text, ellipsize, textAlign } = this.props;
    return (
      <TextContainer>
        <StyledText
          scroll={!!this.props.shouldScroll}
          textAlign={textAlign}
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

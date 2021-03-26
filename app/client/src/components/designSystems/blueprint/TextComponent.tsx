import * as React from "react";
import { Text } from "@blueprintjs/core";
import styled from "styled-components";
import { ComponentProps } from "components/designSystems/appsmith/BaseComponent";
import { TextAlign } from "widgets/TextWidget";
import Interweave from "interweave";
import { UrlMatcher, EmailMatcher } from "interweave-autolink";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
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
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  fontSize?: TextSize;
}>`
  height: 100%;
  overflow-y: ${(props) => (props.scroll ? "auto" : "hidden")};
  text-overflow: ellipsis;
  text-align: ${(props) => props.textAlign.toLowerCase()};
  display: flex;
  width: 100%;
  justify-content: flex-start;
  align-items: ${(props) => (props.scroll ? "flex-start" : "center")};
  background: ${(props) => props?.backgroundColor};
  color: ${(props) => props?.textColor};
  font-style: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
  text-decoration: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.UNDERLINE) ? "underline" : ""};
  font-weight: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-size: ${(props) => props?.fontSize && TEXT_SIZES[props?.fontSize]};
  span {
    width: 100%;
  }
`;

export interface TextComponentProps extends ComponentProps {
  text?: string;
  textAlign: TextAlign;
  ellipsize?: boolean;
  fontSize?: TextSize;
  isLoading: boolean;
  shouldScroll?: boolean;
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
}

class TextComponent extends React.Component<TextComponentProps> {
  render() {
    const {
      text,
      ellipsize,
      textAlign,
      fontStyle,
      fontSize,
      textColor,
      backgroundColor,
    } = this.props;
    return (
      <TextContainer>
        <StyledText
          scroll={!!this.props.shouldScroll}
          textAlign={textAlign}
          fontSize={fontSize}
          ellipsize={ellipsize}
          fontStyle={fontStyle}
          textColor={textColor}
          backgroundColor={backgroundColor}
          className={this.props.isLoading ? "bp3-skeleton" : "bp3-ui-text"}
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

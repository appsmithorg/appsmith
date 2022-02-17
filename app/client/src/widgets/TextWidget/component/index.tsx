import * as React from "react";
import { Text } from "@blueprintjs/core";
import styled from "styled-components";
import { ComponentProps } from "widgets/BaseComponent";
import Interweave from "interweave";
import { UrlMatcher, EmailMatcher } from "interweave-autolink";
import {
  FontStyleTypes,
  TextSize,
  TEXT_SIZES,
} from "constants/WidgetConstants";
import Icon, { IconSize } from "components/ads/Icon";
import { isEqual } from "lodash";
import ModalComponent from "components/designSystems/appsmith/ModalComponent";
import { Colors } from "constants/Colors";

export type TextAlign = "LEFT" | "CENTER" | "RIGHT" | "JUSTIFY";

const ELLIPSIS_HEIGHT = 15;

export const TextContainer = styled.div`
  & {
    height: 100%;
    width: 100%;
    position: relative;
  }

  ul {
    list-style-type: disc;
    list-style-position: inside;
  }
  ol {
    list-style-type: decimal;
    list-style-position: inside;
  }
  ul ul,
  ol ul {
    list-style-type: circle;
    list-style-position: inside;
    margin-left: 15px;
  }
  ol ol,
  ul ol {
    list-style-type: lower-latin;
    list-style-position: inside;
    margin-left: 15px;
  }
  h1 {
    font-size: 2em;
    margin: 0.67em 0;
  }
  h2 {
    font-size: 1.5em;
    margin: 0.75em 0;
  }
  h3 {
    font-size: 1.17em;
    margin: 0.83em 0;
  }
  h5 {
    font-size: 0.83em;
    margin: 1.5em 0;
  }
  h6 {
    font-size: 0.75em;
    margin: 1.67em 0;
  }
  h1,
  h2,
  h3,
  h4,
  h5,
  h6 {
    font-weight: bold;
  }
  a {
    color: #106ba3;
    text-decoration: none;

    &:hover {
      text-decoration: underline;
    }
  }
`;

const StyledIcon = styled(Icon)<{ backgroundColor?: string }>`
  cursor: pointer;
  bottom: 0;
  left: 0;
  right: 0;
  height: ${ELLIPSIS_HEIGHT}px;
  background: ${(props) =>
    props.backgroundColor ? props.backgroundColor : "transparent"};
`;

export const StyledText = styled(Text)<{
  scroll: boolean;
  isTruncated: boolean;
  textAlign: string;
  backgroundColor?: string;
  textColor?: string;
  fontStyle?: string;
  fontSize?: TextSize;
}>`
  height: ${(props) =>
    props.isTruncated ? `calc(100% - ${ELLIPSIS_HEIGHT}px)` : "100%"};
  overflow-y: ${(props) =>
    props.scroll ? (props.isTruncated ? "hidden" : "auto") : "hidden"};
  text-overflow: ellipsis;
  text-align: ${(props) => props.textAlign.toLowerCase()};
  display: flex;
  width: 100%;
  justify-content: flex-start;
  flex-direction: ${(props) => (props.isTruncated ? "column" : "unset")};
  align-items: ${(props) =>
    props.scroll || props.isTruncated ? "flex-start" : "center"};
  background: ${(props) => props?.backgroundColor};
  color: ${(props) => props?.textColor};
  font-style: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
  text-decoration: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.UNDERLINE) ? "underline" : ""};
  font-weight: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-size: ${(props) => props?.fontSize && TEXT_SIZES[props?.fontSize]};
  word-break: break-word;
  span {
    width: 100%;
    line-height: 1.2;
    white-space: pre-wrap;
  }
`;

const ModalContent = styled.div<{
  backgroundColor?: string;
}>`
  background: ${(props) => props?.backgroundColor || Colors.WHITE};
  padding: 24px;
  padding-top: 16px;
`;

const Heading = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;

  .title {
    font-weight: 500;
    font-size: 20px;
    line-height: 24px;
    letter-spacing: -0.24px;
    color: ${Colors.GREY_10};
  }

  .icon > svg > path {
    stroke: ${Colors.GREY_9};
  }
`;

const Content = styled.div<{
  fontSize?: TextSize;
  fontStyle?: string;
  textAlign: string;
  textColor?: string;
}>`
  padding-top: 16px;
  color: ${(props) => props?.textColor};
  max-height: 70vh;
  overflow: auto;
  text-align: ${(props) => props.textAlign.toLowerCase()};
  font-style: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.ITALIC) ? "italic" : ""};
  text-decoration: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.UNDERLINE) ? "underline" : ""};
  font-weight: ${(props) =>
    props?.fontStyle?.includes(FontStyleTypes.BOLD) ? "bold" : "normal"};
  font-size: ${(props) => props?.fontSize && TEXT_SIZES[props?.fontSize]};
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
  disableLink: boolean;
  shouldTruncate: boolean;
  truncateButtonColor?: string;
  // helpers to detect and re-calculate content width
  bottomRow?: number;
  leftColumn?: number;
  height?: number;
  rightColumn?: number;
  topRow?: number;
  width?: number;
}

type State = {
  displayText: string | undefined; // Maximum length of text that can be displayed without truncation.
  isTruncated: boolean;
  showModal: boolean;
};

type TextRef = React.Ref<Text> | undefined;

class TextComponent extends React.Component<TextComponentProps, State> {
  state = {
    displayText: "",
    isTruncated: false,
    showModal: false,
  };

  textRef = React.createRef() as TextRef;

  getDisplayTextLength = (): number => {
    let res = 0,
      maxLength = 0;
    const { fontSize, height, text, width } = this.props;
    const textLength: number = text?.length || 0; // Length of given text
    const area: number = (height || 0) * (width || 0); // Area of the widget
    const charSize: number = parseInt(
      TEXT_SIZES[fontSize || "PARAGRAPH"]?.split("px")[0],
    );
    const charArea = charSize * charSize; // Rough area of an individual character
    if (area && charArea) {
      maxLength = Math.round(area / charArea);
    }
    res = Math.min(maxLength, textLength);
    return res;
  };

  getDisplayText = (): string => {
    const { text } = this.props;
    return text?.substring(0, this.getDisplayTextLength()) || "";
  };

  componentDidMount = () => {
    if (this.props.shouldTruncate) {
      const displayText: string = this.getDisplayText();
      this.setState({
        displayText,
        isTruncated: this.props?.text
          ? displayText?.length < this.props?.text?.length
          : false,
      });
    } else this.setState({ displayText: this.props?.text });
  };

  componentDidUpdate = (prevProps: TextComponentProps) => {
    if (!isEqual(prevProps, this.props)) {
      if (this.props.shouldTruncate) {
        const displayText: string = this.getDisplayText();
        this.setState({
          displayText,
          isTruncated: this.props?.text
            ? displayText?.length < this.props?.text?.length
            : false,
        });
      } else if (prevProps.shouldTruncate && !this.props.shouldTruncate) {
        this.setState({
          displayText: this.props?.text,
          isTruncated: false,
        });
      }
    }
  };

  handleModelOpen = () => {
    this.setState({ showModal: true });
  };

  handleModelClose = () => {
    this.setState({ showModal: false });
  };

  render() {
    const {
      backgroundColor,
      disableLink,
      ellipsize,
      fontSize,
      fontStyle,
      shouldScroll,
      text,
      textAlign,
      textColor,
      truncateButtonColor,
    } = this.props;

    return (
      <>
        <TextContainer>
          <StyledText
            backgroundColor={backgroundColor}
            className={this.props.isLoading ? "bp3-skeleton" : "bp3-ui-text"}
            ellipsize={ellipsize}
            fontSize={fontSize}
            fontStyle={fontStyle}
            isTruncated={this.state.isTruncated}
            ref={this.textRef}
            scroll={!!shouldScroll}
            textAlign={textAlign}
            textColor={textColor}
          >
            <Interweave
              content={this.state.displayText}
              matchers={
                disableLink
                  ? []
                  : [new EmailMatcher("email"), new UrlMatcher("url")]
              }
              newWindow
            />
          </StyledText>
          {this.state.isTruncated && (
            <StyledIcon
              backgroundColor={backgroundColor}
              className="t--widget-textwidget-truncate"
              data-testid="icon:showMore"
              fillColor={truncateButtonColor}
              name="context-menu"
              onClick={this.handleModelOpen}
              size={IconSize.XXXL}
            />
          )}
        </TextContainer>
        <ModalComponent
          canEscapeKeyClose
          canOutsideClickClose
          className="t--widget-textwidget-truncate-modal"
          hasBackDrop
          isOpen={this.state.showModal}
          onClose={this.handleModelClose}
          overlayClassName="text-widget-truncate"
          scrollContents
          width={500}
        >
          <ModalContent backgroundColor={backgroundColor}>
            <Heading>
              <div className="title">Show More</div>
              <Icon
                className="icon"
                name="cross"
                onClick={this.handleModelClose}
                size={IconSize.MEDIUM}
              />
            </Heading>
            <Content
              fontSize={fontSize}
              fontStyle={fontStyle}
              textAlign={textAlign}
              textColor={textColor}
            >
              <Interweave
                content={text}
                matchers={
                  disableLink
                    ? []
                    : [new EmailMatcher("email"), new UrlMatcher("url")]
                }
                newWindow
              />
            </Content>
          </ModalContent>
        </ModalComponent>
      </>
    );
  }
}

export default TextComponent;

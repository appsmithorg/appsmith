import React, { useRef, useState } from "react";
import styled from "styled-components";
import _ from "lodash";
import Popper from "pages/Editor/Popper";
import ReactJson from "react-json-view";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { theme } from "constants/DefaultTheme";
import { Placement } from "popper.js";
import ScrollIndicator from "components/ads/ScrollIndicator";

const Wrapper = styled.div`
  position: relative;
  flex: 1;
  height: 100%;
`;

type ThemeConfig = {
  backgroundColor: string;
  textColor: string;
  editorColor: string;
  editorBackground: string;
};

type PopupTheme = Record<EditorTheme, ThemeConfig>;

const THEMES: PopupTheme = {
  [EditorTheme.LIGHT]: {
    backgroundColor: "#EBEBEB",
    textColor: "#4B4848",
    editorBackground: "#FAFAFA",
    editorColor: "#1E242B",
  },
  [EditorTheme.DARK]: {
    backgroundColor: "#262626",
    textColor: "#D4D4D4",
    editorBackground: "#1A191C",
    editorColor: "#F4F4F4",
  },
};

const ContentWrapper = styled.div<{ colorTheme: EditorTheme }>`
  width: ${(props) => props.theme.evaluatedValuePopup.width}px;
  max-height: ${(props) => props.theme.evaluatedValuePopup.height}px;
  overflow-y: auto;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  background-color: ${(props) => THEMES[props.colorTheme].backgroundColor};
  color: ${(props) => THEMES[props.colorTheme].textColor};
  padding: 10px;
  box-shadow: 0px 12px 28px -6px rgba(0, 0, 0, 0.32);
  border-radius: 0px;
`;

const CurrentValueWrapper = styled.div<{ colorTheme: EditorTheme }>`
  max-height: 300px;
  overflow-y: auto;
  -ms-overflow-style: none;
  padding: ${(props) => props.theme.spaces[3]}px;
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
`;

const CodeWrapper = styled.pre<{ colorTheme: EditorTheme }>`
  margin: 0px 0px;
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
  color: ${(props) => THEMES[props.colorTheme].editorColor};
  font-size: 14px;
  -ms-overflow-style: none;
  white-space: pre-wrap;
  word-break: break-all;
`;

const TypeText = styled.pre<{ colorTheme: EditorTheme }>`
  padding: ${(props) => props.theme.spaces[3]}px;
  background-color: ${(props) => THEMES[props.colorTheme].editorBackground};
  color: ${(props) => THEMES[props.colorTheme].editorColor};
  font-size: 12px;
  margin: 5px 0;
  -ms-overflow-style: none;
`;

const ErrorText = styled.p`
  margin: ${(props) => props.theme.spaces[2]}px 0px;
  padding: ${(props) => props.theme.spaces[3]}px
    ${(props) => props.theme.spaces[5]}px;
  border-radius: 0px;
  font-size: 14px;
  line-height: 19px;
  letter-spacing: -0.24px;
  background-color: rgba(226, 44, 44, 0.08);
  border: 1.2px solid ${(props) => props.theme.colors.errorMessage};
  color: ${(props) => props.theme.colors.errorMessage};
`;

const StyledTitle = styled.p`
  margin: 8px 0;
`;

interface Props {
  theme: EditorTheme;
  isOpen: boolean;
  hasError: boolean;
  expected?: string;
  evaluatedValue?: any;
  children: JSX.Element;
}

interface PopoverContentProps {
  hasError: boolean;
  expected?: string;
  evaluatedValue: any;
  theme: EditorTheme;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
}

export const CurrentValueViewer = (props: {
  theme: EditorTheme;
  evaluatedValue: any;
  hideLabel?: boolean;
}) => {
  const currentValueWrapperRef = React.createRef<HTMLDivElement>();
  const codeWrapperRef = React.createRef<HTMLPreElement>();

  let content = (
    <CodeWrapper colorTheme={props.theme} ref={codeWrapperRef}>
      {"undefined"}
      <ScrollIndicator containerRef={codeWrapperRef} />
    </CodeWrapper>
  );
  if (props.evaluatedValue !== undefined) {
    if (
      _.isObject(props.evaluatedValue) ||
      Array.isArray(props.evaluatedValue)
    ) {
      const reactJsonProps = {
        theme: props.theme === EditorTheme.DARK ? "summerfruit" : "rjv-default",
        name: null,
        enableClipboard: false,
        displayObjectSize: false,
        displayDataTypes: false,
        style: {
          fontSize: "12px",
        },
        collapsed: 2,
        collapseStringsAfterLength: 20,
      };
      content = <ReactJson src={props.evaluatedValue} {...reactJsonProps} />;
    } else {
      content = (
        <CodeWrapper colorTheme={props.theme} ref={codeWrapperRef}>
          {props.evaluatedValue === null
            ? "null"
            : props.evaluatedValue.toString()}
          <ScrollIndicator containerRef={codeWrapperRef} />
        </CodeWrapper>
      );
    }
  }
  return (
    <React.Fragment>
      {!props.hideLabel && <StyledTitle>Evaluated Value</StyledTitle>}
      <CurrentValueWrapper colorTheme={props.theme}>
        <>
          {content}
          <ScrollIndicator containerRef={currentValueWrapperRef} />
        </>
      </CurrentValueWrapper>
    </React.Fragment>
  );
};

const PopoverContent = (props: PopoverContentProps) => {
  const typeTextRef = React.createRef<HTMLPreElement>();

  return (
    <ContentWrapper
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      colorTheme={props.theme}
      className="t--CodeEditor-evaluatedValue"
    >
      {props.hasError && (
        <ErrorText>{`This value does not evaluate to type "${props.expected}". Transform it using JS inside '{{ }}'`}</ErrorText>
      )}
      {!props.hasError && props.expected && (
        <React.Fragment>
          <StyledTitle>Expected Data Type</StyledTitle>
          <TypeText colorTheme={props.theme} ref={typeTextRef}>
            {props.expected}
            <ScrollIndicator containerRef={typeTextRef} />
          </TypeText>
        </React.Fragment>
      )}
      <CurrentValueViewer
        theme={props.theme}
        evaluatedValue={props.evaluatedValue}
      />
    </ContentWrapper>
  );
};

const EvaluatedValuePopup = (props: Props) => {
  const [contentHovered, setContentHovered] = useState(false);

  const wrapperRef = useRef<HTMLDivElement>(null);
  let placement: Placement = "left-start";
  if (wrapperRef.current) {
    const boundingRect = wrapperRef.current.getBoundingClientRect();
    if (boundingRect.left < theme.evaluatedValuePopup.width) {
      placement = "right-start";
    }
  }

  return (
    <Wrapper ref={wrapperRef}>
      {(props.isOpen || contentHovered) && (
        <Popper
          targetNode={wrapperRef.current || undefined}
          isOpen
          zIndex={15}
          placement={placement}
          modifiers={{
            offset: {
              enabled: true,
              offset: "0, 15",
            },
          }}
        >
          <PopoverContent
            expected={props.expected}
            evaluatedValue={props.evaluatedValue}
            hasError={props.hasError}
            theme={props.theme}
            onMouseLeave={() => {
              setContentHovered(false);
            }}
            onMouseEnter={() => {
              setContentHovered(true);
            }}
          />
        </Popper>
      )}
      {props.children}
    </Wrapper>
  );
};

export default EvaluatedValuePopup;

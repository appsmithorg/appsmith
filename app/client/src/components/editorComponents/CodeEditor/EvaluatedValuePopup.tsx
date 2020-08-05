import React, { useRef, useState } from "react";
import styled from "styled-components";
import _ from "lodash";
import Popper from "pages/Editor/Popper";
import ReactJson from "react-json-view";
import { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import { theme } from "constants/DefaultTheme";
import { Placement } from "popper.js";

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
    backgroundColor: "#fff",
    textColor: "#1E242B",
    editorBackground: "#F4F4F4",
    editorColor: "#1E242B",
  },
  [EditorTheme.DARK]: {
    backgroundColor: "#23292e",
    textColor: "#F4F4F4",
    editorBackground: "#090a0f",
    editorColor: "#F4F4F4",
  },
};

const ContentWrapper = styled.div<{ colorTheme: EditorTheme }>`
  width: ${props => props.theme.evaluatedValuePopup.width}px;
  max-height: ${props => props.theme.evaluatedValuePopup.height}px;
  overflow-y: auto;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
  background-color: ${props => THEMES[props.colorTheme].backgroundColor};
  color: ${props => THEMES[props.colorTheme].textColor};
  padding: 10px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
`;

const CurrentValueWrapper = styled.div`
  max-height: 300px;
  overflow-y: auto;
  ::-webkit-scrollbar {
    display: none;
  }
  -ms-overflow-style: none;
`;

const CodeWrapper = styled.pre<{ colorTheme: EditorTheme }>`
  padding: 10px;
  margin: 0px 0px;
  background-color: ${props => THEMES[props.colorTheme].editorBackground};
  color: ${props => THEMES[props.colorTheme].editorColor};
  overflow: scroll;
  ::-webkit-scrollbar {
    display: none;
  }
  font-size: 14px;
  -ms-overflow-style: none;
  white-space: pre-wrap;
`;

const TypeText = styled.pre<{ colorTheme: EditorTheme }>`
  padding: 5px;
  background-color: ${props => THEMES[props.colorTheme].editorBackground};
  color: ${props => THEMES[props.colorTheme].editorColor};
  overflow: scroll;
  ::-webkit-scrollbar {
    display: none;
  }
  font-size: 12px;
  margin: 5px 0;
  -ms-overflow-style: none;
`;

const ErrorText = styled.p`
  margin: 5px 0;
  padding: 5px;
  border-radius: 2px;
  background-color: rgba(235, 87, 87, 0.2);
  color: ${props => props.theme.colors.error};
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

const CurrentValueViewer = (props: {
  theme: EditorTheme;
  evaluatedValue: any;
}) => {
  let content = (
    <CodeWrapper colorTheme={props.theme}>{"undefined"}</CodeWrapper>
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
        <CodeWrapper colorTheme={props.theme}>
          {props.evaluatedValue.toString()}
        </CodeWrapper>
      );
    }
  }
  return (
    <React.Fragment>
      <StyledTitle>Evaluated Value</StyledTitle>
      <CurrentValueWrapper>{content}</CurrentValueWrapper>
    </React.Fragment>
  );
};

const PopoverContent = (props: PopoverContentProps) => {
  return (
    <ContentWrapper
      onMouseEnter={props.onMouseEnter}
      onMouseLeave={props.onMouseLeave}
      colorTheme={props.theme}
      className="t--CodeEditor-evaluatedValue"
    >
      {props.hasError && (
        <ErrorText>{`This value does not evaluate to type "${props.expected}"`}</ErrorText>
      )}
      {!props.hasError && props.expected && (
        <React.Fragment>
          <StyledTitle>Expected Data Type</StyledTitle>
          <TypeText colorTheme={props.theme}>{props.expected}</TypeText>
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
            theme={EditorTheme.DARK}
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

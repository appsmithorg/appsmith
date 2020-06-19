import React, { useRef } from "react";
import styled from "styled-components";
import _ from "lodash";
import Popper from "pages/Editor/Popper";
import ReactJson from "react-json-view";
import { EditorTheme } from "components/editorComponents/DynamicAutocompleteInput";
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
  LIGHT: {
    backgroundColor: "#fff",
    textColor: "#1E242B",
    editorBackground: "#F4F4F4",
    editorColor: "#1E242B",
  },
  DARK: {
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
  background-color: ${props => THEMES[props.colorTheme].backgroundColor};
  color: ${props => THEMES[props.colorTheme].textColor};
  padding: 15px;
  box-shadow: 0px 4px 4px rgba(0, 0, 0, 0.25);
  border-radius: 4px;
  .react-json-view {
    .icon-container {
      display: none !important;
    }
  }
`;

const CurrentValueWrapper = styled.div`
  max-height: 150px;
  overflow-y: auto;
`;

const CodeWrapper = styled.pre<{ colorTheme: EditorTheme }>`
  padding: 10px;
  background-color: ${props => THEMES[props.colorTheme].editorBackground};
  color: ${props => THEMES[props.colorTheme].editorColor};
  overflow: scroll;
`;

const TypeText = styled.pre<{ colorTheme: EditorTheme }>`
  padding: 5px;
  background-color: ${props => THEMES[props.colorTheme].editorBackground};
  color: ${props => THEMES[props.colorTheme].editorColor};
  overflow: scroll;
`;

const ErrorText = styled.p`
  margin: 10px 0;
  padding: 5px;
  border-radius: 2px;
  background-color: rgba(235, 87, 87, 0.2);
  color: ${props => props.theme.colors.error};
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
}

export const CurrentValueViewer = (props: {
  theme: EditorTheme;
  evaluatedValue: any;
  hideLabel?: boolean;
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
        theme: props.theme === "DARK" ? "monokai" : "rjv-default",
        name: null,
        enableClipboard: false,
        displayObjectSize: false,
        displayDataTypes: false,
        style: {
          fontSize: "14px",
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
      {!props.hideLabel && <p>Current Value:</p>}
      <CurrentValueWrapper>{content}</CurrentValueWrapper>
    </React.Fragment>
  );
};

const PopoverContent = (props: PopoverContentProps) => {
  return (
    <ContentWrapper
      colorTheme={props.theme}
      className="t--CodeEditor-evaluatedValue"
    >
      {props.hasError && (
        <ErrorText>{`This value does not evaluate to type "${props.expected}"`}</ErrorText>
      )}
      {props.expected && (
        <React.Fragment>
          <p>Expected type:</p>
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
      {props.isOpen && (
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
          />
        </Popper>
      )}
      {props.children}
    </Wrapper>
  );
};

export default EvaluatedValuePopup;

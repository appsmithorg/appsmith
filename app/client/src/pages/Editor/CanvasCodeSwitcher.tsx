import React, { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "design-system";
import history from "utils/history";
import { builderURL } from "RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { matchBuilderPath } from "constants/routes";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import styled from "styled-components";
import { setCodeTabPath } from "actions/editorContextActions";
import { shouldStoreURLForFocus } from "navigation/FocusEntity";

type CanvasCodeSwitcherProps = {
  pageId: string;
};

const StyledSegmentedControl = styled(SegmentedControl)`
  width: 210px;
`;

function CanvasCodeSwitcher(props: CanvasCodeSwitcherProps) {
  const dispatch = useDispatch();
  const isEditorInitialized = useSelector(getIsEditorInitialized);
  const location = useLocation();
  const ref = useRef<HTMLDivElement | null>(null);
  const options = [
    {
      label: "Canvas",
      value: "CANVAS",
      shortcut: "⌘ + J",
    },
    {
      label: "Code",
      value: "CODE",
      shortcut: "⌘ + J",
    },
  ];
  const [optionsState, setOptionsState] = useState(options);
  const [switcher, setSwitcher] = useState("CANVAS");

  const handleMouseOver = (node: any) => {
    const childNode = node.children[0];
    if (childNode.getAttribute("data-selected") === "false") {
      const value = childNode.getAttribute("data-value");
      const updatedOptions = optionsState.map((option) => {
        if (option.value === value) {
          return {
            ...option,
            label: option.shortcut,
          };
        }

        return option;
      });
      setOptionsState(updatedOptions);
    }
  };

  const handleMouseLeave = () => {
    setOptionsState(options);
  };

  useEffect(() => {
    if (!isEditorInitialized) return;
    // Adding on hover text in ADS might be simpler
    const segmentedControl = document.getElementById("canvas-code-switcher");
    segmentedControl?.childNodes.forEach((node) => {
      node.addEventListener("mouseenter", () => handleMouseOver(node));
      node.addEventListener("mouseleave", () => handleMouseLeave());
    });

    return () => {
      segmentedControl?.childNodes.forEach((node) => {
        node.removeEventListener("mouseenter", () => handleMouseOver(node));
        node.removeEventListener("mouseleave", () => handleMouseLeave());
      });
    };
  }, [isEditorInitialized]);

  useEffect(() => {
    if (matchBuilderPath(location.pathname)) {
      setSwitcher("CANVAS");
    } else {
      setSwitcher("CODE");
      if (shouldStoreURLForFocus(location.pathname)) {
        dispatch(setCodeTabPath(location.pathname));
      }
    }
    setOptionsState(options);
  }, [location]);

  const onChange = (value: string) => {
    if (value === switcher) return;

    if (value === "CANVAS") {
      history.push(
        builderURL({
          pageId: props.pageId,
        }),
      );
    } else {
      dispatch({
        type: "NAVIGATE_MOST_RECENT",
      });
    }

    setSwitcher(value);
  };

  if (!isEditorInitialized) return null;

  return (
    <StyledSegmentedControl
      id="canvas-code-switcher"
      onChange={onChange}
      options={optionsState}
      ref={ref}
      value={switcher}
    />
  );
}

export default CanvasCodeSwitcher;

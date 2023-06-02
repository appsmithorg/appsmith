import React, { useEffect, useRef, useState } from "react";
import { SegmentedControl } from "design-system";
import history from "utils/history";
import { builderURL } from "RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { matchBuilderPath, matchDatasourcePath } from "constants/routes";
import { getIsEditorInitialized } from "selectors/editorSelectors";
import styled from "styled-components";
import { setCodeTabPath } from "actions/editorContextActions";
import { shouldStoreURLForFocus } from "navigation/FocusEntity";
import { getSelectedTab } from "selectors/canvasCodeSelectors";
import { canvasCodeToggle } from "actions/globalSearchActions";

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
      shortcut: "⌘ + B",
    },
    {
      label: "Code",
      value: "CODE",
      shortcut: "⌘ + B",
    },
  ];
  const [optionsState, setOptionsState] = useState(options);
  const selectedTab = useSelector(getSelectedTab);

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
    if (matchDatasourcePath(location.pathname)) return;

    if (matchBuilderPath(location.pathname)) {
      dispatch(canvasCodeToggle("CANVAS"));
    } else {
      dispatch(canvasCodeToggle("CODE"));
      if (shouldStoreURLForFocus(location.pathname)) {
        dispatch(setCodeTabPath(location.pathname));
      }
    }
    setOptionsState(options);
  }, [location]);

  useEffect(() => {
    navigate(selectedTab);
  }, [selectedTab]);

  const navigate = (value: string) => {
    if (!props.pageId) return;

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
  };

  const onChange = (value: string) => {
    if (value === selectedTab) return;

    navigate(value);
  };

  if (!isEditorInitialized) return null;

  return (
    <StyledSegmentedControl
      id="canvas-code-switcher"
      onChange={onChange}
      options={optionsState}
      ref={ref}
      value={selectedTab}
    />
  );
}

export default CanvasCodeSwitcher;

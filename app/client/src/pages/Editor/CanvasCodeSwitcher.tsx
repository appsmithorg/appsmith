import React, { useEffect, useState } from "react";
import type { SegmentedControlOption } from "design-system";
import { SegmentedControl } from "design-system";
import history from "utils/history";
import { builderURL } from "RouteBuilder";
import { useDispatch, useSelector } from "react-redux";
import { useLocation } from "react-router";
import { matchBuilderPath } from "constants/routes";
import { getIsEditorInitialized } from "selectors/editorSelectors";

type CanvasCodeSwitcherProps = {
  pageId: string;
};

function CanvasCodeSwitcher(props: CanvasCodeSwitcherProps) {
  const dispatch = useDispatch();
  const isEditorInitialized = useSelector(getIsEditorInitialized);
  const location = useLocation();
  const options: SegmentedControlOption[] = [
    {
      label: "Canvas",
      value: "CANVAS",
    },
    {
      label: "Code",
      value: "CODE",
    },
  ];
  const [switcher, setSwitcher] = useState("CANVAS");

  useEffect(() => {
    if (matchBuilderPath(location.pathname)) {
      setSwitcher("CANVAS");
    } else {
      setSwitcher("CODE");
    }
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
    <SegmentedControl onChange={onChange} options={options} value={switcher} />
  );
}

export default CanvasCodeSwitcher;

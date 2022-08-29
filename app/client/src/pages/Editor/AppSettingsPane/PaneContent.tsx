import { closeAppSettingsPaneAction } from "actions/appSettingsPaneActions";
import React, { useRef } from "react";
import { useDispatch } from "react-redux";
import { useOnClickOutside } from "utils/hooks/useOnClickOutside";
import AppSettings from "./AppSettings";
import PaneHeader from "./AppSettings/PaneHeader";

function PaneContent() {
  const dispatch = useDispatch();
  const paneRef = useRef(null);

  useOnClickOutside([paneRef], () => {
    dispatch(closeAppSettingsPaneAction());
  });

  return (
    <div className="h-full" ref={paneRef}>
      <PaneHeader />
      <AppSettings />
    </div>
  );
}

export default PaneContent;

export * from "ce/pages/Editor/IDE/MainPane/useMissingModuleNotification";

import React from "react";
import { getAllModuleInstances } from "@appsmith/selectors/moduleInstanceSelectors";
import {
  MISSING_PACKAGE_OR_MODULE,
  OPEN_DEBUGGER_CTA,
  createMessage,
} from "@appsmith/constants/messages";
import { Callout } from "design-system";
import { useDispatch, useSelector } from "react-redux";
import { showDebugger } from "actions/debuggerActions";

function useMissingModuleNotification(): React.ReactNode | null {
  const dispatch = useDispatch();
  const moduleInstances = useSelector(getAllModuleInstances);
  const hasMissingModule = Object.values(moduleInstances).some(
    (mi) => (mi.invalids || []).length > 0,
  );

  if (!hasMissingModule) return null;

  const openDebugger = () => {
    dispatch(showDebugger());
  };

  return (
    <Callout
      isClosable
      kind="error"
      links={[
        { children: createMessage(OPEN_DEBUGGER_CTA), onClick: openDebugger },
      ]}
    >
      {createMessage(MISSING_PACKAGE_OR_MODULE)}
    </Callout>
  );
}

export default useMissingModuleNotification;

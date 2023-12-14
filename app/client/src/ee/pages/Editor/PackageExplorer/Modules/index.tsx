import React, { useCallback, useEffect, useRef } from "react";
import QueryModuleExplorer from "./QueryModuleExplorer";
import UIModuleExplorer from "./UIModuleExplorer";
import JSModuleExplorer from "./JSModuleExplorer";
import { EntityExplorerResizeHandler } from "pages/Editor/Explorer/Common/EntityExplorerResizeHandler";
import { getCurrentPackageId } from "@appsmith/selectors/packageSelectors";
import { useSelector } from "react-redux";
import { RelativeContainer } from "pages/Editor/Explorer/Common/components";
import { getExplorerStatus, saveExplorerStatus } from "../../Explorer/helpers";
import { MODULE_TYPE } from "@appsmith/constants/ModuleConstants";
import styled from "styled-components";

const Container = styled(RelativeContainer)`
  overflow-y: auto;

  & .group.cursor-ns-resize {
    bottom: 0 !important;
  }
`;

const DEFAULT_OPEN_STATE = {
  [MODULE_TYPE.QUERY]: true,
  [MODULE_TYPE.JS]: false,
  [MODULE_TYPE.UI]: false,
};

const Modules = () => {
  const sectionOpenStates = useRef(DEFAULT_OPEN_STATE);
  const packageId = useSelector(getCurrentPackageId) || "";
  const isModulesOpen = getExplorerStatus(packageId, "packages");
  const moduleResizeRef = useRef<HTMLDivElement>(null);
  const storedHeightKey = "modulesContainerHeight_" + packageId;
  const storedHeight = localStorage.getItem(storedHeightKey);

  useEffect(() => {
    if (
      (isModulesOpen === null ? true : isModulesOpen) &&
      moduleResizeRef.current
    ) {
      moduleResizeRef.current.style.height = storedHeight + "px";
    }
  }, [moduleResizeRef]);

  const onUpdateOpenState = useCallback(
    (moduleType: MODULE_TYPE, isOpen: boolean) => {
      sectionOpenStates.current[moduleType] = isOpen;

      const isAnyOpen = Object.values(sectionOpenStates.current).some(Boolean);

      saveExplorerStatus(packageId, "packages", isAnyOpen);
    },
    [saveExplorerStatus, sectionOpenStates],
  );

  return (
    <Container
      className="border-b pb-1"
      data-testid="t--module-explorer"
      ref={moduleResizeRef}
    >
      <UIModuleExplorer />
      <QueryModuleExplorer onUpdateOpenState={onUpdateOpenState} />
      <JSModuleExplorer onUpdateOpenState={onUpdateOpenState} />
      <EntityExplorerResizeHandler
        resizeRef={moduleResizeRef}
        storedHeightKey={storedHeightKey}
      />
    </Container>
  );
};

export default Modules;

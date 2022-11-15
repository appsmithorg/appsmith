import React, { useCallback } from "react";
import styled from "styled-components";
import { Icon, IconSize, Spinner } from "design-system";
import { Colors } from "constants/Colors";
import Entity, { EntityClassNames } from "../Entity";
import {
  createMessage,
  CREATE_DATASOURCE_TOOLTIP,
} from "ce/constants/messages";
import InstallationWindow from "./InstallationWindow";
import { useDispatch, useSelector } from "react-redux";
import {
  selectInstallationStatus,
  selectLibrariesForExplorer,
} from "selectors/entitiesSelector";
import { extraLibraries } from "utils/DynamicBindingUtils";
import { ReduxActionTypes } from "ce/constants/ReduxActionConstants";
import { InstallState } from "reducers/uiReducers/libraryReducer";
import { Collapse } from "@blueprintjs/core";

const defaultLibraries = extraLibraries.map((lib) => lib.displayName);

const Library = styled.li`
  list-style: none;
  flex-direction: column;
  color: ${Colors.GRAY_700};
  font-weight: 400;
  display: flex;
  justify-content: space-between;
  cursor: pointer;
  padding: 6px 12px 6px 0.5rem;
  position: relative;
  &:hover {
    background: ${Colors.ALABASTER_ALT};

    & .t--open-new-tab {
      display: block;
    }

    & .uninstall-library {
      display: block;
    }
  }

  & .t--open-new-tab {
    position: absolute;
    right: 8px;
    display: none;
  }

  & .uninstall-library {
    display: none;
  }

  & .t--package-version {
    display: block;
    font-size: 12px;
  }
  .open-collapse {
    transform: rotate(90deg);
  }

  .content {
    font-size: 12px;
    font-weight: 400;
    padding: 6px 0 0 8px;
    color: ${Colors.GRAY_700};
    .accessor {
      padding-top: 8px;
      color: ${Colors.ENTERPRISE_DARK};
    }
  }
`;
const Name = styled.div`
  width: calc(100% - 36px);
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  line-clamp: 2;
  -webkit-box-orient: vertical;
  word-break: break-all;
`;
const Version = styled.span<{ version?: string }>`
  display: ${(props) => (props.version ? "block" : "none")};
`;

const uninstallLibraryInit = (payload: string) => ({
  type: ReduxActionTypes.UNINSTALL_LIBRARY_INIT,
  payload,
});

const PrimaryCTA = function({ name }: { name: string }) {
  const installationStatus = useSelector(selectInstallationStatus);
  const dispatch = useDispatch();

  const uninstallLibrary = useCallback(() => {
    dispatch(uninstallLibraryInit(name));
  }, [name]);

  if (installationStatus[name] === InstallState.Queued)
    return (
      <div className="shrink-0">
        <Spinner />
      </div>
    );

  if (!defaultLibraries.includes(name))
    return (
      <Icon
        className="uninstall-library ml-1"
        name="trash-outline"
        onClick={uninstallLibrary}
        size={IconSize.MEDIUM}
      />
    );

  return null;
};

function LibraryEntity({ lib }: any) {
  const openDocs = (name: string, url: string) => () => window.open(url, name);
  const [isOpen, open] = React.useState(false);
  return (
    <Library>
      <div className="flex flex-row items-center">
        <Icon
          className={isOpen ? "open-collapse" : ""}
          fillColor={Colors.GREY_7}
          name="right-arrow-2"
          onClick={() => open(!isOpen)}
          size={IconSize.XXXL}
        />
        <Name>{lib.displayName}</Name>
        <Version
          className="t--package-version"
          onClick={openDocs(lib.displayName, lib.docsURL)}
          version={lib.version}
        >
          {lib.version}
        </Version>
        <PrimaryCTA name={lib.url as string} />
      </div>
      <Collapse className="text-xs" isOpen={isOpen}>
        <div className="content">
          Available as <span className="accessor">{lib.accessor}</span>
        </div>
      </Collapse>
    </Library>
  );
}

function JSDependencies() {
  const libraries = useSelector(selectLibrariesForExplorer);
  const dependencyList = libraries.map((lib) => (
    <LibraryEntity key={lib.displayName} lib={lib} />
  ));
  return (
    <Entity
      addButtonHelptext={createMessage(CREATE_DATASOURCE_TOOLTIP)}
      className={"libraries"}
      customAddButton={
        <InstallationWindow
          className={`${EntityClassNames.ADD_BUTTON} group libraries h-100`}
        />
      }
      entityId="library_section"
      icon={null}
      isDefaultExpanded={false}
      isSticky
      name="Libraries"
      searchKeyword={""}
      step={0}
    >
      {dependencyList}
    </Entity>
  );
}

export default React.memo(JSDependencies);

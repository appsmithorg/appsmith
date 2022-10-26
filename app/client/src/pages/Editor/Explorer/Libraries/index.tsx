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

const defaultLibraries = extraLibraries.map((lib) => lib.displayName);

const Library = styled.li`
  list-style: none;
  color: ${Colors.GRAY_700};
  font-weight: 400;
  gap: 0.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  cursor: pointer;
  padding: 8px 12px 8px 20px;
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

  if (installationStatus.hasOwnProperty(name))
    return (
      <div className="shrink-0">
        <Spinner />
      </div>
    );

  if (!defaultLibraries.includes(name))
    return (
      <Icon
        className="uninstall-library"
        name="trash-outline"
        onClick={uninstallLibrary}
        size={IconSize.MEDIUM}
      />
    );

  return null;
};

function JSDependencies() {
  const openDocs = (name: string, url: string) => () => window.open(url, name);
  const libraries = useSelector(selectLibrariesForExplorer);
  const dependencyList = libraries.map((lib) => {
    return (
      <Library
        key={lib.displayName}
        onClick={openDocs(lib.displayName, lib.docsURL)}
      >
        <Name>{lib.displayName}</Name>
        <Version className="t--package-version" version={lib.version}>
          {lib.version}
        </Version>
        {/* <Icon className="t--open-new-tab" name="open-new-tab" size={Size.xxs} /> */}
        <PrimaryCTA name={lib.displayName} />
      </Library>
    );
  });
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

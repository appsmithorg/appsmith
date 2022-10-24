import React from "react";
import styled from "styled-components";
import { AppIcon as Icon, Size, Spinner } from "design-system";
import { Colors } from "constants/Colors";
import Entity, { EntityClassNames } from "../Entity";
import {
  createMessage,
  CREATE_DATASOURCE_TOOLTIP,
} from "ce/constants/messages";
import InstallationWindow from "./InstallationWindow";
import { useSelector } from "react-redux";
import {
  selectInstallationStatus,
  selectLibrariesForExplorer,
} from "selectors/entitiesSelector";

const ListItem = styled.li`
  list-style: none;
  color: ${Colors.GREY_8};
  height: 36px;
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

    & .t--package-version {
      display: none;
    }
  }

  & .t--open-new-tab {
    position: absolute;
    right: 8px;
    display: none;
  }

  & .t--package-version {
    display: block;
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
`;
const Version = styled.span``;

function JSDependencies() {
  const openDocs = (name: string, url: string) => () => window.open(url, name);
  const installationStatus = useSelector(selectInstallationStatus);
  const libraries = useSelector(selectLibrariesForExplorer);
  const dependencyList = libraries.map((lib) => {
    return (
      <ListItem
        key={lib.displayName}
        onClick={openDocs(lib.displayName, lib.docsURL)}
      >
        <Name>{lib.displayName}</Name>
        {lib.version ? (
          <Version className="t--package-version">{lib.version}</Version>
        ) : null}
        <Icon className="t--open-new-tab" name="open-new-tab" size={Size.xxs} />
        {installationStatus.hasOwnProperty(lib.displayName) && (
          <div className="shrink-0">
            <Spinner />
          </div>
        )}
      </ListItem>
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

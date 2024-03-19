import React, { useState } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import {
  getGitStatus,
  getIsFetchingGitStatus,
} from "selectors/gitSyncSelectors";
import type { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
// import {
//   CHANGES_APP_SETTINGS,
//   CHANGES_FROM_APPSMITH,
//   CHANGES_THEME,
//   createMessage,
//   NOT_PUSHED_YET,
//   TRY_TO_PULL,
// } from "@appsmith/constants/messages";
// import { getCurrentApplication } from "selectors/editorSelectors";
// import { changeInfoSinceLastCommit } from "../utils";
import { Callout, Icon, Text } from "design-system";

const DummyChange = styled.div`
  width: 50%;
  height: ${(props) => props.theme.spaces[9]}px;
  background: linear-gradient(
    90deg,
    ${Colors.GREY_2} 0%,
    rgba(240, 240, 240, 0) 100%
  );
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

const ChangeContainer = styled.div`
  margin-bottom: 8px;
`;

const Wrapper = styled.div`
  display: flex;
  gap: 6px;
  cursor: pointer;
  font-weight: 600;
`;

const ContentWrapper = styled.div`
  padding-left: 32px;
  margin-bottom: 6px;
`;

const ContentSubItem = styled.div`
  margin-top: 6px;
  margin-bottom: 6px;
  display: flex;
  gap: 6px;
`;

const CalloutContainer = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
`;

const Changes = styled.div`
  margin-top: ${(props) => props.theme.spaces[7]}px;
  margin-bottom: ${(props) => props.theme.spaces[7]}px;
`;

export enum ChangeKind {
  // AHEAD_COMMIT = "AHEAD_COMMIT",
  // BEHIND_COMMIT = "BEHIND_COMMIT",
  DATASOURCES = "DATASOURCES",
  JSOBJECTS = "JSOBJECTS",
  PAGES = "PAGES",
  QUERIES = "QUERIES",
  JSLIBS = "JSLIBS",
  // THEME = "THEME",
  // SETTINGS = "SETTINGS",
  // PACKAGES = "PACKAGES",
  // MODULES = "MODULES",
}

// const defaultStatus: GitStatusData = {
//   modified: [],
//   added: [],
//   removed: [],
//   pagesModified: [],
//   pagesAdded: [],
//   pagesRemoved: [],
//   queriesModified: [],
//   queriesAdded: [],
//   queriesRemoved: [],
//   jsObjectsModified: [],
//   jsObjectsAdded: [],
//   jsObjectsRemoved: [],
//   datasourcesModified: [],
//   datasourcesAdded: [],
//   datasourcesRemoved: [],
//   jsLibsModified: [],
//   jsLibsAdded: [],
//   jsLibsRemoved: [],
//   conflicting: [],
//   isClean: false,
//   aheadCount: 0,
//   behindCount: 0,
//   remoteBranch: "",
//   discardDocUrl: "",
//   migrationMessage: "",
// };

interface ChangeDef {
  modified: string[];
  added: string[];
  removed: string[];
  singular: string;
  plural: string;
  iconName: string;
}

const allChangeDefs: Record<ChangeKind, (status: GitStatusData) => ChangeDef> =
  {
    [ChangeKind.PAGES]: (status: GitStatusData) => ({
      modified: status.pagesModified,
      added: status.pagesAdded,
      removed: status.pagesRemoved,
      singular: "Page",
      plural: "Pages",
      iconName: "widget",
    }),
    [ChangeKind.DATASOURCES]: (status: GitStatusData) => ({
      modified: status.datasourcesModified,
      added: status.datasourcesAdded,
      removed: status.datasourcesRemoved,
      singular: "Datasource",
      plural: "Datasources",
      iconName: "database-2-line",
    }),
    [ChangeKind.QUERIES]: (status: GitStatusData) => ({
      modified: status.queriesModified,
      added: status.queriesAdded,
      removed: status.queriesRemoved,
      singular: "Query",
      plural: "Queries",
      iconName: "query",
    }),
    [ChangeKind.JSOBJECTS]: (status: GitStatusData) => ({
      modified: status.jsObjectsModified,
      added: status.jsObjectsAdded,
      removed: status.jsObjectsRemoved,
      singular: "JS Object",
      plural: "JS Objects",
      iconName: "js",
    }),
    [ChangeKind.JSLIBS]: (status: GitStatusData) => ({
      modified: status.jsLibsModified,
      added: status.jsLibsAdded,
      removed: status.jsLibsRemoved,
      singular: "JS Lib",
      plural: "JS Libs",
      iconName: "package",
    }),
  };

interface ChangeProps {
  kind: ChangeKind;
  status: GitStatusData;
}

export function Change({ kind, status }: ChangeProps) {
  const [isCollapsed, setIsCollapsed] = useState(true);

  const { added, iconName, modified, plural, removed, singular } =
    allChangeDefs[kind](status);

  const isModified = !!modified.length;
  const isAdded = !!added.length;
  const isRemoved = !!removed.length;
  const hasOnlyOneChange =
    [isModified ? 1 : 0, isAdded ? 1 : 0, isRemoved ? 1 : 0].reduce(
      (a, v) => a + v,
    ) === 1;

  const totalChanges = modified.length + added.length + removed.length;

  const getMessage = (count: number, action: string) =>
    `${count} ${count === 1 ? `${singular} was` : `${plural} were`} ${action}`;

  const getTitleMessage = () => {
    let action = "";
    if (hasOnlyOneChange) {
      if (isModified) {
        action = "edited";
      } else if (isAdded) {
        action = "added";
      } else if (isRemoved) {
        action = "removed";
      }
    } else {
      action = "modified";
    }

    return getMessage(totalChanges, action);
  };

  const handleClick = () => {
    setIsCollapsed((c) => !c);
  };

  if (totalChanges === 0) {
    return null;
  }

  return (
    <ChangeContainer>
      <Wrapper onClick={handleClick}>
        <Icon
          color={"var(--ads-v2-color-fg)"}
          name={!isCollapsed ? "arrow-down-s-line" : "arrow-right-s-line"}
          size="md"
        />
        {iconName && (
          <Icon color={"var(--ads-v2-color-fg)"} name={iconName} size="md" />
        )}
        <Text color={"var(--ads-v2-color-fg)"} kind="body-s">
          {getTitleMessage()}
        </Text>
      </Wrapper>
      {!isCollapsed && (
        <ContentWrapper>
          {isModified && (
            <ChangeSubList
              action="edited"
              entities={modified}
              iconName={iconName}
            />
          )}
          {isAdded && (
            <ChangeSubList
              action="added"
              entities={added}
              iconName={iconName}
            />
          )}
          {isRemoved && (
            <ChangeSubList
              action="removed"
              entities={removed}
              iconName={iconName}
            />
          )}
        </ContentWrapper>
      )}
    </ChangeContainer>
  );
}

interface ChangeSubListProps {
  action: string;
  entities: string[];
  iconName: string;
}

export function ChangeSubList({
  action,
  entities = [],
  iconName,
}: ChangeSubListProps) {
  const sublist = entities.map((entity) => {
    let pageName = null;
    let entityName = null;
    if (entity.includes("/")) {
      [pageName, entityName] = entity.split("/");
    } else {
      entityName = entity;
    }
    return (
      <ContentSubItem className="d-flex" key={entity}>
        {iconName && (
          <Icon color={"var(--ads-v2-color-fg)"} name={iconName} size="md" />
        )}
        {pageName && (
          <Text color={"var(--ads-v2-color-fg)"} kind="body-s">
            {pageName}
          </Text>
        )}
        {pageName && (
          <Icon
            color={"var(--ads-v2-color-fg)"}
            name="arrow-right-line"
            size="sm"
          />
        )}
        <Text color={"var(--ads-v2-color-fg)"} kind="body-s">
          {`${entityName} was ${action}`}
        </Text>
      </ContentSubItem>
    );
  });
  return <div>{sublist}</div>;
}

// interface GitStatusProps {
//   iconName: string;
//   message: string;
//   hasValue: boolean;
// }

// const changeKind = [
//   Kind.SETTINGS,
//   Kind.THEME,
//   Kind.PAGE,
//   Kind.QUERY,
//   Kind.JS_OBJECT,
//   Kind.DATA_SOURCE,
//   Kind.JS_LIB,
//   Kind.MODULES,
//   Kind.PACKAGES,
// ];

// type GitStatusMap = {
//   [key in Kind]: (status: Partial<GitStatusData>) => GitStatusProps;
// };

// const STATUS_MAP: GitStatusMap = {
//   [Kind.AHEAD_COMMIT]: (status) => ({
//     message: aheadCommitMessage(status),
//     iconName: "git-commit",
//     hasValue: (status?.aheadCount || 0) > 0,
//   }),
//   [Kind.BEHIND_COMMIT]: (status) => ({
//     message: behindCommitMessage(status),
//     iconName: "git-commit",
//     hasValue: (status?.behindCount || 0) > 0,
//   }),
//   [Kind.SETTINGS]: (status) => ({
//     message: createMessage(CHANGES_APP_SETTINGS),
//     iconName: "settings-2-line",
//     hasValue: (status?.modified || []).includes("application.json"),
//   }),
//   [Kind.THEME]: (status) => ({
//     message: createMessage(CHANGES_THEME),
//     iconName: "sip-line",
//     hasValue: (status?.modified || []).includes("theme.json"),
//   }),
//   [Kind.DATA_SOURCE]: (status) => ({
//     message: `${status?.modifiedDatasources || 0} ${
//       status?.modifiedDatasources || 0 ? "datasource" : "datasources"
//     } modified`,
//     iconName: "database-2-line",
//     hasValue: (status?.modifiedDatasources || 0) > 0,
//   }),
//   [Kind.JS_OBJECT]: (status) => ({
//     message: `${status?.modifiedJSObjects || 0} JS ${
//       (status?.modifiedJSObjects || 0) <= 1 ? "Object" : "Objects"
//     } modified`,
//     iconName: "js",
//     hasValue: (status?.modifiedJSObjects || 0) > 0,
//   }),
//   [Kind.PAGE]: (status) => ({
//     message: `${status?.modifiedPages || 0} ${
//       (status?.modifiedPages || 0) <= 1 ? "page" : "pages"
//     } modified`,
//     iconName: "widget",
//     hasValue: (status?.modifiedPages || 0) > 0,
//   }),
//   [Kind.QUERY]: (status) => ({
//     message: `${status?.modifiedQueries || 0} ${
//       (status?.modifiedQueries || 0) <= 1 ? "query" : "queries"
//     } modified`,
//     iconName: "query",
//     hasValue: (status?.modifiedQueries || 0) > 0,
//   }),
//   [Kind.JS_LIB]: (status) => ({
//     message: `${status?.modifiedJSLibs || 0} ${
//       (status?.modifiedJSLibs || 0) <= 1 ? "library" : "libraries"
//     } modified`,
//     iconName: "package",
//     hasValue: (status?.modifiedJSLibs || 0) > 0,
//   }),
//   [Kind.PACKAGES]: (status) => ({
//     message: `${status?.modifiedPackages || 0} ${
//       (status?.modifiedPackages || 0) <= 1 ? "package" : "packages"
//     } modified`,
//     iconName: "package",
//     hasValue: (status?.modifiedPackages || 0) > 0,
//   }),
//   [Kind.MODULES]: (status) => ({
//     message: `${status?.modifiedModules || 0} ${
//       (status?.modifiedModules || 0) <= 1
//         ? "module configuration"
//         : "module configurations"
//     } modified`,
//     iconName: "package",
//     hasValue: (status?.modifiedModules || 0) > 0,
//   }),
// };

// function behindCommitMessage(status: Partial<GitStatusData>) {
//   const behindCount = status?.behindCount || 0;
//   let behindMessage =
//     (behindCount || 0) === 1
//       ? `${behindCount || 0} commit`
//       : `${behindCount || 0} commits`;
//   behindMessage += ` behind. ${createMessage(TRY_TO_PULL)}`;
//   return behindMessage;
// }

// function aheadCommitMessage(status: Partial<GitStatusData>) {
//   const aheadCount = status?.aheadCount || 0;
//   let aheadMessage =
//     (aheadCount || 0) === 1
//       ? `${aheadCount || 0} commit`
//       : `${aheadCount || 0} commits`;
//   aheadMessage += ` ahead. ${createMessage(NOT_PUSHED_YET)}`;
//   return aheadMessage;
// }

// export function Change(props: Partial<GitStatusProps>) {
//   const { iconName = "git-commit", message } = props;

//   return (
//     <Wrapper>
//       {iconName && (
//         <Icon color={"var(--ads-v2-color-fg)"} name={iconName} size="md" />
//       )}
//       <Text color={"var(--ads-v2-color-fg)"} kind="body-s">
//         {message}
//       </Text>
//     </Wrapper>
//   );
// }

// /**
//  * gitChangeListData: accepts a git status
//  * @param status {GitStatusData} status object that contains git-status call result from backend
//  * @returns {JSX.Element[]}
//  */
// export function gitChangeListData(
//   status: Partial<GitStatusData> = defaultStatus,
// ): JSX.Element[] {

//   return changeKind
//     .map((type: Kind) => STATUS_MAP[type](status))
//     .filter((s: GitStatusProps) => s.hasValue)
//     .map((s) => <Change {...s} key={`change-status-${s.iconName}`} />)
//     .filter((s) => !!s);
// }

// /**
//  * gitRemoteChangeListData: accepts a git status
//  * @param status {GitStatusData} status object that contains git-status call result from backend
//  * @returns {JSX.Element[]}
//  */
// export function gitRemoteChangeListData(
//   status: Partial<GitStatusData> = defaultStatus,
// ): JSX.Element[] {
//   const changeKind = [Kind.AHEAD_COMMIT, Kind.BEHIND_COMMIT];
//   return changeKind
//     .map((type: Kind) => STATUS_MAP[type](status))
//     .filter((s: GitStatusProps) => s.hasValue)
//     .map((s) => <Change {...s} key={`change-status-${s.iconName}`} />)
//     .filter((s) => !!s);
// }

export default function GitChangesList() {
  const status = useSelector(getGitStatus);
  const statusLoading = useSelector(getIsFetchingGitStatus);

  // const derivedStatus: Partial<GitStatusData> = {
  //   ...status,
  //   aheadCount: status?.aheadCount,
  //   behindCount: status?.behindCount,
  //   remoteBranch: status?.remoteBranch,
  // };

  // const statusChanges = gitChangeListData(derivedStatus);
  // const remoteStatusChanges = gitRemoteChangeListData(derivedStatus);

  // const currentApplication = useSelector(getCurrentApplication);
  // const { isAutoUpdate } = changeInfoSinceLastCommit(currentApplication);
  // if (isAutoUpdate && !status?.isClean) {
  //   statusChanges.push(
  //     <Change
  //       hasValue={isAutoUpdate}
  //       iconName="info"
  //       key="change-status-auto-update"
  //       message={createMessage(CHANGES_FROM_APPSMITH)}
  //     />,
  //   );
  // }

  if (statusLoading) {
    return <DummyChange data-testid={"t--git-change-loading-dummy"} />;
  }

  if (!status) {
    return null;
  }

  return (
    <Changes data-testid={"t--git-change-statuses"}>
      <Change kind={ChangeKind.PAGES} status={status} />
      <Change kind={ChangeKind.JSOBJECTS} status={status} />
      <Change kind={ChangeKind.DATASOURCES} status={status} />
      <Change kind={ChangeKind.QUERIES} status={status} />
      <Change kind={ChangeKind.JSLIBS} status={status} />
      {/* {remoteStatusChanges} */}
      {status?.migrationMessage ? (
        <CalloutContainer>
          <Callout kind="info">{status.migrationMessage}</Callout>
        </CalloutContainer>
      ) : null}
    </Changes>
  );
}

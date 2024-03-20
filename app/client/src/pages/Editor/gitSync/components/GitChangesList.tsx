import React, { useState } from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import {
  getGitStatus,
  getIsFetchingGitStatus,
} from "selectors/gitSyncSelectors";
import type { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
import { Callout, Icon, Text } from "design-system";
import {
  NOT_PUSHED_YET,
  TRY_TO_PULL,
  createMessage,
} from "@appsmith/constants/messages";

const DummyChange = styled.div`
  width: 50%;
  height: 18px;
  background: linear-gradient(
    90deg,
    ${Colors.GREY_2} 0%,
    rgba(240, 240, 240, 0) 100%
  );
  margin-top: 16px;
  margin-bottom: 16px;
`;

const ChangeContainer = styled.div`
  margin-bottom: 8px;
`;

const StaticWrapper = styled.div`
  display: flex;
  gap: 6px;
  font-weight: 600;
  margin-bottom: 6px;
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
  margin-top: 16px;
`;

const Changes = styled.div`
  margin-top: 16px;
  margin-bottom: 16px;
`;

enum StaticChangeKind {
  SETTINGS = "SETTINGS",
  THEME = "THEME",
  PACKAGES = "PACKAGES",
  MODULES = "MODULES",
  REMOTE_AHEAD = "REMOTE_AHEAD",
  REMOTE_BEHIND = "REMOTE_BEHIND",
}

interface StaticChangeDef {
  condition: boolean;
  message: string;
  iconName: string;
}

const allStaticChangeDefs: Record<
  StaticChangeKind,
  (status: GitStatusData) => StaticChangeDef
> = {
  [StaticChangeKind.REMOTE_AHEAD]: (status: GitStatusData) => ({
    condition: (status.aheadCount ?? 0) > 0,
    message: `${status.aheadCount ?? 0} ${
      (status.aheadCount ?? 0) > 0 ? "commits" : "commit"
    } ahead. ${createMessage(NOT_PUSHED_YET)}`,
    iconName: "git-commit",
  }),

  [StaticChangeKind.REMOTE_BEHIND]: (status: GitStatusData) => ({
    condition: (status.behindCount ?? 0) > 0,
    message: `${status.behindCount ?? 0} ${
      (status.behindCount ?? 0) > 0 ? "commits" : "commit"
    } behind. ${createMessage(TRY_TO_PULL)}`,
    iconName: "git-commit",
  }),
  [StaticChangeKind.SETTINGS]: (status: GitStatusData) => ({
    condition: status.modified.includes("application.json"),
    message: "Application settings modified",
    iconName: "settings-2-line",
  }),
  [StaticChangeKind.THEME]: (status: GitStatusData) => ({
    condition: status.modified.includes("theme.json"),
    message: "Theme modified",
    iconName: "sip-line",
  }),
  [StaticChangeKind.PACKAGES]: (status: GitStatusData) => ({
    condition: (status.modifiedPackages ?? 0) > 0,
    message: `${status.modifiedPackages ?? 0} ${
      (status.modifiedPackages ?? 0) > 0 ? "packages" : "package"
    } modified`,
    iconName: "package",
  }),
  [StaticChangeKind.MODULES]: (status: GitStatusData) => ({
    condition: (status.modifiedModules ?? 0) > 0,
    message: `${status.modifiedModules ?? 0} ${
      (status.modifiedModules ?? 0) > 0 ? "modules" : "module"
    } modified`,
    iconName: "package",
  }),
};

interface StaticChageProps {
  kind: StaticChangeKind;
  status: GitStatusData;
}

function StaticChage({ kind, status }: StaticChageProps) {
  const { condition, iconName, message } = allStaticChangeDefs[kind](status);
  if (!condition) {
    return null;
  }
  return (
    <StaticWrapper data-testid={`t--status-change-${kind}`}>
      {iconName && (
        <Icon color={"var(--ads-v2-color-fg)"} name={iconName} size="md" />
      )}
      <Text color={"var(--ads-v2-color-fg)"} kind="body-s">
        {message}
      </Text>
    </StaticWrapper>
  );
}

export enum ChangeKind {
  DATASOURCES = "DATASOURCES",
  JSOBJECTS = "JSOBJECTS",
  PAGES = "PAGES",
  QUERIES = "QUERIES",
  JSLIBS = "JSLIBS",
}

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
      singular: "page",
      plural: "pages",
      iconName: "widget",
    }),
    [ChangeKind.DATASOURCES]: (status: GitStatusData) => ({
      modified: status.datasourcesModified,
      added: status.datasourcesAdded,
      removed: status.datasourcesRemoved,
      singular: "datasource",
      plural: "datasources",
      iconName: "database-2-line",
    }),
    [ChangeKind.QUERIES]: (status: GitStatusData) => ({
      modified: status.queriesModified,
      added: status.queriesAdded,
      removed: status.queriesRemoved,
      singular: "query",
      plural: "queries",
      iconName: "query",
    }),
    [ChangeKind.JSOBJECTS]: (status: GitStatusData) => ({
      modified: status.jsObjectsModified,
      added: status.jsObjectsAdded,
      removed: status.jsObjectsRemoved,
      singular: "js object",
      plural: "js objects",
      iconName: "js",
    }),
    [ChangeKind.JSLIBS]: (status: GitStatusData) => ({
      modified: status.jsLibsModified,
      added: status.jsLibsAdded,
      removed: status.jsLibsRemoved,
      singular: "js lib",
      plural: "js libs",
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
    `${count} ${count === 1 ? `${singular}` : `${plural}`} ${action}`;

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
      <Wrapper data-testid={`t--status-change-${kind}`} onClick={handleClick}>
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
          {`${entityName} ${action}`}
        </Text>
      </ContentSubItem>
    );
  });
  return <div>{sublist}</div>;
}

export default function GitChangesList() {
  const status = useSelector(getGitStatus);
  const statusLoading = useSelector(getIsFetchingGitStatus);

  if (statusLoading) {
    return <DummyChange data-testid="t--status-change-skeleton-loading" />;
  }

  if (!status) {
    return null;
  }

  return (
    <Changes data-testid={"t--status-changes"}>
      <StaticChage kind={StaticChangeKind.REMOTE_BEHIND} status={status} />
      <StaticChage kind={StaticChangeKind.REMOTE_AHEAD} status={status} />
      <Change kind={ChangeKind.PAGES} status={status} />
      <Change kind={ChangeKind.JSOBJECTS} status={status} />
      <Change kind={ChangeKind.DATASOURCES} status={status} />
      <Change kind={ChangeKind.QUERIES} status={status} />
      <Change kind={ChangeKind.JSLIBS} status={status} />
      <StaticChage kind={StaticChangeKind.SETTINGS} status={status} />
      <StaticChage kind={StaticChangeKind.THEME} status={status} />
      <StaticChage kind={StaticChangeKind.PACKAGES} status={status} />
      <StaticChage kind={StaticChangeKind.MODULES} status={status} />
      {status?.migrationMessage ? (
        <CalloutContainer>
          <Callout kind="info">{status.migrationMessage}</Callout>
        </CalloutContainer>
      ) : null}
    </Changes>
  );
}

import { Icon, Text } from "design-system";
import React, { useState } from "react";
import type { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
import styled from "styled-components";

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

export enum ExpandableChangeKind {
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

const allChangeDefs: Record<
  ExpandableChangeKind,
  (status: GitStatusData) => ChangeDef
> = {
  [ExpandableChangeKind.PAGES]: (status: GitStatusData) => ({
    modified: status.pagesModified,
    added: status.pagesAdded,
    removed: status.pagesRemoved,
    singular: "page",
    plural: "pages",
    iconName: "widget",
  }),
  [ExpandableChangeKind.DATASOURCES]: (status: GitStatusData) => ({
    modified: status.datasourcesModified,
    added: status.datasourcesAdded,
    removed: status.datasourcesRemoved,
    singular: "datasource",
    plural: "datasources",
    iconName: "database-2-line",
  }),
  [ExpandableChangeKind.QUERIES]: (status: GitStatusData) => ({
    modified: status.queriesModified,
    added: status.queriesAdded,
    removed: status.queriesRemoved,
    singular: "query",
    plural: "queries",
    iconName: "query",
  }),
  [ExpandableChangeKind.JSOBJECTS]: (status: GitStatusData) => ({
    modified: status.jsObjectsModified,
    added: status.jsObjectsAdded,
    removed: status.jsObjectsRemoved,
    singular: "js object",
    plural: "js objects",
    iconName: "js",
  }),
  [ExpandableChangeKind.JSLIBS]: (status: GitStatusData) => ({
    modified: status.jsLibsModified,
    added: status.jsLibsAdded,
    removed: status.jsLibsRemoved,
    singular: "js lib",
    plural: "js libs",
    iconName: "package",
  }),
};

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

interface ChangeProps {
  kind: ExpandableChangeKind;
  status: GitStatusData;
}

export function ExpandableChange({ kind, status }: ChangeProps) {
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

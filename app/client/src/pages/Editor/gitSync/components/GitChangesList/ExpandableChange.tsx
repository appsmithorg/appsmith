import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Text,
} from "@appsmith/ads";
import React from "react";
import type { GitStatusData } from "reducers/uiReducers/gitSyncTypes";
import styled from "styled-components";

const TitleText = styled(Text)`
  font-weight: 500;
`;

const StyledCollapsible = styled(Collapsible)`
  gap: 0;
`;

const StyledCollapsibleHeader = styled(CollapsibleHeader)`
  padding-top: 0;
  padding-bottom: 0;
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
    const entityNameArr = entity.split("/");
    const entityName = entityNameArr[entityNameArr.length - 1];

    return (
      <div className="flex items-center space-x-1.5" key={entity}>
        {iconName && (
          <Icon color={"var(--ads-v2-color-fg)"} name={iconName} size="md" />
        )}
        <Text color={"var(--ads-v2-color-fg)"} kind="body-m">
          {`${entityName} ${action}`}
        </Text>
      </div>
    );
  });

  // eslint-disable-next-line react/jsx-no-useless-fragment
  return <>{sublist}</>;
}

interface ChangeProps {
  kind: ExpandableChangeKind;
  status: GitStatusData;
  filter?: (entity: string) => boolean;
}

export function ExpandableChange({ filter, kind, status }: ChangeProps) {
  const { added, iconName, modified, plural, removed, singular } =
    allChangeDefs[kind](status);

  const filteredModified =
    typeof filter === "function" ? modified.filter(filter) : modified;
  const filteredAdded =
    typeof filter === "function" ? added.filter(filter) : added;
  const filteredRemoved =
    typeof filter === "function" ? removed.filter(filter) : removed;

  const isModified = !!filteredModified.length;
  const isAdded = !!filteredAdded.length;
  const isRemoved = !!filteredRemoved.length;
  const hasOnlyOneChange =
    [isModified ? 1 : 0, isAdded ? 1 : 0, isRemoved ? 1 : 0].reduce(
      (a, v) => a + v,
    ) === 1;

  const totalChanges =
    filteredModified.length + filteredAdded.length + filteredRemoved.length;

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

  if (totalChanges === 0) {
    return null;
  }

  return (
    <div data-testid={`t--status-change-${kind}`}>
      <StyledCollapsible className="space-y-2">
        <StyledCollapsibleHeader>
          <div className="flex item-center space-x-1.5">
            {iconName && (
              <Icon
                color={"var(--ads-v2-color-fg)"}
                name={iconName}
                size="md"
              />
            )}
            <TitleText>{getTitleMessage()}</TitleText>
          </div>
        </StyledCollapsibleHeader>
        <CollapsibleContent className="ml-6 space-y-1">
          {isModified && (
            <ChangeSubList
              action="edited"
              entities={filteredModified}
              iconName={iconName}
            />
          )}
          {isAdded && (
            <ChangeSubList
              action="added"
              entities={filteredAdded}
              iconName={iconName}
            />
          )}
          {isRemoved && (
            <ChangeSubList
              action="removed"
              entities={filteredRemoved}
              iconName={iconName}
            />
          )}
        </CollapsibleContent>
      </StyledCollapsible>
    </div>
  );
}

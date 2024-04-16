import {
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Icon,
  Text,
} from "design-system";
import React, { useMemo } from "react";
import type { GitStatusData } from "reducers/uiReducers/gitSyncReducer";
import { ExpandableChange, ExpandableChangeKind } from "./ExpandableChange";
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

/**
 * show collapsible if jsobject, queries are changed, irrespective of page changes
 * show static when only page is changed
 */

interface SinglePageChangeProps {
  page: string;
  status: GitStatusData;
}

function SinglePageChange({ page, status }: SinglePageChangeProps) {
  const changeFlags = useMemo(() => {
    const flags = {
      isPageModified: status.pagesModified.includes(page),
      isPageAdded: status.pagesAdded.includes(page),
      isPageRemoved: status.pagesRemoved.includes(page),

      isJsObjectModified: status.jsObjectsModified.some((jsObject) =>
        jsObject.startsWith(page),
      ),
      isJsObjectAdded: status.jsObjectsAdded.some((jsObject) =>
        jsObject.startsWith(page),
      ),
      isJsObjectRemoved: status.jsObjectsRemoved.some((jsObject) =>
        jsObject.startsWith(page),
      ),

      isQueryModified: status.queriesModified.some((query) =>
        query.startsWith(page),
      ),
      isQueryAdded: status.queriesAdded.some((query) => query.startsWith(page)),
      isQueryRemoved: status.queriesRemoved.some((query) =>
        query.startsWith(page),
      ),
    };
    return flags;
  }, [status]);

  const titleText = useMemo(() => {
    let text = `${page} `;
    if (
      changeFlags.isPageModified ||
      changeFlags.isJsObjectModified ||
      changeFlags.isQueryModified
    ) {
      text += "modified";
    } else if (
      changeFlags.isPageAdded ||
      changeFlags.isJsObjectAdded ||
      changeFlags.isQueryAdded
    ) {
      text += "added";
    } else if (
      changeFlags.isPageRemoved ||
      changeFlags.isJsObjectRemoved ||
      changeFlags.isQueryRemoved
    ) {
      text += "removed";
    }
    return text;
  }, [page, changeFlags]);

  const showCollapsible = useMemo(() => {
    return (
      changeFlags.isJsObjectModified ||
      changeFlags.isJsObjectAdded ||
      changeFlags.isJsObjectRemoved ||
      changeFlags.isQueryModified ||
      changeFlags.isQueryAdded ||
      changeFlags.isQueryRemoved
    );
  }, [changeFlags]);

  const titleComp = (
    <div className="flex item-center space-x-1.5">
      <Icon color={"var(--ads-v2-color-fg)"} name="page-line" size="md" />
      <TitleText>{titleText}</TitleText>
    </div>
  );

  if (!showCollapsible) {
    return (
      <div data-testid={`t--status-change-PAGE-${page.replace(" ", "_")}`}>
        {titleComp}
      </div>
    );
  }

  return (
    <div data-testid={`t--status-change-PAGE-${page.replace(" ", "_")}`}>
      <StyledCollapsible className="space-y-2">
        <StyledCollapsibleHeader arrowPosition="start">
          {titleComp}
        </StyledCollapsibleHeader>
        <CollapsibleContent className="ml-6 space-y-2">
          <ExpandableChange
            filter={(entity) => entity.startsWith(`${page}/`)}
            kind={ExpandableChangeKind.QUERIES}
            status={status}
          />
          <ExpandableChange
            filter={(entity) => entity.startsWith(`${page}/`)}
            kind={ExpandableChangeKind.JSOBJECTS}
            status={status}
          />
        </CollapsibleContent>
      </StyledCollapsible>
    </div>
  );
}

interface PageChangesProps {
  status: GitStatusData;
}

export default function PageChanges({ status }: PageChangesProps) {
  const {
    jsObjectsAdded,
    jsObjectsModified,
    jsObjectsRemoved,
    pagesAdded,
    pagesModified,
    pagesRemoved,
    queriesAdded,
    queriesModified,
    queriesRemoved,
  } = status;

  const allPagesChangedSet = new Set([
    ...jsObjectsModified.map((jsObject) => jsObject.split("/")[0]),
    ...jsObjectsAdded.map((jsObject) => jsObject.split("/")[0]),
    ...jsObjectsRemoved.map((jsObject) => jsObject.split("/")[0]),
    ...queriesModified.map((query) => query.split("/")[0]),
    ...queriesAdded.map((query) => query.split("/")[0]),
    ...queriesRemoved.map((query) => query.split("/")[0]),
    ...pagesModified,
    ...pagesAdded,
    ...pagesRemoved,
  ]);

  if (allPagesChangedSet.size === 0) return null;

  return (
    <>
      {Array.from(allPagesChangedSet).map((page) => {
        return <SinglePageChange key={page} page={page} status={status} />;
      })}
    </>
  );
}

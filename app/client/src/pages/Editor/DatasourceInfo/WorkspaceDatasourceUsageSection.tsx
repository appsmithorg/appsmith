import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Button,
  EmptyState,
  Flex,
  Spinner,
  Text,
  Divider,
  Icon,
} from "@appsmith/ads";
import styled from "styled-components";
import type {
  WorkspaceDatasourcePageUsage,
  WorkspaceDatasourceUsage,
} from "ee/api/WorkspaceApi";
import {
  DATASOURCE_USAGE_EMPTY_DESCRIPTION,
  DATASOURCE_USAGE_EMPTY_TITLE,
  DATASOURCE_USAGE_NO_QUERIES,
  DATASOURCE_USAGE_QUERY_COUNT,
  DATASOURCE_USAGE_COLLAPSE_ALL,
  DATASOURCE_USAGE_EXPAND_ALL,
  createMessage,
} from "ee/constants/messages";
import { Link } from "react-router-dom";
import { generatePath } from "react-router";
import {
  BUILDER_PATH_DEPRECATED,
  QUERIES_EDITOR_ID_PATH,
} from "ee/constants/routes/appRoutes";

const UsageContainer = styled.div`
  height: 100%;
  overflow-y: auto;
  padding: var(--ads-v2-spaces-7);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-5);
`;

const ApplicationCard = styled.div`
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-5);
  background-color: var(--ads-v2-color-bg);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
`;

export interface WorkspaceDatasourceUsageSectionProps {
  datasourceName?: string;
  usage?: WorkspaceDatasourceUsage;
  isLoading?: boolean;
}

const WorkspaceDatasourceUsageSection = (
  props: WorkspaceDatasourceUsageSectionProps,
) => {
  const { isLoading, usage } = props;

  const applications = usage?.applications ?? [];
  const showEmptyState = !isLoading && applications.length === 0;

  const totalQueryCount = usage?.totalQueryCount ?? 0;

  const headerSummary = useMemo(
    () => createMessage(DATASOURCE_USAGE_QUERY_COUNT, totalQueryCount),
    [totalQueryCount],
  );

  const [collapsedApplications, setCollapsedApplications] = useState<
    Record<string, boolean>
  >({});

  useEffect(() => {
    if (!applications.length) {
      setCollapsedApplications({});

      return;
    }

    setCollapsedApplications((prev) => {
      const next: Record<string, boolean> = {};
      let hasChanges =
        Object.keys(prev).length !== applications.length ||
        applications.length === 0;

      applications.forEach((app) => {
        const prevValue = prev[app.applicationId];
        const value = typeof prevValue === "boolean" ? prevValue : false;

        next[app.applicationId] = value;

        if (prevValue === undefined) {
          hasChanges = true;
        }
      });

      if (!hasChanges) {
        const prevKeys = Object.keys(prev);
        const appIds = applications.map((app) => app.applicationId);

        hasChanges =
          prevKeys.length !== appIds.length ||
          prevKeys.some((key) => !appIds.includes(key));
      }

      if (!hasChanges) {
        return prev;
      }

      return next;
    });
  }, [applications]);

  const handleToggleApplication = useCallback((applicationId: string) => {
    setCollapsedApplications((prev) => ({
      ...prev,
      [applicationId]: !(prev[applicationId] ?? false),
    }));
  }, []);

  const handleExpandAll = useCallback(() => {
    setCollapsedApplications(() => {
      const next: Record<string, boolean> = {};

      applications.forEach((app) => {
        next[app.applicationId] = false;
      });

      return next;
    });
  }, [applications]);

  const handleCollapseAll = useCallback(() => {
    setCollapsedApplications(() => {
      const next: Record<string, boolean> = {};

      applications.forEach((app) => {
        next[app.applicationId] = true;
      });

      return next;
    });
  }, [applications]);

  const allExpanded = useMemo(() => {
    if (!applications.length) {
      return false;
    }

    return applications.every(
      (app) => !collapsedApplications[app.applicationId],
    );
  }, [applications, collapsedApplications]);

  const toggleAllLabel = allExpanded
    ? createMessage(DATASOURCE_USAGE_COLLAPSE_ALL)
    : createMessage(DATASOURCE_USAGE_EXPAND_ALL);

  const toggleAllIcon = allExpanded ? "arrow-up-s-line" : "arrow-down-s-line";

  const handleToggleAll = useCallback(() => {
    if (allExpanded) {
      handleCollapseAll();
    } else {
      handleExpandAll();
    }
  }, [allExpanded, handleCollapseAll, handleExpandAll]);

  if (isLoading) {
    return (
      <Flex
        alignItems="center"
        height="100%"
        justifyContent="center"
        width="100%"
      >
        <Spinner size="md" />
      </Flex>
    );
  }

  if (showEmptyState) {
    return (
      <Flex alignItems="center" height="100%" justifyContent="center">
        <Flex
          alignItems="center"
          flexDirection="column"
          gap="spaces-4"
          justifyContent="center"
        >
          <Text kind="heading-m">
            {createMessage(DATASOURCE_USAGE_EMPTY_TITLE)}
          </Text>
          <EmptyState
            description={createMessage(DATASOURCE_USAGE_EMPTY_DESCRIPTION)}
            icon="search-line"
          />
        </Flex>
      </Flex>
    );
  }

  return (
    <UsageContainer>
      {applications.length ? (
        <Flex
          alignItems="center"
          flexWrap="wrap"
          gap="spaces-3"
          justifyContent="space-between"
        >
          <Flex style={{ flex: 1, minWidth: "50%" }}>
            <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
              {headerSummary}
            </Text>
          </Flex>
          <Button
            kind="tertiary"
            onClick={handleToggleAll}
            size="sm"
            startIcon={toggleAllIcon}
          >
            {toggleAllLabel}
          </Button>
        </Flex>
      ) : (
        <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
          {headerSummary}
        </Text>
      )}
      {applications.map((application) => {
        const sortedPages = (application.pages ?? []).slice().sort((a, b) => {
          const nameA = a.pageName ?? "";
          const nameB = b.pageName ?? "";

          return nameA.localeCompare(nameB);
        });

        const isCollapsed = collapsedApplications[application.applicationId];

        return (
          <ApplicationCard key={application.applicationId}>
            <Flex
              alignItems="center"
              aria-expanded={!isCollapsed}
              flexWrap="wrap"
              gap="spaces-3"
              justifyContent="space-between"
              onClick={() => handleToggleApplication(application.applicationId)}
              onKeyDown={(event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  handleToggleApplication(application.applicationId);
                }
              }}
              role="button"
              tabIndex={0}
            >
              <Flex alignItems="center" gap="spaces-2">
                <Icon
                  name={
                    isCollapsed ? "arrow-right-s-line" : "arrow-down-s-line"
                  }
                  size="md"
                />
                <Text kind="heading-s">{application.applicationName}</Text>
              </Flex>
              <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
                {createMessage(
                  DATASOURCE_USAGE_QUERY_COUNT,
                  application.queryCount ?? sortedPages.length,
                )}
              </Text>
            </Flex>
            {!isCollapsed ? (
              <>
                <Divider />
                {sortedPages.length ? (
                  sortedPages.map((page) => (
                    <PageUsageCard
                      applicationId={application.applicationId}
                      key={page.pageId}
                      page={page}
                    />
                  ))
                ) : (
                  <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
                    {createMessage(DATASOURCE_USAGE_NO_QUERIES)}
                  </Text>
                )}
              </>
            ) : null}
          </ApplicationCard>
        );
      })}
    </UsageContainer>
  );
};

export default WorkspaceDatasourceUsageSection;

const PageCard = styled.div`
  border: 1px solid var(--ads-v2-color-border-subtle);
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-4);
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
  background-color: var(--ads-v2-color-bg-subtle);
`;

const QueryList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: var(--ads-v2-spaces-2);
`;

const QueryPill = styled.span`
  background-color: var(--ads-v2-color-bg);
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-1) var(--ads-v2-spaces-2);
  font-size: var(--ads-v2-font-size-2);
  color: var(--ads-v2-color-fg);
`;

const StyledPageLink = styled(Link)`
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const QueryLink = styled(Link)`
  background-color: var(--ads-v2-color-bg);
  border-radius: var(--ads-v2-border-radius);
  padding: var(--ads-v2-spaces-1) var(--ads-v2-spaces-2);
  font-size: var(--ads-v2-font-size-2);
  color: var(--ads-v2-color-fg);
  text-decoration: none;

  &:hover {
    text-decoration: underline;
  }
`;

const buildPageEditorUrl = (
  applicationId?: string,
  pageId?: string,
): string | undefined => {
  if (!applicationId || !pageId) {
    return;
  }

  try {
    return generatePath(BUILDER_PATH_DEPRECATED, {
      baseApplicationId: applicationId,
      basePageId: pageId,
    });
  } catch (e) {
    return;
  }
};

const buildQueryEditorUrl = (
  applicationId?: string,
  pageId?: string,
  queryId?: string,
): string | undefined => {
  if (!applicationId || !pageId || !queryId) {
    return;
  }

  try {
    return generatePath(`${BUILDER_PATH_DEPRECATED}${QUERIES_EDITOR_ID_PATH}`, {
      baseApplicationId: applicationId,
      basePageId: pageId,
      baseQueryId: queryId,
    });
  } catch (e) {
    return;
  }
};

const PageUsageCard = ({
  applicationId,
  page,
}: {
  page: WorkspaceDatasourcePageUsage;
  applicationId: string;
}) => {
  const uniqueQueries = useMemo(() => {
    return [
      ...new Map(
        (page.queries ?? []).map((query) => [query.name ?? query.id, query]),
      ).values(),
    ];
  }, [page.queries]);

  const pageEditorUrl = useMemo(
    () => buildPageEditorUrl(applicationId, page.pageId),
    [applicationId, page.pageId],
  );

  return (
    <PageCard>
      <Flex
        alignItems="center"
        gap="spaces-2"
        justifyContent="space-between"
        wrap="wrap"
      >
        <Flex alignItems="center" gap="spaces-2">
          {pageEditorUrl ? (
            <Text kind="heading-xs">
              <StyledPageLink to={pageEditorUrl}>
                {page.pageName ?? "Unnamed page"}
              </StyledPageLink>
            </Text>
          ) : (
            <Text kind="heading-xs">{page.pageName ?? "Unnamed page"}</Text>
          )}
        </Flex>
        <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
          {createMessage(
            DATASOURCE_USAGE_QUERY_COUNT,
            page.queryCount ?? uniqueQueries.length,
          )}
        </Text>
      </Flex>
      {uniqueQueries.length ? (
        <QueryList>
          {uniqueQueries.map((query) => {
            const queryEditorUrl = buildQueryEditorUrl(
              applicationId,
              page.pageId,
              query.id,
            );

            if (queryEditorUrl) {
              return (
                <QueryLink key={query.id} to={queryEditorUrl}>
                  {query.name ?? query.id}
                </QueryLink>
              );
            }

            return (
              <QueryPill key={query.id}>{query.name ?? query.id}</QueryPill>
            );
          })}
        </QueryList>
      ) : (
        <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
          {createMessage(DATASOURCE_USAGE_NO_QUERIES)}
        </Text>
      )}
    </PageCard>
  );
};

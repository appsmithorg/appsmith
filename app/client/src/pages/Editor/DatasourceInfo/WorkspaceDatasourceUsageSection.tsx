import React, { useMemo } from "react";
import { EmptyState, Flex, Spinner, Text, Divider } from "@appsmith/ads";
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
  createMessage,
} from "ee/constants/messages";

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

  const headerSummary = useMemo(() => {
    if (totalQueryCount <= 0) {
      return undefined;
    }

    return createMessage(DATASOURCE_USAGE_QUERY_COUNT, totalQueryCount);
  }, [totalQueryCount]);

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
        <EmptyState
          description={createMessage(DATASOURCE_USAGE_EMPTY_DESCRIPTION)}
          icon="search-line"
          title={createMessage(DATASOURCE_USAGE_EMPTY_TITLE)}
        />
      </Flex>
    );
  }

  return (
    <UsageContainer>
      {headerSummary ? (
        <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
          {headerSummary}
        </Text>
      ) : null}
      {applications.map((application) => {
        const sortedPages = (application.pages ?? []).slice().sort((a, b) => {
          const nameA = a.pageName ?? "";
          const nameB = b.pageName ?? "";

          return nameA.localeCompare(nameB);
        });

        return (
          <ApplicationCard key={application.applicationId}>
            <Flex
              alignItems="center"
              gap="spaces-2"
              justifyContent="space-between"
              wrap="wrap"
            >
              <Text kind="heading-s">{application.applicationName}</Text>
              <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
                {createMessage(
                  DATASOURCE_USAGE_QUERY_COUNT,
                  application.queryCount ?? sortedPages.length,
                )}
              </Text>
            </Flex>
            <Divider />
            {sortedPages.length ? (
              sortedPages.map((page) => (
                <PageUsageCard key={page.pageId} page={page} />
              ))
            ) : (
              <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
                {createMessage(DATASOURCE_USAGE_NO_QUERIES)}
              </Text>
            )}
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

const PageUsageCard = ({ page }: { page: WorkspaceDatasourcePageUsage }) => {
  const uniqueQueries = useMemo(() => {
    return [
      ...new Map(
        (page.queries ?? []).map((query) => [query.name ?? query.id, query]),
      ).values(),
    ];
  }, [page.queries]);

  return (
    <PageCard>
      <Flex
        alignItems="center"
        gap="spaces-2"
        justifyContent="space-between"
        wrap="wrap"
      >
        <Flex alignItems="center" gap="spaces-2">
          <Text kind="heading-xs">{page.pageName ?? "Unnamed page"}</Text>
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
          {uniqueQueries.map((query) => (
            <QueryPill key={query.id}>{query.name ?? query.id}</QueryPill>
          ))}
        </QueryList>
      ) : (
        <Text color="var(--ads-v2-color-fg-subtle)" kind="body-s">
          {createMessage(DATASOURCE_USAGE_NO_QUERIES)}
        </Text>
      )}
    </PageCard>
  );
};

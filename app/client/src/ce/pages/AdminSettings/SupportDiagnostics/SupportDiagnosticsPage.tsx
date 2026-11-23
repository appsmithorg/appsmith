import React, { useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { Button, Callout, Spinner, Text } from "@appsmith/ads";
import { SUPPORT_DIAGNOSTICS, createMessage } from "ee/constants/messages";
import type { AdminConfigType } from "ee/pages/AdminSettings/config/types";
import { selectFeatureFlags } from "ee/selectors/featureFlagsSelectors";
import { isMultiOrgFFEnabled } from "ee/utils/planHelpers";
import {
  HeaderWrapper,
  SettingsFormWrapper,
  SettingsHeader,
  SettingsSubHeader,
  Wrapper,
} from "pages/AdminSettings/components";
import { getCurrentUser } from "selectors/usersSelectors";
import { DownloadPanel } from "./DownloadPanel";
import { SectionCard } from "./SectionCard";
import type { SectionId } from "./types";
import { SECTION_IDS } from "./types";
import type { CardState } from "./useDiagnosticsSections";
import { useDiagnosticsSections } from "./useDiagnosticsSections";

export const SUPPORT_DIAGNOSTICS_PAGE_TEST_ID = "t--support-diagnostics-page";

export interface SupportDiagnosticsPageProps {
  category: AdminConfigType;
}

const Toolbar = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
`;

const CardList = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-4);
  margin: var(--ads-v2-spaces-4) 0 var(--ads-v2-spaces-7);
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
`;

/** True while the card has no result yet and will get one. */
function isPending(card: CardState): boolean {
  return (
    card.collecting ||
    (card.result.status === "NOT_COLLECTED" &&
      !card.requestFailed &&
      !card.busy)
  );
}

function isCollectionFailure(card: CardState): boolean {
  return (
    card.requestFailed || card.busy || card.result.status === "UNAVAILABLE"
  );
}

function progressText(cards: Record<SectionId, CardState>): string {
  const all = SECTION_IDS.map((id) => cards[id]);
  const done = all.filter((card) => !isPending(card)).length;

  if (done < all.length) {
    return createMessage(SUPPORT_DIAGNOSTICS.progress, done, all.length);
  }

  const failed = all.filter(isCollectionFailure).length;

  if (failed === 0) return createMessage(SUPPORT_DIAGNOSTICS.progressDone);

  return `${createMessage(SUPPORT_DIAGNOSTICS.progressFinished)} ${createMessage(
    SUPPORT_DIAGNOSTICS.progressFailed,
    failed,
  )}`;
}

function PageContent() {
  const {
    cards,
    collect,
    collectorVersion,
    listError,
    loading,
    reload,
    setAllIncluded,
    setIncluded,
  } = useDiagnosticsSections();

  const handleCollect = useCallback(
    (id: SectionId) => {
      void collect(id);
    },
    [collect],
  );

  const selectAll = useCallback(() => setAllIncluded(true), [setAllIncluded]);
  const clearAll = useCallback(() => setAllIncluded(false), [setAllIncluded]);

  const sections = useMemo(
    () => SECTION_IDS.map((id) => cards[id].result),
    [cards],
  );
  const selected = useMemo(
    () => SECTION_IDS.filter((id) => cards[id].included),
    [cards],
  );
  const isCollecting = loading || selected.some((id) => isPending(cards[id]));
  const isReady = !loading && listError === "none";

  let body: React.ReactNode;

  if (loading) {
    body = (
      <Spinner
        aria-label={createMessage(SUPPORT_DIAGNOSTICS.loading)}
        role="status"
        size="lg"
      />
    );
  } else if (listError === "forbidden") {
    body = (
      <div role="alert">
        <Callout kind="warning">
          {createMessage(SUPPORT_DIAGNOSTICS.forbidden)}
        </Callout>
      </div>
    );
  } else if (listError === "failed") {
    body = (
      <div role="alert">
        <Callout kind="error">
          <Text kind="body-m">
            {createMessage(SUPPORT_DIAGNOSTICS.listFailed)}
          </Text>{" "}
          <Button
            data-testid="t--support-diagnostics-reload"
            kind="secondary"
            onClick={reload}
            size="sm"
          >
            {createMessage(SUPPORT_DIAGNOSTICS.retry)}
          </Button>
        </Callout>
      </div>
    );
  } else {
    body = (
      <>
        <Toolbar>
          <Button
            data-testid="t--support-diagnostics-select-all"
            kind="secondary"
            onClick={selectAll}
            size="sm"
          >
            {createMessage(SUPPORT_DIAGNOSTICS.selectAll)}
          </Button>
          <Button
            data-testid="t--support-diagnostics-clear-all"
            kind="secondary"
            onClick={clearAll}
            size="sm"
          >
            {createMessage(SUPPORT_DIAGNOSTICS.clearAll)}
          </Button>
        </Toolbar>
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          {createMessage(SUPPORT_DIAGNOSTICS.excludedHelp)}
        </Text>
        <CardList>
          {SECTION_IDS.map((id) => (
            <SectionCard
              card={cards[id]}
              isListLoading={loading}
              key={id}
              onCollect={handleCollect}
              onIncludedChange={setIncluded}
              sectionId={id}
            />
          ))}
        </CardList>
        <DownloadPanel
          collectorVersion={collectorVersion}
          isCollecting={isCollecting}
          sections={sections}
          selected={selected}
        />
      </>
    );
  }

  return (
    <Wrapper data-testid={SUPPORT_DIAGNOSTICS_PAGE_TEST_ID}>
      <SettingsFormWrapper>
        <HeaderWrapper>
          <SettingsHeader
            color="var(--ads-v2-color-fg-emphasis-plus)"
            kind="heading-l"
            renderAs="h1"
          >
            {createMessage(SUPPORT_DIAGNOSTICS.title)}
          </SettingsHeader>
          <SettingsSubHeader kind="body-m" renderAs="p">
            {createMessage(SUPPORT_DIAGNOSTICS.subText)}
          </SettingsSubHeader>
        </HeaderWrapper>
        <Body>
          {/* Always rendered, so screen readers announce each change. */}
          <div
            aria-live="polite"
            data-testid="t--support-diagnostics-progress"
            role="status"
          >
            {isReady && <Text kind="body-m">{progressText(cards)}</Text>}
          </div>
          {body}
        </Body>
      </SettingsFormWrapper>
    </Wrapper>
  );
}

/**
 * Admin Settings → Support. Renders nothing unless the user is an instance
 * administrator on a single-organization instance; the server enforces the
 * same rule. The admin settings router passes `category`; the page does not
 * read it.
 */
export function SupportDiagnosticsPage(
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  props: SupportDiagnosticsPageProps,
): JSX.Element | null {
  const user = useSelector(getCurrentUser);
  const featureFlags = useSelector(selectFeatureFlags);

  if (user?.isSuperUser !== true || isMultiOrgFFEnabled(featureFlags)) {
    return null;
  }

  return <PageContent />;
}

export default SupportDiagnosticsPage;

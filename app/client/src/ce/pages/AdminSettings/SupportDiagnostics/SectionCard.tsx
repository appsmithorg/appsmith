import React, { useCallback, useEffect, useState } from "react";
import moment from "moment";
import styled from "styled-components";
import {
  Button,
  Checkbox,
  Collapsible,
  CollapsibleContent,
  CollapsibleHeader,
  Tag,
  Text,
} from "@appsmith/ads";
import type { TagKind } from "@appsmith/ads";
import { objectKeys } from "@appsmith/utils";
import { SUPPORT_DIAGNOSTICS, createMessage } from "ee/constants/messages";
import { instanceBrowserFields } from "./buildReport";
import { RAW_KEY_MAPS, formatValue, labelFor } from "./formatValue";
import type { DisplayValue } from "./formatValue";
import type { SectionId } from "./types";
import type { CardState } from "./useDiagnosticsSections";

const LICENSE_UNKNOWN = "license_unknown";
const TIMEOUT = "timeout";
const RELATIVE_TIME_REFRESH_MS = 60_000;

const Card = styled.section<{ $muted: boolean }>`
  display: flex;
  flex-direction: column;
  gap: var(--ads-v2-spaces-3);
  padding: var(--ads-v2-spaces-5);
  border: 1px solid var(--ads-v2-color-border);
  border-radius: var(--ads-v2-border-radius);
  background: ${({ $muted }) =>
    $muted ? "var(--ads-v2-color-bg-subtle)" : "var(--ads-v2-color-bg)"};
  color: ${({ $muted }) =>
    $muted ? "var(--ads-v2-color-fg-muted)" : "var(--ads-v2-color-fg)"};
`;

const CardHeader = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: var(--ads-v2-spaces-3);
`;

const CardActions = styled.div`
  display: flex;
  align-items: center;
  gap: var(--ads-v2-spaces-3);
`;

const SectionHeader = styled(CollapsibleHeader)`
  padding: 0;
`;

const HeadingButton = styled.button`
  padding: 0;
  border: none;
  background: none;
  color: inherit;
  font: inherit;
  text-align: left;
  cursor: pointer;

  &:focus-visible {
    outline: var(--ads-v2-border-width-outline) solid
      var(--ads-v2-color-outline);
    outline-offset: var(--ads-v2-offset-outline);
  }
`;

const StatusRow = styled.div`
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ads-v2-spaces-2);
`;

const TagRow = styled.div`
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--ads-v2-spaces-2);
`;

const DetailList = styled.dl`
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 2fr);
  gap: var(--ads-v2-spaces-2) var(--ads-v2-spaces-4);
  margin: 0;
  overflow-wrap: anywhere;

  dt,
  dd {
    margin: 0;
  }
`;

/** The relative time, with the absolute UTC time on hover. */
function CollectedTime({ iso }: { iso: string }) {
  const [, setTick] = useState(0);
  const date = new Date(iso);

  // Re-render each minute, so an idle page keeps the relative time current.
  useEffect(function refreshEachMinute() {
    const handle = window.setInterval(
      () => setTick((tick) => tick + 1),
      RELATIVE_TIME_REFRESH_MS,
    );

    return () => window.clearInterval(handle);
  }, []);

  if (Number.isNaN(date.getTime())) return <span>{iso}</span>;

  return (
    <time dateTime={iso} title={`${date.toISOString()} (UTC)`}>
      {moment(date).fromNow()}
    </time>
  );
}

function DisplayValueView({ value }: { value: DisplayValue }) {
  if (value.kind === "text") return <span>{value.text}</span>;

  return (
    <DetailList>
      {value.entries.map(([label, inner]) => (
        <React.Fragment key={label}>
          <dt>{label}</dt>
          <dd>
            <DisplayValueView value={inner} />
          </dd>
        </React.Fragment>
      ))}
    </DetailList>
  );
}

function SectionData({
  data,
  sectionId,
}: {
  data: Record<string, unknown>;
  sectionId: SectionId;
}) {
  const shown =
    sectionId === "INSTANCE"
      ? { ...data, ...instanceBrowserFields(data, window.location.origin) }
      : data;

  return (
    <DetailList>
      {objectKeys(shown).map((key) => (
        <React.Fragment key={key}>
          <dt>
            <Text color="var(--ads-v2-color-fg-muted)" kind="body-m">
              {labelFor(key)}
            </Text>
          </dt>
          <dd
            data-testid={
              sectionId === "INSTANCE" && key === "instanceUrl"
                ? "t--support-diagnostics-instance-url"
                : undefined
            }
          >
            <DisplayValueView
              value={formatValue(shown[key], RAW_KEY_MAPS.has(key))}
            />
          </dd>
        </React.Fragment>
      ))}
    </DetailList>
  );
}

/** True when the card shows a failure, so its action is Retry. */
export function isFailedCard(card: CardState): boolean {
  const { status } = card.result;

  return (
    card.busy ||
    card.requestFailed ||
    status === "UNAVAILABLE" ||
    status === "UNKNOWN"
  );
}

/** True when the ZIP holds only a failure record for this card. */
function exportsFailureRecord(card: CardState): boolean {
  const { status } = card.result;

  if (status === "UNAVAILABLE") return true;

  return (card.busy || card.requestFailed) && status !== "OK";
}

type MessageFn = () => string;

interface CardStatusCopy {
  tag: MessageFn;
  kind: TagKind;
  /** The full sentence shown under the tag, when there is one. */
  detail?: MessageFn;
}

const TAGS = SUPPORT_DIAGNOSTICS.statusTags;

/**
 * The ads `Tag` styles a `warning` kind, but its `TagKind` type leaves it out.
 */
const WARNING_TAG = "warning" as unknown as TagKind;

function cardStatusCopy(card: CardState): CardStatusCopy {
  const { errorCode, status } = card.result;

  if (card.collecting) return { tag: TAGS.collecting, kind: "neutral" };

  if (card.busy) {
    return {
      tag: TAGS.busy,
      kind: WARNING_TAG,
      detail: SUPPORT_DIAGNOSTICS.busy,
    };
  }

  if (card.requestFailed) {
    return {
      tag: TAGS.failed,
      kind: WARNING_TAG,
      detail: SUPPORT_DIAGNOSTICS.failed,
    };
  }

  switch (status) {
    case "OK":
      return { tag: TAGS.collected, kind: "info" };
    case "NOT_SUPPORTED":
      return {
        tag: TAGS.notSupported,
        kind: "neutral",
        detail: SUPPORT_DIAGNOSTICS.notSupported,
      };
    case "NOT_LICENSED":
      return {
        tag: TAGS.notLicensed,
        kind: "neutral",
        detail: SUPPORT_DIAGNOSTICS.notLicensed,
      };
    case "UNKNOWN":
      return {
        tag: TAGS.unknown,
        kind: WARNING_TAG,
        detail:
          errorCode === LICENSE_UNKNOWN
            ? SUPPORT_DIAGNOSTICS.licenseUnknown
            : SUPPORT_DIAGNOSTICS.unknown,
      };
    case "UNAVAILABLE":
      return errorCode === TIMEOUT
        ? {
            tag: TAGS.timedOut,
            kind: WARNING_TAG,
            detail: SUPPORT_DIAGNOSTICS.timeout,
          }
        : {
            tag: TAGS.failed,
            kind: WARNING_TAG,
            detail: SUPPORT_DIAGNOSTICS.failed,
          };
    default:
      return { tag: TAGS.waiting, kind: "neutral" };
  }
}

function CardStatus({ card }: { card: CardState }) {
  const copy = cardStatusCopy(card);
  const { collectedAt, status } = card.result;
  const showTime = !card.collecting && status === "OK" && collectedAt;

  return (
    <StatusRow>
      <TagRow>
        <Tag isClosable={false} kind={copy.kind}>
          {createMessage(copy.tag)}
        </Tag>
        {showTime && (
          <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
            <CollectedTime iso={collectedAt} />
          </Text>
        )}
      </TagRow>
      {copy.detail && (
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          {createMessage(copy.detail)}
        </Text>
      )}
      {exportsFailureRecord(card) && (
        <Text color="var(--ads-v2-color-fg-muted)" kind="body-s">
          {createMessage(SUPPORT_DIAGNOSTICS.failedExport)}
        </Text>
      )}
    </StatusRow>
  );
}

interface SectionCardProps {
  sectionId: SectionId;
  card: CardState;
  /** True while the section list loads; the action waits for it. */
  isListLoading: boolean;
  onCollect: (id: SectionId) => void;
  onIncludedChange: (id: SectionId, included: boolean) => void;
}

export function SectionCard(props: SectionCardProps) {
  const { card, isListLoading, onCollect, onIncludedChange, sectionId } = props;
  // Collapsed by default; the status in the header is enough to scan.
  const [isOpen, setIsOpen] = useState(false);
  const title = createMessage(SUPPORT_DIAGNOSTICS.sectionTitles[sectionId]);
  const failed = isFailedCard(card);
  const contentId = `t--support-diagnostics-content-${sectionId}`;
  const { data, status } = card.result;

  const handleCollect = useCallback(() => {
    onCollect(sectionId);
  }, [onCollect, sectionId]);

  const handleIncludedChange = useCallback(
    (included: boolean) => {
      onIncludedChange(sectionId, included);
    },
    [onIncludedChange, sectionId],
  );

  return (
    <Card
      $muted={!card.included}
      data-testid={`t--support-diagnostics-card-${sectionId}`}
    >
      <Collapsible isOpen={isOpen} onOpenChange={setIsOpen}>
        <CardHeader>
          {/* The header toggles on click; the native button inside gives
              keyboard users the same toggle and announces the state. */}
          <SectionHeader arrowPosition="start">
            <Text kind="heading-s" renderAs="h2">
              <HeadingButton
                aria-controls={contentId}
                aria-expanded={isOpen}
                type="button"
              >
                {title}
              </HeadingButton>
            </Text>
          </SectionHeader>
          <CardActions>
            <Checkbox
              aria-label={createMessage(SUPPORT_DIAGNOSTICS.include, title)}
              data-testid={`t--support-diagnostics-include-${sectionId}`}
              isSelected={card.included}
              onChange={handleIncludedChange}
            >
              {createMessage(SUPPORT_DIAGNOSTICS.includeShort)}
            </Checkbox>
            {/* One button that never unmounts, so focus stays on it. */}
            <Button
              aria-label={createMessage(
                failed
                  ? SUPPORT_DIAGNOSTICS.retrySection
                  : SUPPORT_DIAGNOSTICS.refreshSection,
                title,
              )}
              data-testid={
                failed
                  ? `t--support-diagnostics-retry-${sectionId}`
                  : `t--support-diagnostics-refresh-${sectionId}`
              }
              isDisabled={card.collecting || isListLoading}
              kind="secondary"
              onClick={handleCollect}
              size="sm"
              startIcon="refresh"
            >
              {createMessage(
                failed
                  ? SUPPORT_DIAGNOSTICS.retry
                  : SUPPORT_DIAGNOSTICS.refresh,
              )}
            </Button>
          </CardActions>
        </CardHeader>
        <CardStatus card={card} />
        <CollapsibleContent>
          <div id={contentId}>
            {status === "OK" && data && (
              <SectionData data={data} sectionId={sectionId} />
            )}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

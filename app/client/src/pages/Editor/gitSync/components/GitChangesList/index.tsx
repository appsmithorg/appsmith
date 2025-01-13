import React from "react";
import styled from "styled-components";
import { useSelector } from "react-redux";
import {
  getGitStatus,
  getIsFetchingGitStatus,
} from "selectors/gitSyncSelectors";
import { Callout } from "@appsmith/ads";
import { ExpandableChange, ExpandableChangeKind } from "./ExpandableChange";
import StaticChange, { StaticChangeKind } from "./StaticChange";
import PageChanges from "./PageChanges";

const CalloutContainer = styled.div`
  margin-top: 16px;
`;

const SkeletonLoader = styled.div`
  width: 50%;
  height: 18px;
  background: linear-gradient(
    90deg,
    var(--ads-v2-color-black-75) 0%,
    rgba(240, 240, 240, 0) 100%
  );
  margin-top: 16px;
  margin-bottom: 16px;
`;

export default function GitChangesList() {
  const status = useSelector(getGitStatus);
  const statusLoading = useSelector(getIsFetchingGitStatus);

  if (statusLoading) {
    return <SkeletonLoader data-testid="t--status-change-skeleton-loading" />;
  }

  if (!status) {
    return null;
  }

  return (
    <div className="my-4 space-y-2" data-testid={"t--git-status-changes"}>
      <StaticChange kind={StaticChangeKind.REMOTE_BEHIND} status={status} />
      <StaticChange kind={StaticChangeKind.REMOTE_AHEAD} status={status} />
      <PageChanges status={status} />
      <ExpandableChange
        kind={ExpandableChangeKind.DATASOURCES}
        status={status}
      />
      <ExpandableChange kind={ExpandableChangeKind.JSLIBS} status={status} />
      <StaticChange kind={StaticChangeKind.SETTINGS} status={status} />
      <StaticChange kind={StaticChangeKind.THEME} status={status} />
      <StaticChange kind={StaticChangeKind.MODULES} status={status} />
      {status?.migrationMessage ? (
        <CalloutContainer>
          <Callout kind="info">{status.migrationMessage}</Callout>
        </CalloutContainer>
      ) : null}
    </div>
  );
}

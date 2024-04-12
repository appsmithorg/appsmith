import React from "react";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { useSelector } from "react-redux";
import {
  getGitStatus,
  getIsFetchingGitStatus,
} from "selectors/gitSyncSelectors";
import { Callout } from "design-system";
import { ExpandableChange, ExpandableChangeKind } from "./ExpandableChange";
import StaticChage, { StaticChangeKind } from "./StaticChange";
import PageChanges from "./PageChanges";

const CalloutContainer = styled.div`
  margin-top: 16px;
`;

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

export default function NewChangesList() {
  const status = useSelector(getGitStatus);
  const statusLoading = useSelector(getIsFetchingGitStatus);

  if (statusLoading) {
    return <DummyChange data-testid="t--status-change-skeleton-loading" />;
  }

  if (!status) {
    return null;
  }

  return (
    <div className="my-4 space-y-2" data-testid={"t--git-status-changes"}>
      <StaticChage kind={StaticChangeKind.REMOTE_BEHIND} status={status} />
      <StaticChage kind={StaticChangeKind.REMOTE_AHEAD} status={status} />
      <PageChanges status={status} />
      <ExpandableChange
        kind={ExpandableChangeKind.DATASOURCES}
        status={status}
      />
      <ExpandableChange kind={ExpandableChangeKind.JSLIBS} status={status} />
      <StaticChage kind={StaticChangeKind.SETTINGS} status={status} />
      <StaticChage kind={StaticChangeKind.THEME} status={status} />
      <StaticChage kind={StaticChangeKind.PACKAGES} status={status} />
      <StaticChage kind={StaticChangeKind.MODULES} status={status} />
      {status?.migrationMessage ? (
        <CalloutContainer>
          <Callout kind="info">{status.migrationMessage}</Callout>
        </CalloutContainer>
      ) : null}
    </div>
  );
}

import React, { useState } from "react";
import styled from "styled-components";
import { RunHistoryList } from "./RunHistoryList";
import { Divider } from "design-system";
import { useSelector } from "react-redux";
import { getCurrentWorkflowId } from "@appsmith/selectors/workflowSelectors";
import { RunHistoryDetailsList } from "./RunHistoryDetailsList";

const Container = styled.div`
  display: flex;
  flex-direction: row;
  height: 100%;
`;

const HistoryTabContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 270px;
  overflow: hidden;
`;

const HistoryDetailsTabContainer = styled.div`
  height: 100%;
  overflow: hidden;
  padding: 8px;
  padding-right: 0px;
  flex-grow: 1;
`;

export function RunHistoryTab() {
  const [selectedRunId, setSelectedRunId] = useState<string>("default");
  const workflowId = useSelector(getCurrentWorkflowId);
  return (
    <Container>
      <HistoryTabContainer>
        <RunHistoryList
          selectedRunId={selectedRunId}
          setSelectedRunId={setSelectedRunId}
          workflowId={workflowId || ""}
        />
      </HistoryTabContainer>
      <Divider className="!block mb-[2px]" orientation="vertical" />
      <HistoryDetailsTabContainer>
        <RunHistoryDetailsList
          selectedRunId={selectedRunId}
          workflowId={workflowId || ""}
        />
      </HistoryDetailsTabContainer>
    </Container>
  );
}

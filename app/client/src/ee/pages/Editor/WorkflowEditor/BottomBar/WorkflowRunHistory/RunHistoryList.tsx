import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  getRunHistoryData,
  getRunHistoryLoadingState,
} from "@appsmith/selectors/workflowRunHistorySelectors";
import { SegmentedControl } from "design-system";
import styled from "styled-components";
import { fetchWorkflowRunHistory } from "@appsmith/actions/workflowRunHistoryActions";
import { RunHistoryListItem } from "./RunHistoryListItem";
import { HistoryStateFilterStates } from "./helpers";

const RunHistoryListContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  gap: 4px;
  flex-grow: 1;
`;

const StyledSegmentedControl = styled(SegmentedControl)`
  margin: 8px;
  width: 250px;
`;

interface RunHistoryListProps {
  selectedRunId: string;
  setSelectedRunId: (runId: string) => void;
  workflowId: string;
}

export function RunHistoryList({
  selectedRunId,
  setSelectedRunId,
  workflowId,
}: RunHistoryListProps) {
  const dispatch = useDispatch();
  const isLoading = useSelector(getRunHistoryLoadingState);
  const data = useSelector(getRunHistoryData);
  const [selectedFilter, setSelectedFilter] = useState(
    HistoryStateFilterStates.ALL_RUNS,
  );
  useEffect(() => {
    dispatch(fetchWorkflowRunHistory(workflowId, selectedFilter));
  }, [dispatch, selectedFilter]);
  useEffect(() => {
    if (data.length) {
      setSelectedRunId(data[0].workflowRunId);
    }
  }, [data, setSelectedRunId]);
  return (
    <>
      <StyledSegmentedControl
        aria-disabled={isLoading}
        onChange={(value) => {
          if (isLoading) return;
          setSelectedFilter(value);
        }}
        options={[
          {
            label: "All Runs",
            value: HistoryStateFilterStates.ALL_RUNS,
          },
          {
            label: "Failed Runs",
            value: HistoryStateFilterStates.FAILED_RUNS,
          },
        ]}
        value={selectedFilter}
      />
      {isLoading ? (
        <div>Loading...</div>
      ) : (
        <RunHistoryListContainer>
          {data.map((run) => (
            <RunHistoryListItem
              data={run}
              key={run.workflowRunId}
              onClick={() => setSelectedRunId(run.workflowRunId)}
              selected={run.workflowRunId === selectedRunId}
            />
          ))}
        </RunHistoryListContainer>
      )}
    </>
  );
}

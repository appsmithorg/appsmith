import React, { useEffect } from "react";
import type { AppState } from "@appsmith/reducers";
import {
  getRunHistoryDetailsData,
  getRunHistoryDetailsLoadingState,
} from "@appsmith/selectors/workflowRunHistorySelectors";
import { useDispatch, useSelector } from "react-redux";
import { Text } from "design-system";
import { fetchWorkflowRunHistoryDetails } from "@appsmith/actions/workflowRunHistoryActions";
import { RunHistoryDetailsListItem } from "./RunHistoryDetailsListItem";
import styled from "styled-components";

interface RunHistoryDetailsProps {
  workflowId: string;
  selectedRunId: string;
}

const RunHistoryDetailsListContainer = styled.div`
  display: flex;
  flex-direction: column;
  overflow-y: scroll;
  gap: 4px;
  height: 100%;
`;

export function RunHistoryDetailsList({
  selectedRunId,
  workflowId,
}: RunHistoryDetailsProps) {
  const dispatch = useDispatch();
  const isLoading = useSelector(getRunHistoryDetailsLoadingState);
  const data = useSelector((state: AppState) =>
    getRunHistoryDetailsData(state, selectedRunId),
  );

  useEffect(() => {
    if (selectedRunId === "default") return;
    dispatch(fetchWorkflowRunHistoryDetails(workflowId, selectedRunId));
  }, [dispatch, workflowId, selectedRunId]);

  return isLoading ? (
    <Text>Loading...</Text>
  ) : (
    <RunHistoryDetailsListContainer>
      {data && data.length > 0
        ? data.map((item) => (
            <RunHistoryDetailsListItem data={item} key={item.activityId} />
          ))
        : null}
    </RunHistoryDetailsListContainer>
  );
}

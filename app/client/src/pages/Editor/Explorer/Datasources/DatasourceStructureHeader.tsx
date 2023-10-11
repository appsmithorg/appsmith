import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Icon, Text } from "design-system";
import styled from "styled-components";
import { refreshDatasourceStructure } from "actions/datasourceActions";
import { SCHEMA_LABEL, createMessage } from "@appsmith/constants/messages";
import { DatasourceStructureContext } from "./DatasourceStructure";

type Props = {
  datasourceId: string;
  onRefreshCallback?: () => void;
};

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
`;

export default function DatasourceStructureHeader(props: Props) {
  const dispatch = useDispatch();

  const dispatchRefresh = useCallback(
    (event: React.MouseEvent<HTMLDivElement, MouseEvent>) => {
      event.stopPropagation();
      dispatch(
        refreshDatasourceStructure(
          props.datasourceId,
          DatasourceStructureContext.QUERY_EDITOR,
        ),
      );

      !!props.onRefreshCallback && props.onRefreshCallback();
    },
    [dispatch, props.datasourceId],
  );

  return (
    <HeaderWrapper className="datasourceStructure-header">
      <Text kind="heading-xs" renderAs="h3">
        {createMessage(SCHEMA_LABEL)}
      </Text>
      <div
        className="datasourceStructure-refresh"
        onClick={(event) => dispatchRefresh(event)}
      >
        <Icon name="refresh" size={"md"} />
      </div>
    </HeaderWrapper>
  );
}

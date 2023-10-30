import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Button, Text } from "design-system";
import styled from "styled-components";
import { refreshDatasourceStructure } from "actions/datasourceActions";
import { SCHEMA_LABEL, createMessage } from "@appsmith/constants/messages";
import { DatasourceStructureContext } from "entities/Datasource";

interface Props {
  datasourceId: string;
  onRefreshCallback?: () => void;
  paddingBottom?: boolean;
}

const HeaderWrapper = styled.div<{ paddingBottom: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  ${(props) => props.paddingBottom && "padding-bottom: var(--ads-v2-spaces-4);"}
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
    <HeaderWrapper
      className="datasourceStructure-header"
      paddingBottom={!!props.paddingBottom}
    >
      <Text kind="heading-xs" renderAs="h3">
        {createMessage(SCHEMA_LABEL)}
      </Text>
      <Button
        className="datasourceStructure-refresh"
        isIconButton
        kind="tertiary"
        onClick={(event: any) => dispatchRefresh(event)}
        size="md"
        startIcon="refresh"
      />
    </HeaderWrapper>
  );
}

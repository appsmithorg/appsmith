import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Icon, Text } from "design-system";
import styled from "styled-components";
import { refreshDatasourceStructure } from "actions/datasourceActions";
import { SCHEMA_LABEL, createMessage } from "@appsmith/constants/messages";
import { DatasourceStructureContext } from "./DatasourceStructureContainer";

type Props = {
  datasourceId: string;
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
    },
    [dispatch, props.datasourceId],
  );

  return (
    <HeaderWrapper>
      <Text kind="heading-xs" renderAs="h3">
        {createMessage(SCHEMA_LABEL)}
      </Text>
      <div onClick={(event) => dispatchRefresh(event)}>
        <Icon name="refresh" size={"md"} />
      </div>
    </HeaderWrapper>
  );
}

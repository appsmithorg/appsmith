import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Icon, Text } from "design-system";
import styled from "styled-components";
import { refreshDatasourceStructure } from "actions/datasourceActions";
import { SCHEMA_LABEL, createMessage } from "@appsmith/constants/messages";

type Props = {
  datasourceId: string;
};

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;
  margin-bottom: 0.5rem;
`;

const IconWrapper = styled.div`
  margin-left: 1rem;
`;

export default function DatasourceStructureHeader(props: Props) {
  const dispatch = useDispatch();

  const dispatchRefresh = useCallback(() => {
    dispatch(refreshDatasourceStructure(props.datasourceId));
  }, [dispatch, props.datasourceId]);

  return (
    <HeaderWrapper>
      <Text kind="heading-s" renderAs="h3">
        {createMessage(SCHEMA_LABEL)}
      </Text>
      <IconWrapper onClick={dispatchRefresh}>
        <Icon name="refresh" size={"md"} />
      </IconWrapper>
    </HeaderWrapper>
  );
}

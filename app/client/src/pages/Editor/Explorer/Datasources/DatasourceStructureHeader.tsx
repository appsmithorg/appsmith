import React, { useCallback } from "react";
import { useDispatch } from "react-redux";
import { Icon, Text } from "design-system";
import styled from "styled-components";
import { refreshDatasourceStructure } from "actions/datasourceActions";

type Props = {
  datasourceId: string;
};

const HeaderWrapper = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 0.5rem;
`;

export default function DatasourceStructureHeader(props: Props) {
  const dispatch = useDispatch();

  const dispatchRefresh = useCallback(() => {
    dispatch(refreshDatasourceStructure(props.datasourceId));
  }, [dispatch, props.datasourceId]);

  return (
    <HeaderWrapper>
      <Text kind="heading-s" renderAs="h3">
        {" "}
        Schema{" "}
      </Text>
      <div onClick={dispatchRefresh}>
        <Icon name="refresh" size={"md"} />
      </div>
    </HeaderWrapper>
  );
}

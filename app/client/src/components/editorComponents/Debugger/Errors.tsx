import React from "react";
import { useSelector } from "react-redux";
import styled from "styled-components";
import { getDebuggerErrors } from "selectors/debuggerSelectors";
import LogItem, { getLogItemProps } from "./LogItem";

const ContainerWrapper = styled.div`
  overflow: hidden;
  height: 100%;
`;

const ListWrapper = styled.div`
  overflow: auto;
  height: 100%;
`;

const Errors = () => {
  const errors = useSelector(getDebuggerErrors);

  return (
    <ContainerWrapper>
      <ListWrapper className="debugger-list">
        {Object.values(errors).map((e, index) => {
          const logItemProps = getLogItemProps(e);

          return <LogItem key={`debugger-${index}`} {...logItemProps} />;
        })}
      </ListWrapper>
    </ContainerWrapper>
  );
};

export default Errors;

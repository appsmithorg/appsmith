import styled from "styled-components";

export default styled.div`
  height: ${(props) => `calc(100vh - ${props.theme.smallHeaderHeight})`};
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  position: absolute;
`;

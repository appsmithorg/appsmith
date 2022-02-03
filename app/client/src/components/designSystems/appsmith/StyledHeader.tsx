import styled from "styled-components";

export default styled.header`
  display: flex;
  width: 100%;
  justify-content: space-around;
  align-items: center;
  height: ${(props) => props.theme.headerHeight};
  padding: 0px 30px;
  padding-left: 24px;
  box-shadow: 0px 0px 3px #ccc;
  background: #fff;
  font-size: ${(props) => props.theme.fontSizes[1]}px;
`;

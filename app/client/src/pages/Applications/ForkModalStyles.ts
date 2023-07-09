import styled from "styled-components";

const ButtonWrapper = styled.div`
  display: flex;
  margin-top: ${(props) => props.theme.spaces[11]}px;
  gap: ${(props) => props.theme.spaces[4]}px;
  justify-content: flex-end;
`;

const SpinnerWrapper = styled.div`
  display: flex;
  justify-content: center;
`;

export { ButtonWrapper, SpinnerWrapper };

import styled, { css } from "styled-components";

type DisablerProps = {
  isDisabled?: boolean;
};

const disable = css`
  &,
  & > * {
    opacity: 0.5;
    cursor: not-allowed;
    pointer-events: none;
  }
`;

const Disabler = styled.div<DisablerProps>`
  ${({ isDisabled }) => isDisabled && disable}
`;

export default Disabler;

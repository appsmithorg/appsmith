import styled from "styled-components";

export const IconContainer = styled.span<{
  size: string;
  color?: string;
  withWrapper?: boolean;
  wrapperColor?: string;
}>`
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: ${({ size }) => (size ? size : "inherit")};
  color: ${({ color }) => (color ? color : "inherit")};

  ${(props) =>
    props.withWrapper &&
    `
    min-width: ${parseInt(props.size) * 2}px;
    height: ${parseInt(props.size) * 2}px;
    border-radius: 9999px;
    background-color: ${props.wrapperColor || "rgba(0, 0, 0, 0.1)"};
  `}

  & svg {
    width: ${({ size }) => (size ? size : "inherit")};
    height: ${({ size }) => (size ? size : "inherit")};
    fill: ${({ color }) => (color ? color : "currentColor")};
  }
`;

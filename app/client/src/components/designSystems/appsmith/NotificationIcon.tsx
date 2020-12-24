import styled from "styled-components";
import { hexToRgb } from "utils/AppsmithUtils";

export default styled.span<{
  animate?: boolean;
  width?: number;
  height?: number;
  color?: string;
}>`
  &&& {
    display: block;
    width: ${(props) => props.width || 8}px;
    height: ${(props) => props.height || 8}px;
    border-radius: 50%;
    background: ${(props) => props.color || props.theme.colors.notification};
    cursor: pointer;
    box-shadow: 0 0 0
      rgba(
        ${(props) => {
          const rgb = hexToRgb(props.color || props.theme.colors.notification);
          return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
        }},
        0.4
      );
    animation: ${(props) => (!!props.animate ? "pulse 2s infinite" : "")};

    &:hover {
      animation: none;
    }

    @keyframes pulse {
      0% {
        box-shadow: 0 0 0 0
          rgba(
            ${(props) => {
              const rgb = hexToRgb(
                props.color || props.theme.colors.notification,
              );
              return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
            }},
            0.4
          );
      }
      70% {
        box-shadow: 0 0 0 15px
          rgba(
            ${(props) => {
              const rgb = hexToRgb(
                props.color || props.theme.colors.notification,
              );
              return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
            }},
            0
          );
      }
      100% {
        box-shadow: 0 0 0 0
          rgba(
            ${(props) => {
              const rgb = hexToRgb(
                props.color || props.theme.colors.notification,
              );
              return `${rgb.r}, ${rgb.g}, ${rgb.b}`;
            }},
            0
          );
      }
    }
  }
`;

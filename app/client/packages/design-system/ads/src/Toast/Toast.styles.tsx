import styled, { css } from "styled-components";
import { ToastContainer } from "react-toastify";
import { Text } from "../Text";
import type { ToastProps } from "./Toast.types";
import { Button } from "../Button";
import { ToastClassName, ToastbodyClassName } from "./Toast.constants";

const Variables = css`
  // All the --toastify prefixed variables are changing tokens defined in react-toastify
  // For a complete list, see https://fkhadra.github.io/react-toastify/how-to-style/#override-css-variables

  --toastify-toast-width: 320px;
  --toastify-toast-background: var(--ads-v2-colors-response-surface-default-bg);
  --toastify-toast-min-height: 2.5rem;
  --toastify-toast-max-height: 800px;
  --toastify-font-family: var(--ads-v2-font-family);
  --toastify-z-index: 9999;

  --toastify-text-color-light: var(--ads-v2-colors-response-label-default-fg);
`;

export const StyledToast = styled(ToastContainer).attrs<ToastProps>({
  toastClassName: ToastClassName,
  bodyClassName: ToastbodyClassName,
})`
  .${ToastClassName} {
    border: solid 1px var(--ads-v2-color-border);
    padding: var(--ads-v2-spaces-3);
  }

  .${ToastbodyClassName} {
    padding: 0;
    gap: var(--ads-v2-spaces-3);
    align-items: center;
  }

  .Toastify__toast {
    // TODO: Move box-shadow to theme once https://www.notion.so/appsmith/Box-shadows-enumerate-name-and-document-29c2d8490b4c4a42b4f381d82e761b87 is complete
    box-shadow:
      0 1.9px 7px 0 rgba(42, 42, 42, 0.01),
      0 15px 56px 0 rgba(42, 42, 42, 0.07);
  }

  .Toastify__toast-icon {
    align-self: center;
    width: fit-content;
    margin-right: 0;
  }

  ${Variables}
`;

export const ToastBody = styled(Text)`
  padding: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  color: var(--ads-v2-colors-response-label-default-fg);
  gap: var(--ads-v2-spaces-3);
  word-break: break-word;
`;

export const StyledButton = styled(Button)`
  align-self: center;
`;

export const StyledPre = styled.pre`
  font: inherit;
`;
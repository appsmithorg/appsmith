import styled, { css } from "styled-components";

const Variables = css`
  --divider-thickness: 1px;
  --divider-length: 100%;
`;

export const StyledDivider = styled.span<{
  orientation: "horizontal" | "vertical";
}>`
  ${Variables};

  ${(props) =>
    props.orientation === "horizontal"
      ? "border-top: var(--divider-thickness) solid var(--ads-v2-colors-content-surface-default-border); width: var(--divider-length);"
      : "border-left: var(--divider-thickness) solid var(--ads-v2-colors-content-surface-default-border); height: var(--divider-length);"}

  display: inline-block;
`;

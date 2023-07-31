import * as React from "react";
import styled from "styled-components";
import { CopyLink } from "./CopyLink";

import type { Token } from "@design-system/theming";
import type { ReactNode } from "react";

export const StyledLinePreview = styled.div`
  height: var(--sizing-4);
  background: var(--color-bg-accent);
`;

export const StyledSquarePreview = styled.div`
  width: var(--sizing-10);
  height: var(--sizing-10);
  border: var(--border-width-1) solid var(--color-bd-neutral);
`;

export const StyledTable = styled.table`
  width: 100%;
  border-collapse: collapse;

  th,
  td {
    text-align: left;
    padding: var(--spacing-2);
  }

  td {
    padding-bottom: 0;
  }

  thead tr {
    border-bottom: var(--border-width-1) solid var(--color-bd-neutral);
  }
`;

interface TokenTableProps {
  prefix: string;
  children: (cssVar: string) => ReactNode;
  filter?: string;
  tokens?: { [key: string]: Token };
}

export const TokenTable = ({
  children,
  filter,
  prefix,
  tokens,
}: TokenTableProps) => (
  <StyledTable>
    <thead>
      <tr>
        <th>Preview</th>
        <th>CSS</th>
        <th>Value</th>
      </tr>
    </thead>
    <tbody>
      {Object.keys(tokens ?? {})
        .filter((key) => (filter ? key.includes(filter) : true))
        .map((key) => (
          <tr key={key}>
            <td>{children(`var(--${prefix}-${key})`)}</td>
            <td>
              <CopyLink value={`var(--${prefix}-${key})`} />
            </td>
            <td>{tokens?.[key]?.value}</td>
          </tr>
        ))}
    </tbody>
  </StyledTable>
);

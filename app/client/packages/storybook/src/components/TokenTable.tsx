import * as React from "react";
import styled from "styled-components";
import { CopyLink } from "./CopyLink";
import isArray from "lodash/isArray";
import isString from "lodash/isString";

import type { Token } from "@appsmith/wds-theming";
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
    background-color: var(--color-bg-elevation-1);
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
  filter?: string | string[];
  tokens?: { [key: string]: Token };
  isExactMatch?: boolean;
}

export const TokenTable = ({
  children,
  filter,
  isExactMatch = true,
  prefix,
  tokens,
}: TokenTableProps) => {
  const renderRows = (filter?: string) => {
    return Object.keys(tokens ?? {})
      .filter((key) => {
        if (filter == null) return true;

        if (isExactMatch) {
          return key === filter;
        }

        return key.includes(filter);
      })
      .map((key) => (
        <tr key={key}>
          <td>{children(`var(--${prefix}-${key})`)}</td>
          <td>
            <CopyLink value={`var(--${prefix}-${key})`} />
          </td>
          <td>{tokens?.[key]?.value}</td>
        </tr>
      ));
  };

  return (
    <StyledTable>
      <thead>
        <tr>
          <th>Preview</th>
          <th>CSS</th>
          <th>Value</th>
        </tr>
      </thead>
      <tbody>
        {isArray(filter) && filter.map((key) => renderRows(key))}
        {isString(filter) && renderRows(filter)}
        {!Boolean(filter) && renderRows()}
      </tbody>
    </StyledTable>
  );
};

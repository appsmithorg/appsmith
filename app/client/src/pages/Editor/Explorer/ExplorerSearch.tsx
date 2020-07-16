import React, { forwardRef, Ref } from "react";
import { Icon, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const ExplorerSearchWrapper = styled.div`
  display: flex;
  margin: 10px 0;
  justify-content: flex-start;
  align-items: center;
  & {
    .${Classes.ICON} {
      color: ${Colors.SLATE_GRAY};
    }
    input {
      border: none;
      background: none;
      margin-left: 10px;
      color: ${Colors.WHITE};
      &::placeholder {
        color: ${Colors.SLATE_GRAY};
      }
    }
  }
`;
/*eslint-disable react/display-name */
export const ExplorerSearch = forwardRef(
  (props: {}, ref: Ref<HTMLInputElement>) => {
    return (
      <ExplorerSearchWrapper>
        <Icon icon="search" iconSize={16} />
        <input type="text" placeholder="Filter entities..." ref={ref} />
      </ExplorerSearchWrapper>
    );
  },
);

export default ExplorerSearch;

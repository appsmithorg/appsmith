import React, { forwardRef, Ref } from "react";
import { Icon, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const ExplorerSearchWrapper = styled.div`
  display: grid;
  grid-template-columns: 12px 1fr 19px;
  margin: 10px 0;
  justify-content: flex-start;
  align-items: center;
  & {
    .${Classes.ICON} {
      color: ${Colors.SLATE_GRAY};
      cursor: pointer;
      &:last-of-type:hover {
        color: ${Colors.WHITE};
      }
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
  (props: { clear: () => void }, ref: Ref<HTMLInputElement>) => {
    return (
      <ExplorerSearchWrapper>
        <Icon icon="search" iconSize={12} />
        <input type="text" placeholder="Filter entities..." ref={ref} />
        <Icon icon="cross" iconSize={12} onClick={props.clear} />
      </ExplorerSearchWrapper>
    );
  },
);

export default ExplorerSearch;

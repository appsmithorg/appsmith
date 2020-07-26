import React, { forwardRef, Ref } from "react";
import { Icon, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";

const ExplorerSearchWrapper = styled.div`
  display: grid;
  grid-template-columns: 12px 1fr 19px;
  margin: 0;
  justify-content: flex-start;
  align-items: center;
  padding: 10px 0 10px 4px;
  position: sticky;
  top: 0;
  z-index: 1;
  box-shadow: 0px 1px 3px ${props => props.theme.colors.navBG};

  background: ${props => props.theme.colors.paneBG};
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
        <input
          id="entity-explorer-search"
          type="text"
          placeholder="Search entities..."
          ref={ref}
        />
        <Icon icon="cross" iconSize={12} onClick={props.clear} />
      </ExplorerSearchWrapper>
    );
  },
);

export default ExplorerSearch;

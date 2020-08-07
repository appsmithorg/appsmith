import React, { forwardRef, Ref } from "react";
import { Icon, Classes } from "@blueprintjs/core";
import styled from "styled-components";
import { Colors } from "constants/Colors";
import { ENTITY_EXPLORER_SEARCH_ID } from "constants/Explorer";

const ExplorerSearchWrapper = styled.div`
  display: grid;
  grid-template-columns: 30px 1fr 30px;
  margin-bottom: 5px;
  height: 48px;
  justify-content: flex-start;
  align-items: center;
  position: sticky;
  font-size: 12px;
  top: 0;
  z-index: 1;
  background: ${Colors.MINE_SHAFT};
  & {
    .${Classes.ICON} {
      color: ${Colors.DOVE_GRAY};
      cursor: pointer;
      width: 100%;
      height: 100%;
      display: flex;
      justify-content: center;
      align-items: center;
      &:last-of-type {
        color: ${Colors.MINE_SHAFT};
      }
    }
    input {
      display: flex;
      border: none;
      background: none;
      padding: 0px 10px 0px 10px;
      color: ${Colors.WHITE};
      &::placeholder {
        color: ${Colors.DOVE_GRAY};
      }
      &:focus {
        background: ${Colors.COD_GRAY};
        & ~ div.underline {
          width: 100%;
        }
        & ~ .${Classes.ICON} {
          color: ${Colors.WHITE};
        }
      }
    }
  }
`;

const Underline = styled.div`
  position: absolute;
  left: 0;
  right: 0;
  width: 0%;
  height: 1px;
  background: ${Colors.TIA_MARIA};
  bottom: 0;
  transition: width 0.3s ease-in;
`;
/*eslint-disable react/display-name */
export const ExplorerSearch = forwardRef(
  (props: { clear: () => void }, ref: Ref<HTMLInputElement>) => {
    return (
      <ExplorerSearchWrapper>
        <Icon icon="search" iconSize={12} />
        <input
          id={ENTITY_EXPLORER_SEARCH_ID}
          type="text"
          placeholder="Search entities..."
          ref={ref}
        />
        <Icon icon="cross" iconSize={12} onClick={props.clear} />
        <Underline className="underline" />
      </ExplorerSearchWrapper>
    );
  },
);

export default ExplorerSearch;

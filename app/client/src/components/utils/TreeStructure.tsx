import React from "react";
import styled from "styled-components";

type TreeStructureProps = {
  label: string;
  level: number;
  start: boolean;
  levelSeparator?: string;
};

const TreeStructureHorizontalWrapper = styled.div<{
  level: number;
  label: string;
}>`
  position: absolute;
  width: ${props => (props.level - 1) * 2 + 9}px;
  height: 2px;
  background: #a2a6a8;
  top: ${props => (props.label ? "65%" : "50%")};
  left: ${props => (props.level - 1) * 18 + 9}px;
  z-index: 1;
`;

const TreeStructureVerticalWrapper = styled.div<{
  level: number;
  label: string;
  start: boolean;
}>`
  position: absolute;
  height: ${props => (props.start ? (props.label ? "77%" : "70%") : "100%")};
  width: 2px;
  background: #a2a6a8;
  top: ${props =>
    props.start
      ? props.label
        ? "-12%"
        : "-16%"
      : props.label
      ? "-35%"
      : "-49%"};
  left: ${props => (props.level - 1) * 18 + 9}px;
  z-index: 1;
`;

const TreeStructure = (props: TreeStructureProps) => {
  return (
    <React.Fragment>
      {props.level ? (
        <TreeStructureHorizontalWrapper
          label={props.label}
          level={props.level}
        />
      ) : null}
      {(() => {
        if (
          props.level &&
          props.levelSeparator &&
          props.levelSeparator === "odd"
        ) {
          const treeStructureVerticalWrappers = new Array(props.level)
            .fill("")
            .map((i, index) => {
              return (
                <TreeStructureVerticalWrapper
                  key={index}
                  label={props.label}
                  level={index + 1}
                  start={index === props.level - 1 ? props.start : false}
                />
              );
            });
          return treeStructureVerticalWrappers;
        } else if (props.level) {
          return (
            <TreeStructureVerticalWrapper
              label={props.label}
              level={props.level}
              start={props.start}
            />
          );
        } else {
          return [];
        }
      })()}
    </React.Fragment>
  );
};

export default TreeStructure;

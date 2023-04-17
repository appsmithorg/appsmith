import React from "react";
import styled from "styled-components";

const TreeStructureWrapper = styled.div`
  li {
    list-style: none;
  }

  .tree,
  .tree ul {
    margin-bottom: 0;
    margin-top: 0;
    margin-left: 9px;
    padding: 0;
    list-style: none;
    color: var(--ads-color-black-200);
    position: relative;
  }

  .tree ul {
    margin-left: 9px;
  }

  .tree:before,
  .tree ul:before {
    content: "";
    display: block;
    width: 0;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    border-left: 1px solid;
    border-color: var(--ads-color-black-200);
  }

  .tree li {
    margin: 0;
    padding-left: 6px;
    line-height: 18px;
    margin-top: 8px;
    position: relative;
  }

  .tree li div {
    position: relative;
    z-index: 10;
  }

  .tree li:before {
    content: "";
    display: block;
    width: 9px;
    height: 0;
    border-top: 1px solid;
    margin-top: 0px;
    position: absolute;
    top: 14px;
    left: 0;
    border-color: var(--ads-color-black-200);
  }
  }

  .tree li:last-child:before {
    background: white;
    height: auto;
    bottom: 0;
  }
`;

type TreeStructureProps = {
  children: React.ReactNode;
};

const TreeStructure = React.forwardRef(
  (props: TreeStructureProps, ref: any) => {
    return (
      <TreeStructureWrapper ref={ref}>{props.children}</TreeStructureWrapper>
    );
  },
);

export default TreeStructure;

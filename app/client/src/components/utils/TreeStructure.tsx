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
    color: ${props => props.theme.colors.paneText};
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
    border-left: 2px solid;
  }

  .tree li {
    margin: 0;
    padding-left: 9px;
    line-height: 18px;
    padding-top: 16px;
    position: relative;
  }

  .tree li:before {
    content: "";
    display: block;
    width: 9px;
    height: 0;
    border-top: 2px solid;
    margin-top: 36px;
    position: absolute;
    top: 18px;
    left: 0;
  }

  .tree li:last-child:before {
    background: ${props => props.theme.colors.paneBG};
    height: auto;
    top: 18px;
    bottom: 0;
  }
`;

type TreeStructureProps = {
  children: React.ReactNode;
};

const TreeStructure = (props: TreeStructureProps) => {
  return <TreeStructureWrapper>{props.children}</TreeStructureWrapper>;
};

export default TreeStructure;

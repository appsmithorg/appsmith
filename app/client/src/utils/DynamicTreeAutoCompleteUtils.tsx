import { TreeNodeInArray } from "react-simple-tree-menu";
import React from "react";
import styled from "styled-components";

const Key = styled.span`
  color: #768896;
  padding-right: 5px;
`;
const Value = styled.span<{ type: string }>`
  color: ${props => {
    switch (props.type) {
      case "string":
        return "#2E3D49";
      case "number":
        return props.theme.colors.error;
      case "boolean":
        return props.theme.colors.primary;
      default:
        return "#2E3D49";
    }
  }};
`;

export const transformToTreeStructure = (
  dataTree: Record<string, any>,
  names: string[],
  parentPath?: string,
): TreeNodeInArray[] => {
  return names.map(name => {
    const currentPath = parentPath ? `${parentPath}.${name}` : name;
    let nodes: TreeNodeInArray["nodes"] = [];
    const child = dataTree[name];
    let childType: string = typeof child;
    let labelRender: React.ReactNode = name;
    if (childType === "object") {
      if (!Array.isArray(child)) {
        nodes = transformToTreeStructure(
          child,
          Object.keys(child),
          currentPath,
        );
      } else {
        nodes = child.map((c, i) => ({
          key: `[${i}]`,
          path: `${currentPath}[${i}]`,
          label: "",
          labelRender: i.toString(),
          nodes: transformToTreeStructure(
            c,
            Object.keys(c),
            `${currentPath}[${i}]`,
          ),
        }));
        childType = "Array";
        labelRender = `${name} {${child.length}}`;
      }
    } else {
      labelRender = (
        <div>
          <Key>{name}: </Key>
          <Value type={childType}>
            {childType === "string"
              ? `"${dataTree[name]}"`
              : String(dataTree[name])}
          </Value>
        </div>
      );
    }
    return {
      key: name,
      path: currentPath,
      label: "",
      labelRender,
      nodes,
      type: childType,
    };
  });
};

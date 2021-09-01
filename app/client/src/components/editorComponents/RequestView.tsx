import { ITreeNode, Classes, Tree } from "@blueprintjs/core";
import React, { useState } from "react";
import styled from "styled-components";
import ReadOnlyEditor from "components/editorComponents/ReadOnlyEditor";

const StyledKey = styled.span`
  font-family: ${(props) => props.theme.fonts.text};
  font-style: normal;
  font-weight: 500;
  font-size: 14px;
  line-height: 16px;
  color: ${(props) => props.theme.colors.apiPane.requestTree.row.key};
  user-select: none;
`;
const StyledValue = styled.span`
  font-family: monospace;
  font-style: normal;
  font-weight: normal;
  font-size: 14px;
  line-height: 16px;
  color: ${(props) => props.theme.colors.apiPane.requestTree.row.value};
  user-select: text;
`;

function KeyValuePair(props: { hKey: string; hValue: string }) {
  return (
    <StyledValue>
      <StyledKey>{props.hKey}</StyledKey>
      {props.hValue}
    </StyledValue>
  );
}

const StyledTreeContainer = styled.div`
  font-family: ${(props) => props.theme.fonts.text};
  .bp3-tree {
    background-color: ${(props) => props.theme.colors.apiPane.requestTree.bg};
  }
  .bp3-tree-node-content {
    height: auto;
  }
  .bp3-tree-node-label {
    overflow: auto;
    word-break: break-all;
    white-space: break-spaces;
    padding: 4px 0px;
  }
  .bp3-tree-node-content-0 {
    background: ${(props) => props.theme.colors.apiPane.requestTree.header.bg};
    color: ${(props) => props.theme.colors.apiPane.requestTree.header.text};
    font-style: normal;
    font-weight: 500;
    font-size: 12px;
    line-height: 14px;
    cursor: pointer;
    text-transform: uppercase;
  }
  .bp3-tree-node.bp3-tree-node-selected > .bp3-tree-node-content,
  .bp3-tree-node.bp3-tree-node-selected > .bp3-icon {
    background-color: #f0f0f0;
    color: black;
  }
  .bp3-tree-node-caret-none {
    display: none;
  }
  .bp3-tree-node-content-1 {
    padding-left: 24px;
  }
  .bp3-tree-node-list {
    padding-bottom: 0px;
    .bp3-tree-root {
      padding-top: 0px;
      padding-bottom: 0px;
    }
  }
  .bp3-tree-node-caret {
    color: black;
  }
  .request-body {
    .bp3-tree-node-content-1,
    .bp3-tree-node-label,
    .bp3-tree-node-list {
      padding-left: 0;
    }
  }
  .bp3-tree-node-caret {
    color: ${(props) => props.theme.colors.apiPane.requestTree.header.icon};
  }
  .bp3-tree-node-content:hover {
    background-color: ${(props) =>
      props.theme.colors.apiPane.requestTree.row.hoverBg};
    cursor: pointer;
  }
`;

export function RequestView(props: {
  requestURL: string;
  requestMethod: string;
  requestHeaders: Record<string, string[]>;
  requestBody: string;
}) {
  const [generalExpanded, setGeneralExpanded] = useState(true);
  const [requestHeadersExpanded, setRequestHeadersExpanded] = useState(true);
  const [requestBodyExpanded, setRequestBodyExpanded] = useState(true);

  const headers = Object.keys(props.requestHeaders).map(
    (hKey: string, index: number) => {
      return {
        id: index,
        label: (
          <KeyValuePair
            hKey={`${hKey}:  `}
            hValue={props.requestHeaders[hKey].join(", ")}
          />
        ),
      };
    },
  );

  function setExpanded(id: number | string, expanded: boolean) {
    id === 1 && setGeneralExpanded(expanded);
    id === 2 && setRequestHeadersExpanded(expanded);
    id === 3 && setRequestBodyExpanded(expanded);
  }

  function handleNodeClick(nodeData: ITreeNode) {
    setExpanded(nodeData.id, !nodeData.isExpanded);
  }

  function handleNodeExpand(nodeData: ITreeNode) {
    setExpanded(nodeData.id, true);
  }

  function handleNodeCollapse(nodeData: ITreeNode) {
    setExpanded(nodeData.id, false);
  }

  return (
    <StyledTreeContainer>
      <Tree
        className={Classes.ELEVATION_0}
        contents={[
          {
            id: 1,
            isExpanded: generalExpanded,
            label: "General",
            childNodes: [
              {
                id: 2,
                label: (
                  <KeyValuePair
                    hKey="Request URL:  "
                    hValue={props.requestURL}
                  />
                ),
              },
              {
                id: 3,
                label: (
                  <KeyValuePair
                    hKey="Request Method:  "
                    hValue={props.requestMethod}
                  />
                ),
              },
            ],
          },
          {
            id: 2,
            isExpanded: requestHeadersExpanded,
            label: "Request Headers",
            childNodes: headers,
          },
          {
            id: 3,
            isExpanded: requestBodyExpanded,
            label: "Request Body",
            className: "request-body",
            childNodes: [
              {
                id: 1,
                label: (
                  <ReadOnlyEditor
                    folding
                    height={"100%"}
                    input={{
                      value: props.requestBody,
                    }}
                  />
                ),
              },
            ],
          },
        ]}
        onNodeClick={handleNodeClick}
        onNodeCollapse={handleNodeCollapse}
        onNodeExpand={handleNodeExpand}
      />
    </StyledTreeContainer>
  );
}

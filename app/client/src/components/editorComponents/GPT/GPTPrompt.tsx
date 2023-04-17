import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism-light";
import { marked } from "marked";
import LikeIcon from "remixicon-react/ThumbUpLineIcon";
import DislikeIcon from "remixicon-react/ThumbDownLineIcon";
import CopyIcon from "remixicon-react/ClipboardLineIcon";
import { duotoneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import styled from "styled-components";

const ResponseContainer = styled.div`
  background: #fbefe14f;
  pre {
    overflow: unset !important;
    border-radius: 0.25rem;
    margin: 0 !important;
    font-size: 0.75em;
    background: transparent !important;
    padding: 0 !important;
    code {
      font-size: 13px !important;
      word-break: break-all !important;
      white-space: pre-wrap !important;
      .token {
        background: transparent !important;
      }
    }
  }
`;

const UserPrompt = styled.div`
  background-color: var(--ads-color-black-0);
  color: var(--ads-color-black-700);
  font-size: 12px;
  font-weight: 500;
  line-height: 16px;
  letter-spacing: 0.4px;
  padding: 8px var(--ads-spaces-3);
  font-style: normal;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
`;

export function GPTPrompt({ response, role }: any) {
  let text = response;
  if (role === "assistant") {
    const parsedDocument = marked(response);
    const domParser = new DOMParser();
    const documentObj = domParser.parseFromString(parsedDocument, "text/html");
    text = documentObj.body.innerText;
    return (
      <ResponseContainer className="p-2 rounded gap-1 border border-gray-100">
        <div className="flex flex-row items-start justify-between gap-1">
          <SyntaxHighlighter language="javascript" style={duotoneLight}>
            {text}
          </SyntaxHighlighter>
          <div className="p-1 copy-icon hover:bg-gray-200 cursor-pointer">
            <CopyIcon
              className="flex-shrink-0"
              onClick={() => ({})}
              size={14}
            />
          </div>
        </div>
        <div className="flex flex-row justify-end mt-1 gap-1">
          <div className="p-1 hover:bg-gray-200 cursor-pointer">
            <LikeIcon onClick={() => ({})} size={14} />
          </div>
          <div className="p-1 hover:bg-gray-200 cursor-pointer">
            <DislikeIcon
              className="cursor-pointer"
              onClick={() => ({})}
              size={14}
            />
          </div>
        </div>
      </ResponseContainer>
    );
  } else {
    return (
      <div className="flex w-full justify-end items-center">
        <UserPrompt className="rounded border border-gray-100">
          {text}
        </UserPrompt>
      </div>
    );
  }
}

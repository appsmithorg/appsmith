import React from "react";
import SyntaxHighlighter from "react-syntax-highlighter/dist/cjs/prism-light";
import { marked } from "marked";
// import LikeIcon from "remixicon-react/ThumbUpLineIcon";
// import DislikeIcon from "remixicon-react/ThumbDownLineIcon";
import CopyIcon from "remixicon-react/ClipboardLineIcon";
import { duotoneLight } from "react-syntax-highlighter/dist/cjs/styles/prism";
import styled from "styled-components";
import copy from "copy-to-clipboard";
import classNames from "classnames";

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
  const [copyIconClicked, clickCopyIcon] = React.useState(false);

  if (role === "assistant") {
    const parsedDocument = marked(response);
    const domParser = new DOMParser();
    const documentObj = domParser.parseFromString(parsedDocument, "text/html");
    text = documentObj.body.innerText;
    return (
      <ResponseContainer className="relative pl-4 pr-4 py-4 rounded gap-1 border border-gray-100">
        <div className="flex flex-row items-start justify-between gap-1">
          <SyntaxHighlighter language="javascript" style={duotoneLight}>
            {text}
          </SyntaxHighlighter>
        </div>
        <div className="flex items-center justify-end absolute top-0 gap-[2px] right-0 copy-icon cursor-pointer">
          <span
            className={classNames({
              "text-[10px]": true,
              hidden: !copyIconClicked,
            })}
          >
            Copied!
          </span>
          <div
            className=" hover:bg-gray-200 p-1"
            onClick={() => {
              copy(text);
              clickCopyIcon(true);
              setTimeout(() => {
                clickCopyIcon(false);
              }, 2000);
            }}
          >
            <CopyIcon size={13} />
          </div>
        </div>
        {/* <div className="flex flex-row justify-end mt-1 gap-1">
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
        </div> */}
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

import styled from "styled-components";
import React, { useEffect, useMemo } from "react";
import SignPostingBanner from "components/designSystems/appsmith/SignPostingBanner";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { GPTTask } from "./GPT/utils";

export type AISignPostingProps = {
  isOpen?: boolean;
  mode?: TEditorModes;
  forComp?: string;
};

const SubContent = styled.div`
  color: var(--ads-v2-color-fg-muted);
`;

const Content = styled.span`
  color: #364652;
`;

export function AIPost(props: { title: string }) {
  return (
    <div className="text-sm">
      <Content>
        Use <span className="font-semibold">/ai</span> command
      </Content>
      <SubContent className="text-xs mt-2">
        <div className="">{props.title}</div>
      </SubContent>
    </div>
  );
}

const Container = styled.div`
  margin-bottom: -7px;
`;

function AISignPosting(props: AISignPostingProps) {
  const { forComp, isOpen, mode } = props;
  const isJavascriptMode = mode === EditorModes.TEXT_WITH_BINDING;

  let containerClasses = "absolute bottom-[4px] translate-y-full w-full";

  if (!isJavascriptMode) {
    containerClasses = "w-fit";
  }

  const title = isJavascriptMode
    ? "To generate js code using AI"
    : "To generate queries using AI";

  const hideSignPost = useMemo(() => {
    return forComp === "editor" && mode !== EditorModes.TEXT_WITH_BINDING;
  }, [forComp, mode]);

  useEffect(() => {
    if (hideSignPost || !isOpen) {
      return;
    }

    AnalyticsUtil.logEvent("AI_SIGNPOSTING_SHOWN", {
      type: isJavascriptMode ? GPTTask.JS_EXPRESSION : GPTTask.SQL_QUERY,
    });
  }, [hideSignPost, isOpen, isJavascriptMode]);

  /** We show this prompt on the editor only for TEXT_WITH_BINDING   */
  if (hideSignPost) {
    return null;
  }

  return (
    <Container
      className={`${containerClasses} ${
        isOpen ? "visible" : "invisible"
      } t--no-binding-prompt`}
    >
      <SignPostingBanner
        content={<AIPost title={title} />}
        iconName="magic-line"
      />
    </Container>
  );
}

export default AISignPosting;

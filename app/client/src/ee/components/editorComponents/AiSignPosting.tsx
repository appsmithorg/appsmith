import styled from "styled-components";
import React from "react";
import SignPostingBanner from "components/designSystems/appsmith/SignPostingBanner";
import type { TEditorModes } from "components/editorComponents/CodeEditor/EditorConfig";
import { EditorModes } from "components/editorComponents/CodeEditor/EditorConfig";

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
  const isJavascriptMode = props.mode === EditorModes.TEXT_WITH_BINDING;

  let containerClasses = "absolute bottom-[4px] translate-y-full w-full";

  if (!isJavascriptMode) {
    containerClasses = "w-fit";
  }

  const title = isJavascriptMode
    ? "To generate js code using AI"
    : "To generate queries using AI";

  /** We show this prompt on the editor only for TEXT_WITH_BINDING   */
  if (
    props.forComp === "editor" &&
    props.mode !== EditorModes.TEXT_WITH_BINDING
  ) {
    return null;
  }

  return (
    <Container
      className={`${containerClasses} ${
        props.isOpen ? "visible" : "invisible"
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

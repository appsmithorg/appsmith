import React from "react";
import type { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";
import {
  type BlockCompletion,
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  type EditorTheme,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import type { CodeEditorGutter } from "components/editorComponents/CodeEditor";
import type { JSAction, JSCollection } from "entities/JSCollection";
import type { OnUpdateSettingsProps } from "../JSEditorToolbar";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { Flex } from "@appsmith/ads";

interface Props {
  executing: boolean;
  highlightedLines?: number[];
  onValueChange: (value: string) => void;
  value: JSEditorTab;
  showSettings: undefined | boolean;
  blockCompletions: Array<BlockCompletion>;
  customGutter: CodeEditorGutter;
  currentJSCollection: JSCollection;
  changePermitted: boolean;
  onChange: (valueOrEvent: React.ChangeEvent | string) => void;
  theme: EditorTheme.LIGHT;
  actions: JSAction[];
  onUpdateSettings?: (props: OnUpdateSettingsProps) => void;
}

export const JSEditorForm = (props: Props) => {
  return (
    <Flex flex="1" overflowY="scroll">
      <LazyCodeEditor
        AIAssisted
        blockCompletions={props.blockCompletions}
        border={CodeEditorBorder.NONE}
        borderLess
        className={"js-editor"}
        customGutter={props.customGutter}
        dataTreePath={`${props.currentJSCollection.name}.body`}
        disabled={!props.changePermitted}
        folding
        height={"100%"}
        hideEvaluatedValue
        highlightedLines={props.highlightedLines}
        input={{
          value: props.currentJSCollection.body,
          onChange: props.onChange,
        }}
        isJSObject
        jsObjectName={props.currentJSCollection.name}
        mode={EditorModes.JAVASCRIPT}
        placeholder="Let's write some code!"
        showLightningMenu={false}
        showLineNumbers
        size={EditorSize.EXTENDED}
        tabBehaviour={TabBehaviour.INDENT}
        theme={props.theme}
      />
    </Flex>
  );
};

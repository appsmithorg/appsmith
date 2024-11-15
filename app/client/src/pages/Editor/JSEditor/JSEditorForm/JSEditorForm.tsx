import React from "react";
import { FEATURE_FLAG } from "ee/entities/FeatureFlag";
import type { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";
import { useFeatureFlag } from "utils/hooks/useFeatureFlag";
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
import { OldJSEditorForm } from "./old/JSEditorForm";
import type { OnUpdateSettingsProps } from "../JSEditorToolbar";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import { Flex } from "@appsmith/ads";

interface Props {
  executing: boolean;
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
  const isActionRedesignEnabled = useFeatureFlag(
    FEATURE_FLAG.release_actions_redesign_enabled,
  );

  if (!isActionRedesignEnabled) {
    return (
      <OldJSEditorForm
        actions={props.actions}
        blockCompletions={props.blockCompletions}
        changePermitted={props.changePermitted}
        currentJSCollection={props.currentJSCollection}
        customGutter={props.customGutter}
        executing={props.executing}
        onChange={props.onChange}
        onUpdateSettings={props.onUpdateSettings}
        onValueChange={props.onValueChange}
        showSettings={props.showSettings}
        theme={props.theme}
        value={props.value}
      />
    );
  }

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

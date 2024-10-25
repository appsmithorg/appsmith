import { JSEditorTab } from "reducers/uiReducers/jsPaneReducer";
import React from "react";
import type {
  BlockCompletion,
  EditorTheme,
} from "components/editorComponents/CodeEditor/EditorConfig";
import {
  CodeEditorBorder,
  EditorModes,
  EditorSize,
  TabBehaviour,
} from "components/editorComponents/CodeEditor/EditorConfig";
import { TabbedViewContainer } from "../../styledComponents";
import { Tab, TabPanel, Tabs, TabsList } from "@appsmith/ads";
import LazyCodeEditor from "components/editorComponents/LazyCodeEditor";
import type { CodeEditorGutter } from "components/editorComponents/CodeEditor";
import type { JSAction, JSCollection } from "entities/JSCollection";
import { type OnUpdateSettingsProps } from "../../JSEditorToolbar";
import { JSFunctionSettings } from "../../JSEditorToolbar/components/JSFunctionSettings";

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

export function OldJSEditorForm(props: Props) {
  return (
    <TabbedViewContainer isExecuting={props.executing}>
      <Tabs
        defaultValue={JSEditorTab.CODE}
        onValueChange={props.onValueChange}
        value={props.value}
      >
        <TabsList>
          <Tab
            data-testid={`t--js-editor-` + JSEditorTab.CODE}
            value={JSEditorTab.CODE}
          >
            Code
          </Tab>
          {props.showSettings && (
            <Tab
              data-testid={`t--js-editor-` + JSEditorTab.SETTINGS}
              value={JSEditorTab.SETTINGS}
            >
              Settings
            </Tab>
          )}
        </TabsList>
        <TabPanel value={JSEditorTab.CODE}>
          <div className="js-editor-tab">
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
          </div>
        </TabPanel>
        {props.showSettings && (
          <TabPanel value={JSEditorTab.SETTINGS}>
            <div className="js-editor-tab">
              <JSFunctionSettings
                actions={props.actions}
                disabled={!props.changePermitted}
                onUpdateSettings={props.onUpdateSettings}
              />
            </div>
          </TabPanel>
        )}
      </Tabs>
    </TabbedViewContainer>
  );
}

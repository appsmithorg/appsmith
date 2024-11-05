import React from "react";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import RequestDropdownField from "components/editorComponents/form/fields/RequestDropdownField";
import { replayHighlightClass } from "globalStyles/portals";
import EmbeddedDatasourcePathField from "./components/EmbeddedDatasourcePathField";
import { Flex } from "@appsmith/ads";
import * as Styled from "./styles";

export function InfoFields(props: {
  changePermitted: boolean;
  options: { value: string }[];
  actionName: string;
  pluginId: string;
  formName: string;
  theme: EditorTheme.LIGHT;
}) {
  return (
    <Flex gap="spaces-4" w="100%">
      <Styled.RequestMethodSelectContainer>
        <RequestDropdownField
          className={`t--apiFormHttpMethod ${replayHighlightClass}`}
          data-location-id={btoa("actionConfiguration.httpMethod")}
          disabled={!props.changePermitted}
          name="actionConfiguration.httpMethod"
          options={props.options}
          placeholder="Method"
        >
          <div />
        </RequestDropdownField>
      </Styled.RequestMethodSelectContainer>
      <Styled.DatasourcePathFieldContainer className="t--dataSourceField">
        <EmbeddedDatasourcePathField
          actionName={props.actionName}
          codeEditorVisibleOverflow
          formName={props.formName}
          name="actionConfiguration.path"
          placeholder="https://mock-api.appsmith.com/users"
          pluginId={props.pluginId}
          theme={props.theme}
        />
      </Styled.DatasourcePathFieldContainer>
    </Flex>
  );
}

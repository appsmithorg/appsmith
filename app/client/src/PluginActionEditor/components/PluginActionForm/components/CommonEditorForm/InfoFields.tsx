import React from "react";
import type { EditorTheme } from "components/editorComponents/CodeEditor/EditorConfig";
import RequestDropdownField from "components/editorComponents/form/fields/RequestDropdownField";
import { replayHighlightClass } from "globalStyles/portals";
import EmbeddedDatasourcePathField from "components/editorComponents/form/fields/EmbeddedDatasourcePathField";
import styled from "styled-components";
import { Flex } from "@appsmith/ads";

const DatasourceWrapper = styled.div`
  margin-left: 8px;
  width: 100%;
`;

export function InfoFields(props: {
  changePermitted: boolean;
  options: { value: string }[];
  actionName: string;
  pluginId: string;
  formName: string;
  theme: EditorTheme.LIGHT;
}) {
  return (
    <Flex w="100%">
      <div>
        <RequestDropdownField
          className={`t--apiFormHttpMethod ${replayHighlightClass}`}
          data-location-id={btoa("actionConfiguration.httpMethod")}
          disabled={!props.changePermitted}
          name="actionConfiguration.httpMethod"
          options={props.options}
          placeholder="Method"
          width={"110px"}
        >
          <div />
        </RequestDropdownField>
      </div>
      <DatasourceWrapper className="t--dataSourceField">
        <EmbeddedDatasourcePathField
          actionName={props.actionName}
          codeEditorVisibleOverflow
          formName={props.formName}
          name="actionConfiguration.path"
          placeholder="https://mock-api.appsmith.com/users"
          pluginId={props.pluginId}
          theme={props.theme}
        />
      </DatasourceWrapper>
    </Flex>
  );
}

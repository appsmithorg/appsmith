import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "ee/constants/forms";
import type { Datasource } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import { reduxForm } from "redux-form";
import { APPSMITH_IP_ADDRESSES } from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "ee/configs";
import { convertArrayToSentence } from "utils/helpers";
import { PluginType } from "entities/Action";
import type { AppState } from "ee/reducers";
import type { JSONtoFormProps } from "./JSONtoForm";
import { JSONtoForm } from "./JSONtoForm";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import { Callout } from "@appsmith/ads";
import store from "store";

const { cloudHosting } = getAppsmithConfigs();

interface DatasourceDBEditorProps extends JSONtoFormProps {
  datasourceId: string;
  applicationId: string;
  pageId: string;
  viewMode: boolean;
  pluginType: string;
  messages?: Array<string>;
  datasource: Datasource;
  hiddenHeader?: boolean;
  datasourceName?: string;
  isPluginAllowedToPreviewData: boolean;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

export const Form = styled.form<{
  viewMode: boolean;
}>`
  display: flex;
  flex-direction: column;
  ${(props) => !props.viewMode && `height: 100%`}
  padding-bottom: var(--ads-v2-spaces-6);
  overflow-y: auto;
  margin-left: ${(props) => (props.viewMode ? "0px" : "24px")};
`;

class DatasourceDBEditor extends JSONtoForm<Props> {
  openDocumentation = () => {
    const appState: AppState = store.getState();
    const plugin = appState.entities.plugins.list.find(
      (plugin) => plugin.id === this.props.datasource?.pluginId,
    );

    if (!!plugin)
      openDoc(DocsLink.WHITELIST_IP, plugin?.documentationLink, plugin?.name);
    else openDoc(DocsLink.WHITELIST_IP);
  };

  render() {
    const { formConfig, initialized, viewMode } = this.props;

    // make sure this redux form has been initialized before rendering anything.
    // the initialized prop below comes from redux-form.
    // The viewMode condition is added to allow the conditons only run on the editMode
    if (!initialized && !viewMode) {
      return null;
    }

    return this.renderDataSourceConfigForm(formConfig);
  }

  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderDataSourceConfigForm = (sections: any) => {
    const { datasourceId, hiddenHeader, messages, pluginType, viewMode } =
      this.props;

    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        viewMode={viewMode}
      >
        {messages &&
          messages.map((msg, i) => {
            return (
              <Callout className="mt-4" key={i} kind="warning">
                {msg}
              </Callout>
            );
          })}
        {!hiddenHeader &&
          cloudHosting &&
          pluginType === PluginType.DB &&
          !viewMode && (
            <Callout
              className="mt-4 select-text"
              kind="info"
              links={[
                {
                  children: "Learn more",
                  onClick: this.openDocumentation,
                  endIcon: "share-box-line",
                  to: "about:blank",
                },
              ]}
            >
              {`Whitelist the IP ${convertArrayToSentence(
                APPSMITH_IP_ADDRESSES,
              )}  on your database instance to connect to it. `}
            </Callout>
          )}
        {(!viewMode || datasourceId === TEMP_DATASOURCE_ID) && (
          <>
            {!_.isNil(sections)
              ? _.map(sections, this.renderMainSection)
              : undefined}
            {""}
          </>
        )}
      </Form>
    );
  };
}

// TODO: Fix this the next time the file is edited
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mapStateToProps = (state: AppState, props: any) => {
  const datasource = state.entities.datasources.list.find(
    (e) => e.id === props.datasourceId,
  ) as Datasource;

  const hintMessages = datasource && datasource.messages;

  return {
    messages: hintMessages,
    datasource,
    datasourceName: datasource?.name ?? "",
  };
};

export default connect(mapStateToProps)(
  reduxForm<Datasource, DatasourceDBEditorProps>({
    destroyOnUnmount: false,
    form: DATASOURCE_DB_FORM,
    enableReinitialize: true,
  })(DatasourceDBEditor),
);

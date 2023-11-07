import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "@appsmith/constants/forms";
import type { Datasource } from "entities/Datasource";
import type { InjectedFormProps } from "redux-form";
import { reduxForm } from "redux-form";
import { APPSMITH_IP_ADDRESSES } from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import { convertArrayToSentence } from "utils/helpers";
import { PluginType } from "entities/Action";
import type { AppState } from "@appsmith/reducers";
import type { JSONtoFormProps } from "./JSONtoForm";
import { JSONtoForm } from "./JSONtoForm";
import { TEMP_DATASOURCE_ID } from "constants/Datasource";
import { DocsLink, openDoc } from "../../../constants/DocumentationLinks";
import { Callout } from "design-system";

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
  isEnabledForDSViewModeSchema: boolean;
  isPluginAllowedToPreviewData: boolean;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

export const Form = styled.form<{
  viewMode: boolean;
}>`
  display: flex;
  flex-direction: column;
  ${(props) =>
    !props.viewMode && `height: ${`calc(100% - ${props?.theme.backBanner})`};`}
  padding-bottom: var(--ads-v2-spaces-6);
  overflow-y: auto;
  margin-left: ${(props) => (props.viewMode ? "0px" : "24px")};
`;

class DatasourceDBEditor extends JSONtoForm<Props> {
  openDocumentation = () => {
    openDoc(DocsLink.WHITELIST_IP);
  };

  render() {
    const { formConfig, viewMode } = this.props;

    // make sure this redux form has been initialized before rendering anything.
    // the initialized prop below comes from redux-form.
    // The viewMode condition is added to allow the conditons only run on the editMode
    if (!this.props.initialized && !viewMode) {
      return null;
    }

    return this.renderDataSourceConfigForm(formConfig);
  }

  renderDataSourceConfigForm = (sections: any) => {
    const { datasourceId, messages, pluginType, viewMode } = this.props;

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
        {!this.props.hiddenHeader &&
          cloudHosting &&
          pluginType === PluginType.DB &&
          !viewMode && (
            <Callout
              className="mt-4"
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

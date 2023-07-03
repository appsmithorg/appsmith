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
import DatasourceInformation from "./DatasourceSection";
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
  showFilterComponent: boolean;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

export const Form = styled.form<{
  showFilterComponent: boolean;
}>`
  display: flex;
  flex-direction: column;
  height: ${({ theme }) => `calc(100% - ${theme.backBanner})`};
  overflow-y: scroll;
  flex: 8 8 80%;
  padding-bottom: 20px;
  margin-left: ${(props) => (props.showFilterComponent ? "24px" : "0px")};
`;

export const ViewModeWrapper = styled.div`
  display: flex;
  flex-direction: column;
  border-bottom: 1px solid var(--ads-v2-color-border);
  padding: var(--ads-v2-spaces-7) 0;
  gap: var(--ads-v2-spaces-4);
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
    const {
      datasource,
      datasourceId,
      formConfig,
      messages,
      pluginType,
      showFilterComponent,
      viewMode,
    } = this.props;

    return (
      <Form
        onSubmit={(e) => {
          e.preventDefault();
        }}
        showFilterComponent={showFilterComponent}
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
              kind="warning"
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
        {viewMode && (
          <ViewModeWrapper>
            {!_.isNil(formConfig) && !_.isNil(datasource) ? (
              <DatasourceInformation
                config={formConfig[0]}
                currentEnvironment={this.props.currentEnvironment}
                datasource={datasource}
                viewMode={viewMode}
              />
            ) : undefined}
          </ViewModeWrapper>
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
    form: DATASOURCE_DB_FORM,
    enableReinitialize: true,
  })(DatasourceDBEditor),
);

import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "@appsmith/constants/forms";
import { Icon } from "@blueprintjs/core";
import FormTitle from "./FormTitle";
import { Button, Callout, Category, Variant } from "design-system";
import { Colors } from "constants/Colors";
import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import Connected from "./Connected";
import { Datasource } from "entities/Datasource";
import { reduxForm, InjectedFormProps } from "redux-form";
import { APPSMITH_IP_ADDRESSES } from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "@appsmith/configs";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { convertArrayToSentence } from "utils/helpers";
import { PluginType } from "entities/Action";
import { AppState } from "@appsmith/reducers";
import {
  FormTitleContainer,
  Header,
  JSONtoForm,
  JSONtoFormProps,
  PluginImage,
} from "./JSONtoForm";
import DatasourceAuth from "pages/common/datasourceAuth";
import { getDatasourceFormButtonConfig } from "selectors/entitiesSelector";

const { cloudHosting } = getAppsmithConfigs();

interface DatasourceDBEditorProps extends JSONtoFormProps {
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
  openOmnibarReadMore: (text: string) => void;
  datasourceId: string;
  applicationId: string;
  pageId: string;
  isNewDatasource: boolean;
  pluginImage: string;
  viewMode: boolean;
  pluginType: string;
  messages?: Array<string>;
  datasource: Datasource;
  datasourceButtonConfiguration: string[] | undefined;
  hiddenHeader?: boolean;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

const StyledOpenDocsIcon = styled(Icon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;

const CollapsibleWrapper = styled.div`
  width: max-content;
`;

const EditDatasourceButton = styled(Button)`
  padding: 10px 20px;
  &&&& {
    height: 32px;
    max-width: 160px;
    border: 1px solid ${Colors.HIT_GRAY};
    width: auto;
  }
`;

class DatasourceDBEditor extends JSONtoForm<Props> {
  componentDidUpdate(prevProps: Props) {
    if (prevProps.datasourceId !== this.props.datasourceId) {
      super.componentDidUpdate(prevProps);
      if (!this.props.hiddenHeader)
        this.props.setDatasourceEditorMode(this.props.datasourceId, true);
    }
  }
  // returns normalized and trimmed datasource form data
  getSanitizedData = () => {
    return this.getTrimmedData(this.normalizeValues());
  };

  openOmnibarReadMore = () => {
    const { openOmnibarReadMore } = this.props;
    openOmnibarReadMore("connect to databases");
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "READ_MORE_DATASOURCE" });
  };

  render() {
    const { formConfig, viewMode } = this.props;

    // make sure this redux form has been initialized before rendering anything.
    // the initialized prop below comes from redux-form.
    // The viewMode condition is added to allow the conditons only run on the editMode
    if (!this.props.initialized && !viewMode) {
      return null;
    }

    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content);
  }

  renderDataSourceConfigForm = (sections: any) => {
    const {
      datasource,
      datasourceButtonConfiguration,
      formData,
      messages,
      pluginType,
      viewMode,
    } = this.props;

    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        {!this.props.hiddenHeader && (
          <Header>
            <FormTitleContainer>
              <PluginImage alt="Datasource" src={this.props.pluginImage} />
              <FormTitle focusOnMount={this.props.isNewDatasource} />
            </FormTitleContainer>
            {viewMode && (
              <EditDatasourceButton
                category={Category.tertiary}
                className="t--edit-datasource"
                onClick={() => {
                  this.props.setDatasourceEditorMode(
                    this.props.datasourceId,
                    false,
                  );
                }}
                text="EDIT"
              />
            )}
          </Header>
        )}
        {messages &&
          messages.map((msg, i) => (
            <Callout
              addMarginTop
              fill
              key={i}
              text={msg}
              variant={Variant.warning}
            />
          ))}
        {!this.props.hiddenHeader &&
          cloudHosting &&
          pluginType === PluginType.DB &&
          !viewMode && (
            <CollapsibleWrapper>
              <CollapsibleHelp>
                <span>{`Whitelist the IP ${convertArrayToSentence(
                  APPSMITH_IP_ADDRESSES,
                )}  on your database instance to connect to it. `}</span>
                <a onClick={this.openOmnibarReadMore}>
                  {"Read more "}
                  <StyledOpenDocsIcon icon="document-open" />
                </a>
              </CollapsibleHelp>
            </CollapsibleWrapper>
          )}
        {!viewMode ? (
          <>
            {!_.isNil(sections)
              ? _.map(sections, this.renderMainSection)
              : undefined}
            {""}
          </>
        ) : (
          <Connected />
        )}
        {/* Render datasource form call-to-actions */}
        {datasource && (
          <DatasourceAuth
            datasource={datasource}
            datasourceButtonConfiguration={datasourceButtonConfiguration}
            formData={formData}
            getSanitizedFormData={_.memoize(this.getSanitizedData)}
            isInvalid={this.validate()}
            shouldRender={!viewMode}
          />
        )}
      </form>
    );
  };
}

const mapStateToProps = (state: AppState, props: any) => {
  const datasource = state.entities.datasources.list.find(
    (e) => e.id === props.datasourceId,
  ) as Datasource;

  const hintMessages = datasource && datasource.messages;

  const datasourceButtonConfiguration = getDatasourceFormButtonConfig(
    state,
    props?.formData?.pluginId,
  );

  return {
    messages: hintMessages,
    datasource,
    datasourceButtonConfiguration,
    isReconnectingModalOpen: state.entities.datasources.isReconnectingModalOpen,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Datasource, DatasourceDBEditorProps>({
    form: DATASOURCE_DB_FORM,
    enableReinitialize: true,
  })(DatasourceDBEditor),
);

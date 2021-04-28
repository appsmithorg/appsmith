import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";

import history from "utils/history";
import { Icon } from "@blueprintjs/core";
import FormTitle from "./FormTitle";

import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import Connected from "./Connected";

import Button from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import { reduxForm, InjectedFormProps } from "redux-form";
import { APPSMITH_IP_ADDRESSES } from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "configs";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { convertArrayToSentence } from "utils/helpers";
import BackButton from "./BackButton";
import { PluginType } from "entities/Action";
import Boxed from "components/editorComponents/Onboarding/Boxed";
import { OnboardingStep } from "constants/OnboardingConstants";
import Callout from "components/ads/Callout";
import { Variant } from "components/ads/common";
import { AppState } from "reducers";
import {
  ActionButton,
  FormTitleContainer,
  Header,
  JSONtoForm,
  JSONtoFormProps,
  PluginImage,
  SaveButtonContainer,
} from "./JSONtoForm";

const { cloudHosting } = getAppsmithConfigs();

interface DatasourceDBEditorProps extends JSONtoFormProps {
  onSave: (formValues: Datasource) => void;
  onTest: (formValus: Datasource) => void;
  handleDelete: (id: string) => void;
  setDatasourceEditorMode: (id: string, viewMode: boolean) => void;
  openOmnibarReadMore: (text: string) => void;
  isSaving: boolean;
  isDeleting: boolean;
  datasourceId: string;
  applicationId: string;
  pageId: string;
  isTesting: boolean;
  isNewDatasource: boolean;
  pluginImage: string;
  viewMode: boolean;
  pluginType: string;
  messages?: Array<string>;
}

type Props = DatasourceDBEditorProps &
  InjectedFormProps<Datasource, DatasourceDBEditorProps>;

const StyledButton = styled(Button)`
  &&&& {
    width: 87px;
    height: 32px;
  }
`;

const StyledOpenDocsIcon = styled(Icon)`
  svg {
    width: 12px;
    height: 18px;
  }
`;

const CollapsibleWrapper = styled.div`
  width: max-content;
`;

class DatasourceDBEditor extends JSONtoForm<Props> {
  componentDidUpdate(prevProps: Props) {
    if (prevProps.datasourceId !== this.props.datasourceId) {
      super.componentDidUpdate(prevProps);
      this.props.setDatasourceEditorMode(this.props.datasourceId, true);
    }
  }

  save = () => {
    const normalizedValues = this.normalizeValues();
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.onSave(normalizedValues);
  };

  openOmnibarReadMore = () => {
    const { openOmnibarReadMore } = this.props;
    openOmnibarReadMore("connect to databases");
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "READ_MORE_DATASOURCE" });
  };

  test = () => {
    const normalizedValues = this.normalizeValues();
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.onTest(normalizedValues);
  };

  render() {
    const { formConfig } = this.props;
    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content);
  }

  renderDataSourceConfigForm = (sections: any) => {
    const {
      isSaving,
      applicationId,
      pageId,
      isTesting,
      isDeleting,
      datasourceId,
      handleDelete,
      pluginType,
      messages,
    } = this.props;
    const { viewMode } = this.props;
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <BackButton
          onClick={() =>
            history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId))
          }
        />
        <br />
        <Header>
          <FormTitleContainer>
            <PluginImage alt="Datasource" src={this.props.pluginImage} />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>
          {viewMode && (
            <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
              <ActionButton
                accent="secondary"
                className="t--edit-datasource"
                onClick={() => {
                  this.props.setDatasourceEditorMode(
                    this.props.datasourceId,
                    false,
                  );
                }}
                text="EDIT"
              />
            </Boxed>
          )}
        </Header>
        {messages &&
          messages.map((msg, i) => (
            <Callout fill key={i} text={msg} variant={Variant.warning} />
          ))}
        {cloudHosting && pluginType === PluginType.DB && !viewMode && (
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
            <SaveButtonContainer>
              <ActionButton
                accent="error"
                className="t--delete-datasource"
                loading={isDeleting}
                onClick={() => handleDelete(datasourceId)}
                text="Delete"
              />

              <ActionButton
                accent="secondary"
                className="t--test-datasource"
                loading={isTesting}
                onClick={this.test}
                text="Test"
              />
              <StyledButton
                className="t--save-datasource"
                disabled={this.validate()}
                filled
                intent="primary"
                loading={isSaving}
                onClick={this.save}
                size="small"
                text="Save"
              />
            </SaveButtonContainer>
          </>
        ) : (
          <Connected />
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

  return {
    messages: hintMessages,
  };
};

export default connect(mapStateToProps)(
  reduxForm<Datasource, DatasourceDBEditorProps>({
    form: DATASOURCE_DB_FORM,
  })(DatasourceDBEditor),
);

import React from "react";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";

import history from "utils/history";
import { Icon } from "@blueprintjs/core";
import FormTitle from "./FormTitle";

import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import Connected from "./Connected";

import { HelpBaseURL, HelpMap } from "constants/HelpConstants";
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
            <PluginImage src={this.props.pluginImage} alt="Datasource" />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>
          {viewMode && (
            <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
              <ActionButton
                className="t--edit-datasource"
                text="EDIT"
                accent="secondary"
                onClick={() => {
                  this.props.setDatasourceEditorMode(
                    this.props.datasourceId,
                    false,
                  );
                }}
              />
            </Boxed>
          )}
        </Header>
        {cloudHosting && pluginType === PluginType.DB && !viewMode && (
          <CollapsibleWrapper>
            <CollapsibleHelp>
              <span>{`Whitelist the IP ${convertArrayToSentence(
                APPSMITH_IP_ADDRESSES,
              )}  on your database instance to connect to it. `}</span>
              <a
                href={`${HelpBaseURL}${HelpMap["DATASOURCE_FORM"].path}`}
                target="_blank"
                rel="noopener noreferrer"
              >
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
                className="t--delete-datasource"
                text="Delete"
                accent="error"
                loading={isDeleting}
                onClick={() => handleDelete(datasourceId)}
              />

              <ActionButton
                className="t--test-datasource"
                text="Test"
                loading={isTesting}
                accent="secondary"
                onClick={this.test}
              />
              <StyledButton
                className="t--save-datasource"
                onClick={this.save}
                text="Save"
                disabled={this.validate()}
                loading={isSaving}
                intent="primary"
                filled
                size="small"
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

export default reduxForm<Datasource, DatasourceDBEditorProps>({
  form: DATASOURCE_DB_FORM,
})(DatasourceDBEditor);

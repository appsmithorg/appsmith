import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import _ from "lodash";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { Icon } from "@blueprintjs/core";
import FormTitle from "./FormTitle";
import Button, { Category } from "components/ads/Button";
import { Colors } from "constants/Colors";
import CollapsibleHelp from "components/designSystems/appsmith/help/CollapsibleHelp";
import Connected from "./Connected";

import EditButton from "components/editorComponents/Button";
import { Datasource } from "entities/Datasource";
import { reduxForm, InjectedFormProps } from "redux-form";
import { APPSMITH_IP_ADDRESSES } from "constants/DatasourceEditorConstants";
import { getAppsmithConfigs } from "configs";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { convertArrayToSentence } from "utils/helpers";
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
import { ButtonVariantTypes } from "components/constants";

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

const StyledButton = styled(EditButton)`
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
      this.props.setDatasourceEditorMode(this.props.datasourceId, true);
    }
  }

  save = () => {
    const normalizedValues = this.normalizeValues();
    const trimmedValues = this.getTrimmedData(normalizedValues);
    AnalyticsUtil.logEvent("SAVE_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });
    this.props.onSave(trimmedValues);
  };

  openOmnibarReadMore = () => {
    const { openOmnibarReadMore } = this.props;
    openOmnibarReadMore("connect to databases");
    AnalyticsUtil.logEvent("OPEN_OMNIBAR", { source: "READ_MORE_DATASOURCE" });
  };

  test = () => {
    const normalizedValues = this.normalizeValues();
    const trimmedValues = this.getTrimmedData(normalizedValues);
    AnalyticsUtil.logEvent("TEST_DATA_SOURCE_CLICK", {
      pageId: this.props.pageId,
      appId: this.props.applicationId,
    });

    this.props.onTest(trimmedValues);
  };

  render() {
    const { formConfig } = this.props;
    const content = this.renderDataSourceConfigForm(formConfig);
    return this.renderForm(content);
  }

  renderDataSourceConfigForm = (sections: any) => {
    const {
      datasourceId,
      handleDelete,
      isDeleting,
      isSaving,
      isTesting,
      messages,
      pluginType,
    } = this.props;
    const { viewMode } = this.props;
    return (
      <form
        onSubmit={(e) => {
          e.preventDefault();
        }}
      >
        <Header>
          <FormTitleContainer>
            <PluginImage alt="Datasource" src={this.props.pluginImage} />
            <FormTitle focusOnMount={this.props.isNewDatasource} />
          </FormTitleContainer>
          {viewMode && (
            <Boxed step={OnboardingStep.SUCCESSFUL_BINDING}>
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
                buttonStyle="DANGER"
                buttonVariant={ButtonVariantTypes.PRIMARY}
                // accent="error"
                className="t--delete-datasource"
                loading={isDeleting}
                onClick={() => handleDelete(datasourceId)}
                text="Delete"
              />

              <ActionButton
                // accent="secondary"
                buttonStyle="PRIMARY"
                buttonVariant={ButtonVariantTypes.SECONDARY}
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
    enableReinitialize: true,
  })(DatasourceDBEditor),
);

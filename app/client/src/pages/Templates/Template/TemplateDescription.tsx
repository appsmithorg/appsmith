import type { Template } from "api/TemplatesApi";
import React from "react";
import { useHistory, useParams } from "react-router";
import styled from "styled-components";
import DatasourceChip from "../DatasourceChip";
// import { Colors } from "constants/Colors";
// import {
//   FontWeight,
//   getTypographyByKey,
//   Text,
//   TextType,
// } from "design-system-old";
import { Button, Text } from "design-system";
import {
  createMessage,
  DATASOURCES,
  FORK_THIS_TEMPLATE,
  FUNCTION,
  INDUSTRY,
  NOTE,
  NOTE_MESSAGE,
  OVERVIEW,
  WIDGET_USED,
} from "@appsmith/constants/messages";
import WidgetInfo from "../WidgetInfo";
import ForkTemplate from "../ForkTemplate";
import { templateIdUrl } from "RouteBuilder";
import { useQuery } from "pages/Editor/utils";
import { useSelector } from "react-redux";
import { getForkableWorkspaces } from "selectors/templatesSelectors";

export const DescriptionWrapper = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spaces[17]}px;
  margin-top: ${(props) => props.theme.spaces[15]}px;
`;

export const DescriptionColumn = styled.div`
  flex: 1;
`;

export const Section = styled.div`
  padding-top: ${(props) => props.theme.spaces[12]}px;

  .section-content {
    margin-top: ${(props) => props.theme.spaces[3]}px;
  }

  .template-fork-button {
    margin-top: ${(props) => props.theme.spaces[7]}px;
  }

  .datasource-note {
    margin-top: ${(props) => props.theme.spaces[5]}px;
  }
`;

export const StyledDatasourceChip = styled(DatasourceChip)`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[10]}px`};
  .image {
    height: 25px;
    width: 25px;
  }
`;

export const TemplatesWidgetList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spaces[12]}px;
`;

export const TemplateDatasources = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spaces[4]}px;
`;

type TemplateDescriptionProps = {
  template: Template;
  hideForkButton?: boolean;
};

const SHOW_FORK_MODAL_PARAM = "showForkTemplateModal";

function TemplateDescription(props: TemplateDescriptionProps) {
  const { template } = props;
  const params = useParams<{
    templateId: string;
  }>();
  const history = useHistory();
  const query = useQuery();
  const workspaceList = useSelector(getForkableWorkspaces);

  const onForkButtonTrigger = () => {
    history.replace(
      `${templateIdUrl({ id: template.id })}?${SHOW_FORK_MODAL_PARAM}=true`,
    );
  };

  const onForkModalClose = () => {
    history.replace(`${templateIdUrl({ id: template.id })}`);
  };
  return (
    <DescriptionWrapper>
      <DescriptionColumn>
        <Section>
          <Text kind="heading-m" renderAs="h4">
            {createMessage(OVERVIEW)}
          </Text>
          <div className="section-content">
            <Text kind="body-m">{template.description}</Text>
          </div>
          {!props.hideForkButton && !!workspaceList.length && (
            <ForkTemplate
              onClose={onForkModalClose}
              showForkModal={!!query.get(SHOW_FORK_MODAL_PARAM)}
              templateId={params.templateId}
            >
              <Button
                className="template-fork-button"
                data-testid="template-fork-button"
                onClick={onForkButtonTrigger}
                size="md"
                startIcon="fork-2"
              >
                {createMessage(FORK_THIS_TEMPLATE)}
              </Button>
            </ForkTemplate>
          )}
        </Section>
        <Section>
          <Text kind="heading-m" renderAs="h4">
            {createMessage(FUNCTION)}
          </Text>
          <div className="section-content">
            <Text kind="body-m">{template.functions.join(" • ")}</Text>
          </div>
        </Section>
        <Section>
          <Text kind="heading-m" renderAs="h4">
            {createMessage(INDUSTRY)}
          </Text>
          <div className="section-content">
            <Text kind="body-m">{template.useCases.join(" • ")}</Text>
          </div>
        </Section>
      </DescriptionColumn>
      <DescriptionColumn>
        <Section>
          <Text kind="heading-m" renderAs="h4">
            {createMessage(DATASOURCES)}
          </Text>
          <div className="section-content">
            <TemplateDatasources>
              {template.datasources.map((packageName) => {
                return (
                  <StyledDatasourceChip
                    key={packageName}
                    pluginPackageName={packageName}
                  />
                );
              })}
            </TemplateDatasources>
            <div className="datasource-note">
              <Text kind="body-m">{createMessage(NOTE)}</Text>
              <Text kind="body-m">{createMessage(NOTE_MESSAGE)}</Text>
            </div>
          </div>
        </Section>
        <Section>
          <Text kind="heading-m" renderAs="h4">
            {createMessage(WIDGET_USED)}
          </Text>
          <div className="section-content">
            <TemplatesWidgetList>
              {template.widgets.map((widgetType) => {
                return <WidgetInfo key={widgetType} widgetType={widgetType} />;
              })}
            </TemplatesWidgetList>
          </div>
        </Section>
      </DescriptionColumn>
    </DescriptionWrapper>
  );
}

export default TemplateDescription;

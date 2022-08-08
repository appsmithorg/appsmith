import { Template } from "api/TemplatesApi";
import React, { useState } from "react";
import { useParams } from "react-router";
import styled from "styled-components";
import { getTypographyByKey } from "constants/DefaultTheme";
import DatasourceChip from "../DatasourceChip";
import { Colors } from "constants/Colors";
import {
  Button,
  FontWeight,
  IconPositions,
  Size,
  Text,
  TextType,
} from "design-system";
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
  span {
    ${(props) => getTypographyByKey(props, "h4")}
    color: ${Colors.EBONY_CLAY};
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

function TemplateDescription(props: TemplateDescriptionProps) {
  const [showForkModal, setShowForkModal] = useState(false);
  const params = useParams<{ templateId: string }>();

  const onForkButtonTrigger = () => {
    setShowForkModal(true);
  };

  const onForkModalClose = () => {
    setShowForkModal(false);
  };

  const { template } = props;
  return (
    <DescriptionWrapper>
      <DescriptionColumn>
        <Section>
          <Text type={TextType.H1}>{createMessage(OVERVIEW)}</Text>
          <div className="section-content">
            <Text type={TextType.H4} weight={FontWeight.NORMAL}>
              {template.description}
            </Text>
          </div>
          {!props.hideForkButton && (
            <ForkTemplate
              onClose={onForkModalClose}
              showForkModal={showForkModal}
              templateId={params.templateId}
            >
              <Button
                className="template-fork-button"
                icon="fork-2"
                iconPosition={IconPositions.left}
                onClick={onForkButtonTrigger}
                size={Size.large}
                tag="button"
                text={createMessage(FORK_THIS_TEMPLATE)}
                width="228px"
              />
            </ForkTemplate>
          )}
        </Section>
        <Section>
          <Text type={TextType.H1}>{createMessage(FUNCTION)}</Text>
          <div className="section-content">
            <Text type={TextType.H4} weight={FontWeight.NORMAL}>
              {template.functions.join(" • ")}
            </Text>
          </div>
        </Section>
        <Section>
          <Text type={TextType.H1}>{createMessage(INDUSTRY)}</Text>
          <div className="section-content">
            <Text type={TextType.H4} weight={FontWeight.NORMAL}>
              {template.useCases.join(" • ")}
            </Text>
          </div>
        </Section>
      </DescriptionColumn>
      <DescriptionColumn>
        <Section>
          <Text type={TextType.H1}>{createMessage(DATASOURCES)}</Text>
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
              <Text type={TextType.H4}>{createMessage(NOTE)} </Text>
              <Text type={TextType.H4} weight={FontWeight.NORMAL}>
                {createMessage(NOTE_MESSAGE)}
              </Text>
            </div>
          </div>
        </Section>
        <Section>
          <Text type={TextType.H1}>{createMessage(WIDGET_USED)}</Text>
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

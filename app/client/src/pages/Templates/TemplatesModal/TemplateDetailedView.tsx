import {
  createMessage,
  DATASOURCES,
  FUNCTION,
  INDUSTRY,
  NOTE,
  NOTE_MESSAGE,
  OVERVIEW,
  SIMILAR_TEMPLATES,
  VIEW_ALL_TEMPLATES,
  WIDGET_USED,
} from "@appsmith/constants/messages";
import {
  getSimilarTemplatesInit,
  getTemplateInformation,
} from "actions/templateActions";
import Icon, { IconSize } from "components/ads/Icon";
import Text, { FontWeight, TextType } from "components/ads/Text";
import React, { useEffect, useState, useRef } from "react";
import { useDispatch, useSelector } from "react-redux";
import Masonry from "react-masonry-css";
import { AppState } from "reducers";
import {
  getActiveTemplateSelector,
  isFetchingTemplateSelector,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import styled from "styled-components";
import {
  DescriptionColumn,
  DescriptionWrapper,
  IframeTopBar,
  IframeWrapper,
  Section,
  SimilarTemplatesTitleWrapper,
  SimilarTemplatesWrapper,
  StyledDatasourceChip,
  TemplateDatasources,
  TemplatesWidgetList,
} from "../TemplateView";
import WidgetInfo from "../WidgetInfo";
import PageSelection from "./PageSelection";
import TemplateComponent from "../Template";
import LoadingScreen from "./LoadingScreen";

const breakpointColumnsObject = {
  default: 4,
  2100: 3,
  1600: 2,
  1100: 1,
};

const Wrapper = styled.div`
  height: 85vh;
  overflow: auto;
`;

const BackButtonWrapper = styled.div<{ width?: number }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spaces[2]}px;
  ${(props) => props.width && `width: ${props.width};`}
`;

const CloseIcon = styled(Icon)`
  svg {
    height: 24px;
    width: 24px;
  }
`;

const Body = styled.div`
  margin-top: 42px;
  padding: 0 52px;
`;

const StyledSimilarTemplatesWrapper = styled(SimilarTemplatesWrapper)`
  padding-left: 0px;
  padding-right: 0px;
`;

type TemplateDetailedViewProps = {
  templateId: string;
  onBackPress: () => void;
  onClose: () => void;
};

function TemplateDetailedView(props: TemplateDetailedViewProps) {
  const [currentTemplateId, setCurrentTemplateId] = useState(props.templateId);
  const dispatch = useDispatch();
  const similarTemplates = useSelector(
    (state: AppState) => state.ui.templates.similarTemplates,
  );
  const isFetchingTemplate = useSelector(isFetchingTemplateSelector);
  const isImportingTemplateToApp = useSelector(
    isImportingTemplateToAppSelector,
  );
  const currentTemplate = useSelector(getActiveTemplateSelector);
  const containerRef = useRef<HTMLDivElement>(null);
  const LoadingText = isImportingTemplateToApp
    ? "Setting up the template"
    : "Loading template details";

  useEffect(() => {
    dispatch(getTemplateInformation(currentTemplateId));
    dispatch(getSimilarTemplatesInit(currentTemplateId));
  }, [currentTemplateId]);

  const onSimilarTemplateClick = (id: string) => {
    setCurrentTemplateId(id);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0 });
    }
  };

  if (isFetchingTemplate || isImportingTemplateToApp) {
    return <LoadingScreen text={LoadingText} />;
  }

  if (!currentTemplate) {
    return null;
  }

  return (
    <Wrapper ref={containerRef}>
      <div className="flex justify-between">
        <BackButtonWrapper onClick={props.onBackPress}>
          <Icon name="view-less" size={IconSize.XL} />
          <Text type={TextType.P4}>BACK TO TEMPLATES</Text>
        </BackButtonWrapper>
        <CloseIcon name="close-x" onClick={props.onClose} />
      </div>
      <Body className="flex flex-row">
        <div className="flex flex-1 flex-col">
          <Text type={TextType.DANGER_HEADING}>{currentTemplate.title}</Text>
          <IframeWrapper>
            <IframeTopBar>
              <div className="round red" />
              <div className="round yellow" />
              <div className="round green" />
            </IframeTopBar>
            <iframe
              src={`${currentTemplate.appUrl}?embed=true`}
              width={"100%"}
            />
          </IframeWrapper>
          <DescriptionWrapper>
            <DescriptionColumn>
              <Section>
                <Text type={TextType.H1}>{createMessage(OVERVIEW)}</Text>
                <div className="section-content">
                  <Text type={TextType.H4} weight={FontWeight.NORMAL}>
                    {currentTemplate.description}
                  </Text>
                </div>
              </Section>
              <Section>
                <Text type={TextType.H1}>{createMessage(FUNCTION)}</Text>
                <div className="section-content">
                  <Text type={TextType.H4} weight={FontWeight.NORMAL}>
                    {currentTemplate.functions.join(" • ")}
                  </Text>
                </div>
              </Section>
              <Section>
                <Text type={TextType.H1}>{createMessage(INDUSTRY)}</Text>
                <div className="section-content">
                  <Text type={TextType.H4} weight={FontWeight.NORMAL}>
                    {currentTemplate.useCases.join(" • ")}
                  </Text>
                </div>
              </Section>
            </DescriptionColumn>
            <DescriptionColumn>
              <Section>
                <Text type={TextType.H1}>{createMessage(DATASOURCES)}</Text>
                <div className="section-content">
                  <TemplateDatasources>
                    {currentTemplate.datasources.map((packageName) => {
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
                    {currentTemplate.widgets.map((widgetType) => {
                      return (
                        <WidgetInfo key={widgetType} widgetType={widgetType} />
                      );
                    })}
                  </TemplatesWidgetList>
                </div>
              </Section>
            </DescriptionColumn>
          </DescriptionWrapper>
          {!!similarTemplates.length && (
            <StyledSimilarTemplatesWrapper>
              <Section>
                <SimilarTemplatesTitleWrapper>
                  <Text type={TextType.H1} weight={FontWeight.BOLD}>
                    {createMessage(SIMILAR_TEMPLATES)}
                  </Text>
                  <BackButtonWrapper onClick={props.onBackPress}>
                    <Text type={TextType.P4}>
                      {createMessage(VIEW_ALL_TEMPLATES)}
                    </Text>
                    <Icon name="view-all" size={IconSize.XL} />
                  </BackButtonWrapper>
                </SimilarTemplatesTitleWrapper>
                <Masonry
                  breakpointCols={breakpointColumnsObject}
                  className="grid"
                  columnClassName="grid_column"
                >
                  {similarTemplates.map((template) => (
                    <TemplateComponent
                      key={template.id}
                      onClick={() => {
                        onSimilarTemplateClick(template.id);
                      }}
                      template={template}
                    />
                  ))}
                </Masonry>
              </Section>
            </StyledSimilarTemplatesWrapper>
          )}
        </div>
        <PageSelection
          pageNames={currentTemplate.pageNames || []}
          templateId={props.templateId}
        />
      </Body>
    </Wrapper>
  );
}

export default TemplateDetailedView;

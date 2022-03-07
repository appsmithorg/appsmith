import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import Masonry from "react-masonry-css";
import { Classes } from "@blueprintjs/core";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import Text, { FontWeight, TextType } from "components/ads/Text";
import Button, { IconPositions, Size } from "components/ads/Button";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import Template from "./Template";
import DatasourceChip from "./DatasourceChip";
import WidgetInfo from "./WidgetInfo";
import {
  getTemplateById,
  isFetchingTemplatesSelector,
} from "selectors/templatesSelectors";
import ForkTemplate from "./ForkTemplate";
import LeftPaneTemplateList from "./LeftPaneTemplateList";
import { getSimilarTemplatesInit } from "actions/templateActions";
import { AppState } from "reducers";
import { Icon, IconSize } from "components/ads";
import history from "utils/history";
import { TEMPLATES_URL } from "constants/routes";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";
import {
  createMessage,
  GO_BACK,
  OVERVIEW,
  FORK_THIS_TEMPLATE,
  FUNCTION,
  INDUSTRY,
  NOTE,
  NOTE_MESSAGE,
  WIDGET_USED,
  DATASOURCES,
  SIMILAR_TEMPLATES,
} from "@appsmith/constants/messages";

const Wrapper = styled.div`
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
  overflow: auto;

  .breadcrumb-placeholder {
    margin-top: ${(props) => props.theme.spaces[12]}px;
    height: 16px;
    width: 195px;
  }
  .title-placeholder {
    margin-top: ${(props) => props.theme.spaces[11]}px;
    height: 28px;
    width: 269px;
  }
  .iframe-placeholder {
    margin-top: ${(props) => props.theme.spaces[12]}px;
    height: 500px;
    width: 100%;
  }
`;

const TemplateViewWrapper = styled.div`
  padding-right: ${(props) => props.theme.spaces[12]}px;
  padding-left: ${(props) => props.theme.spaces[12]}px;
  padding-bottom: 84px;
`;

const Title = styled(Text)`
  margin-top: ${(props) => props.theme.spaces[11]}px;
  display: inline-block;
`;

const IframeWrapper = styled.div`
  height: 734px;
  width: 100%;
  border-radius: 16px;
  margin-top: ${(props) => props.theme.spaces[12]}px;

  iframe {
    border-radius: 0px 0px 16px 16px;
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
    height: calc(100% - 41px);
  }
`;

const DescriptionWrapper = styled.div`
  display: flex;
  gap: ${(props) => props.theme.spaces[17]}px;
`;

const DescriptionColumn = styled.div`
  flex: 1;
`;

const Section = styled.div`
  padding-top: ${(props) => props.theme.spaces[12]}px;

  .section-content {
    margin-top: ${(props) => props.theme.spaces[9]}px;
  }

  .template-fork-button {
    margin-top: ${(props) => props.theme.spaces[7]}px;
  }

  .datasource-note {
    margin-top: ${(props) => props.theme.spaces[5]}px;
  }
`;

const StyledDatasourceChip = styled(DatasourceChip)`
  padding: ${(props) =>
    `${props.theme.spaces[4]}px ${props.theme.spaces[10]}px`};
  .image {
    height: 25px;
    width: 25px;
  }
  span {
    ${(props) => getTypographyByKey(props, "h2")}
    color: ${Colors.EBONY_CLAY};
  }
`;

const TemplatesWidgetList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spaces[12]}px;
`;

const TemplateDatasources = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spaces[4]}px;
`;

const SimilarTemplatesWrapper = styled.div`
  padding-right: ${(props) => props.theme.spaces[12]}px;
  padding-left: ${(props) => props.theme.spaces[12]}px;
  background-color: rgba(248, 248, 248, 0.5);

  .grid {
    display: flex;
    margin-left: ${(props) => -props.theme.spaces[9]}px;
    margin-top: ${(props) => props.theme.spaces[12]}px;
  }

  .grid_column {
    padding-left: ${(props) => props.theme.spaces[9]}px;
  }
`;

const IframeTopBar = styled.div`
  width: 100%;
  background-color: ${Colors.GEYSER_LIGHT};
  border-radius: 8px 8px 0px 0px;
  display: flex;
  gap: ${(props) => props.theme.spaces[3]}px;
  height: 41px;
  align-items: center;
  padding-left: ${(props) => props.theme.spaces[5]}px;

  .round {
    height: 12px;
    width: 12px;
    border-radius: 6px;
  }

  .red {
    background-color: ${Colors.PERSIMMON};
  }
  .yellow {
    background-color: ${Colors.SUNGLOW_2};
  }
  .green {
    background-color: ${Colors.MOUNTAIN_MEADOW};
  }
`;

const PageWrapper = styled.div`
  display: flex;
  margin-top: ${(props) => props.theme.homePage.header}px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
`;

const BackButtonWrapper = styled.div`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spaces[2]}px;
  margin-top: ${(props) => props.theme.spaces[12]}px;
`;

function TemplateViewLoader() {
  return (
    <Wrapper>
      <TemplateViewWrapper>
        <div className={`breadcrumb-placeholder ${Classes.SKELETON}`} />
        <div className={`title-placeholder ${Classes.SKELETON}`} />
        <div className={`iframe-placeholder ${Classes.SKELETON}`} />
      </TemplateViewWrapper>
    </Wrapper>
  );
}

function TemplateNotFound() {
  return (
    <Wrapper>
      <EntityNotFoundPane />;
    </Wrapper>
  );
}

function TemplateView() {
  const dispatch = useDispatch();
  const similarTemplates = useSelector(
    (state: AppState) => state.ui.templates.similarTemplates,
  );
  const isFetchingTemplates = useSelector(isFetchingTemplatesSelector);
  const params = useParams<{ templateId: string }>();
  const currentTemplate = useSelector(getTemplateById(params.templateId));
  const [showForkModal, setShowForkModal] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const onForkButtonTrigger = () => {
    setShowForkModal(true);
  };

  const onForkModalClose = () => {
    setShowForkModal(false);
  };

  const goToTemplateListView = () => {
    history.push(TEMPLATES_URL);
  };

  useEffect(() => {
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0, behavior: "smooth" });
      dispatch(getSimilarTemplatesInit(params.templateId));
    }
  }, [params.templateId]);

  return (
    <PageWrapper>
      <LeftPaneTemplateList />
      {isFetchingTemplates ? (
        <TemplateViewLoader />
      ) : !currentTemplate ? (
        <TemplateNotFound />
      ) : (
        <Wrapper ref={containerRef}>
          <TemplateViewWrapper>
            <BackButtonWrapper onClick={goToTemplateListView}>
              <Icon name="view-less" size={IconSize.XL} />
              <Text type={TextType.P4}>{createMessage(GO_BACK)}</Text>
            </BackButtonWrapper>

            <Title type={TextType.DANGER_HEADING}>
              {currentTemplate.title}
            </Title>
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
                </Section>
                <Section>
                  <Text type={TextType.H1}>{createMessage(FUNCTION)}</Text>
                  <div className="section-content">
                    <Text type={TextType.H1} weight={FontWeight.NORMAL}>
                      {currentTemplate.functions.join(" • ")}
                    </Text>
                  </div>
                </Section>
                <Section>
                  <Text type={TextType.H1}>{createMessage(INDUSTRY)}</Text>
                  <div className="section-content">
                    <Text type={TextType.H1} weight={FontWeight.NORMAL}>
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
                          <WidgetInfo
                            key={widgetType}
                            widgetType={widgetType}
                          />
                        );
                      })}
                    </TemplatesWidgetList>
                  </div>
                </Section>
              </DescriptionColumn>
            </DescriptionWrapper>
          </TemplateViewWrapper>

          {!!similarTemplates.length && (
            <SimilarTemplatesWrapper>
              <Section>
                <Text type={TextType.H1} weight={FontWeight.BOLD}>
                  {createMessage(SIMILAR_TEMPLATES)}
                </Text>
                <Masonry
                  breakpointCols={3}
                  className="grid"
                  columnClassName="grid_column"
                >
                  {similarTemplates.map((template) => (
                    <Template key={template.id} template={template} />
                  ))}
                </Masonry>
              </Section>
            </SimilarTemplatesWrapper>
          )}
        </Wrapper>
      )}
    </PageWrapper>
  );
}

export default TemplateView;

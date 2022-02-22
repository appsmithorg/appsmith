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

const Wrapper = styled.div`
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
  overflow: auto;

  .breadcrumb-placeholder {
    margin-top: 30px;
    height: 16px;
    width: 195px;
  }
  .title-placeholder {
    margin-top: 26px;
    height: 28px;
    width: 269px;
  }
  .iframe-placeholder {
    margin-top: 29px;
    height: 500px;
    width: 100%;
  }
`;

const TemplateViewWrapper = styled.div`
  padding-right: 32px;
  padding-left: 32px;
  padding-bottom: 84px;
`;

const Title = styled(Text)`
  margin-top: 26px;
  display: inline-block;
`;

const IframeWrapper = styled.div`
  border: 1px solid #6eb9f0;
  background: rgba(110, 185, 240, 0.08);
  height: 734px;
  width: 100%;
  border-radius: 16px;
  padding: 18px;
  margin-top: 29px;
`;

const DescriptionWrapper = styled.div`
  display: flex;
  gap: 45px;
`;

const DescriptionColumn = styled.div`
  flex: 1;
`;

const Section = styled.div`
  padding-top: 32px;

  .section-content {
    margin-top: 20px;
  }

  .template-fork-button {
    margin-top: 16px;
  }

  .datasource-note {
    margin-top: 12px;
  }
`;

const StyledDatasourceChip = styled(DatasourceChip)`
  padding: 10px 22px;
  .image {
    height: 25px;
    width: 25px;
  }
  span {
    font-weight: 500;
    font-size: 18px;
    line-height: 24px;
    letter-spacing: -0.24px;
    color: #2a2f3d;
  }
`;

const TemplatesWidgetList = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 30px;
`;

const TemplateDatasources = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
`;

const SimilarTemplatesWrapper = styled.div`
  padding-right: 32px;
  padding-left: 32px;
  background-color: rgba(248, 248, 248, 0.5);

  .grid {
    display: flex;
    margin-left: -20px;
    margin-top: 32px;
  }

  .grid_column {
    padding-left: 20px;
  }
`;

const PageWrapper = styled.div`
  display: flex;
  margin-top: ${(props) => props.theme.homePage.header}px;
  height: calc(100vh - ${(props) => props.theme.homePage.header}px);
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
            <Title type={TextType.DANGER_HEADING}>
              {currentTemplate.title}
            </Title>
            <IframeWrapper>
              <iframe
                height={"100%"}
                src={`${currentTemplate.appUrl}?embed=true`}
                width={"100%"}
              />
            </IframeWrapper>
            <DescriptionWrapper>
              <DescriptionColumn>
                <Section>
                  <Text type={TextType.H1}>Overview</Text>
                  <div className="section-content">
                    <Text type={TextType.H4} weight={FontWeight.NORMAL}>
                      {currentTemplate.description}
                    </Text>
                  </div>
                  <ForkTemplate
                    onClose={onForkModalClose}
                    showForkModal={showForkModal}
                  >
                    <Button
                      className="template-fork-button"
                      icon="fork-2"
                      iconPosition={IconPositions.left}
                      onClick={onForkButtonTrigger}
                      size={Size.large}
                      tag="button"
                      text="FORK THIS TEMPLATE"
                      width="228px"
                    />
                  </ForkTemplate>
                </Section>
                <Section>
                  <Text type={TextType.H1}>Function</Text>
                  <div className="section-content">
                    <Text type={TextType.H1} weight={FontWeight.NORMAL}>
                      {currentTemplate.functions.join(" • ")}
                    </Text>
                  </div>
                </Section>
                <Section>
                  <Text type={TextType.H1}>Industry</Text>
                  <div className="section-content">
                    <Text type={TextType.H1} weight={FontWeight.NORMAL}>
                      {currentTemplate.useCases.join(" • ")}
                    </Text>
                  </div>
                </Section>
              </DescriptionColumn>
              <DescriptionColumn>
                <Section>
                  <Text type={TextType.H1}>Data Sources</Text>
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
                      <Text type={TextType.H4}>Note: </Text>
                      <Text type={TextType.H4} weight={FontWeight.NORMAL}>
                        You can add your data sources as well
                      </Text>
                    </div>
                  </div>
                </Section>
                <Section>
                  <Text type={TextType.H1}>Widgets Used</Text>
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
                  Similar Templates
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

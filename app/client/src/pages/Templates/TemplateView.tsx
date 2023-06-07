import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import {
  getActiveTemplateSelector,
  getForkableWorkspaces,
  isFetchingTemplateSelector,
} from "selectors/templatesSelectors";
import {
  getSimilarTemplatesInit,
  getTemplateInformation,
} from "actions/templateActions";
import type { AppState } from "@appsmith/reducers";
import history from "utils/history";
import { TEMPLATES_PATH } from "constants/routes";
import { Colors } from "constants/Colors";
import { createMessage, GO_BACK } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
import TemplateDescription from "./Template/TemplateDescription";
import SimilarTemplates from "./Template/SimilarTemplates";
import { templateIdUrl } from "RouteBuilder";
import { Text, Link } from "design-system";

const breakpointColumnsObject = {
  default: 4,
  3000: 3,
  1500: 3,
  1024: 2,
  800: 1,
};

const Wrapper = styled.div`
  overflow: auto;
  position: relative;
`;

const TemplateViewWrapper = styled.div`
  padding-right: 132px;
  padding-left: 132px;
  padding-top: var(--ads-v2-spaces-7);
  padding-bottom: 80px;
  background-color: var(--ads-v2-color-bg);
`;

const HeaderWrapper = styled.div`
  display: flex;
  align-items: center;

  .left,
  .right {
    flex: 1;
  }
`;

const Title = styled(Text)`
  display: inline-block;
  color: var(--ads-v2-color-fg-emphasis-plus);
`;

export const IframeWrapper = styled.div`
  border-radius: 16px;
  margin-top: ${(props) => props.theme.spaces[12]}px;

  iframe {
    border-radius: 0px 0px 16px 16px;
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
    width: 100%;
    height: 734px;
  }
`;

export const IframeTopBar = styled.div`
  width: 100%;
  background-color: var(--ads-v2-color-bg-muted);
  border-radius: 8px 8px 0px 0px;
  display: flex;
  gap: ${(props) => props.theme.spaces[3]}px;
  height: 41px;
  align-items: center;
  padding-left: ${(props) => props.theme.spaces[5]}px;

  .round {
    height: 12px;
    width: 12px;
    border-radius: var(--ads-v2-border-radius-circle);
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

// const BackButtonWrapper = styled.div<{ width?: number }>`
//   cursor: pointer;
//   display: flex;
//   align-items: center;
//   gap: ${(props) => props.theme.spaces[2]}px;
//   ${(props) => props.width && `width: ${props.width};`}
// `;

const LoadingWrapper = styled.div`
  width: calc(100vw);
  .title-placeholder {
    margin-top: ${(props) => props.theme.spaces[11]}px;
    height: 28px;
    width: 100%;
  }
  .iframe-placeholder {
    margin-top: ${(props) => props.theme.spaces[12]}px;
    height: 500px;
    width: 100%;
  }
`;

function TemplateViewLoader() {
  return (
    <LoadingWrapper>
      <TemplateViewWrapper>
        <div className={`title-placeholder ${Classes.SKELETON}`} />
        <div className={`iframe-placeholder ${Classes.SKELETON}`} />
      </TemplateViewWrapper>
    </LoadingWrapper>
  );
}

function TemplateNotFound() {
  return <EntityNotFoundPane />;
}

function TemplateView() {
  const dispatch = useDispatch();
  const similarTemplates = useSelector(
    (state: AppState) => state.ui.templates.similarTemplates,
  );
  const isFetchingTemplate = useSelector(isFetchingTemplateSelector);
  const workspaceList = useSelector(getForkableWorkspaces);
  const params = useParams<{ templateId: string }>();
  const currentTemplate = useSelector(getActiveTemplateSelector);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToTemplateListView = () => {
    history.push(TEMPLATES_PATH);
  };

  useEffect(() => {
    dispatch(getTemplateInformation(params.templateId));
    dispatch(getSimilarTemplatesInit(params.templateId));
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0 });
    }
  }, [params.templateId]);

  const goBack = () => {
    history.goBack();
  };

  const onSimilarTemplateClick = (template: TemplateInterface) => {
    AnalyticsUtil.logEvent("SIMILAR_TEMPLATE_CLICK", {
      from: {
        id: currentTemplate?.id,
        name: currentTemplate?.title,
      },
      to: {
        id: template.id,
        name: template.title,
      },
    });
    history.push(templateIdUrl({ id: template.id }));
  };

  return (
    <PageWrapper>
      {isFetchingTemplate ? (
        <TemplateViewLoader />
      ) : !currentTemplate ? (
        <TemplateNotFound />
      ) : (
        <Wrapper ref={containerRef}>
          <ReconnectDatasourceModal />
          <TemplateViewWrapper>
            <HeaderWrapper>
              <div className="left" data-testid="t--template-view-goback">
                <Link onClick={goBack} startIcon="arrow-left-line">
                  {createMessage(GO_BACK)}
                </Link>
              </div>
              <Title kind="heading-l" renderAs="h1">
                {currentTemplate.title}
              </Title>
              <div className="right" />
            </HeaderWrapper>
            <IframeWrapper>
              <IframeTopBar>
                <div className="round red" />
                <div className="round yellow" />
                <div className="round green" />
              </IframeTopBar>
              <iframe src={currentTemplate.appUrl} width={"100%"} />
            </IframeWrapper>
            <TemplateDescription template={currentTemplate} />
          </TemplateViewWrapper>
          <SimilarTemplates
            breakpointCols={breakpointColumnsObject}
            isForkingEnabled={!!workspaceList.length}
            onBackPress={goToTemplateListView}
            onClick={onSimilarTemplateClick}
            similarTemplates={similarTemplates}
          />
        </Wrapper>
      )}
    </PageWrapper>
  );
}

export default TemplateView;

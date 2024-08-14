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
import type { AppState } from "ee/reducers";
import history from "utils/history";
import { TEMPLATES_PATH } from "constants/routes";
import { Colors } from "constants/Colors";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
import TemplateDescription from "./Template/TemplateDescription";
import SimilarTemplates from "./Template/SimilarTemplates";
import { templateIdUrl } from "ee/RouteBuilder";
import TemplateViewHeader from "./TemplateViewHeader";
import { registerEditorWidgets } from "utils/editor/EditorUtils";

const Wrapper = styled.div`
  overflow: auto;
  position: relative;
  width: 100%;
`;

const TemplateViewWrapper = styled.div<{ isModalLayout?: boolean }>`
  ${(props) =>
    props.isModalLayout
      ? `padding-right: 12px; padding-left: 12px;`
      : `padding-right: 132px; padding-left: 132px;`}
  padding-top: var(--ads-v2-spaces-7);
  padding-bottom: 80px;
  background-color: var(--ads-v2-color-bg);
`;

export const IframeWrapper = styled.div`
  border-radius: 16px;
  margin-top: ${(props) => props.theme.spaces[12]}px;

  iframe {
    border-radius: 0px 0px 16px 16px;
    box-shadow:
      0px 20px 24px -4px rgba(16, 24, 40, 0.1),
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

const LoadingWrapper = styled.div`
  height: 100vh;
  width: 100%;
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

interface TemplateViewProps {
  isModalLayout?: boolean;
  onClickUseTemplate?: (id: string) => void;
  showBack?: boolean;
  showSimilarTemplate?: boolean;
  templateId: string;
  handleBackPress?: () => void;
  handleSimilarTemplateClick?: (templateId: TemplateInterface) => void;
  similarTemplatesClassName?: string;
}

export function TemplateView({
  handleBackPress,
  handleSimilarTemplateClick,
  isModalLayout = false,
  onClickUseTemplate,
  showBack = true,
  showSimilarTemplate = true,
  similarTemplatesClassName = "",
  templateId,
}: TemplateViewProps) {
  const dispatch = useDispatch();
  const similarTemplates = useSelector(
    (state: AppState) => state.ui.templates.similarTemplates,
  );
  const isFetchingTemplate = useSelector(isFetchingTemplateSelector);
  const workspaceList = useSelector(getForkableWorkspaces);
  const currentTemplate = useSelector(getActiveTemplateSelector);
  const containerRef = useRef<HTMLDivElement>(null);

  const goToTemplateListView = () => {
    handleBackPress ? handleBackPress() : history.push(TEMPLATES_PATH);
  };

  useEffect(() => {
    registerEditorWidgets();
  }, []);
  useEffect(() => {
    dispatch(getTemplateInformation(templateId));
    dispatch(getSimilarTemplatesInit(templateId));
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0 });
    }
  }, [templateId]);

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
    handleSimilarTemplateClick
      ? handleSimilarTemplateClick(template)
      : history.push(templateIdUrl({ id: template.id }));
  };

  return isFetchingTemplate ? (
    <TemplateViewLoader />
  ) : !currentTemplate ? (
    <TemplateNotFound />
  ) : (
    <Wrapper ref={containerRef}>
      <ReconnectDatasourceModal />
      <TemplateViewWrapper isModalLayout={isModalLayout}>
        <TemplateViewHeader
          handleBackPress={handleBackPress}
          onClickUseTemplate={onClickUseTemplate}
          showBack={showBack}
          templateId={templateId}
        />
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
      {showSimilarTemplate && (
        <SimilarTemplates
          className={similarTemplatesClassName}
          isForkingEnabled={!!workspaceList.length}
          onBackPress={goToTemplateListView}
          onClick={onSimilarTemplateClick}
          similarTemplates={similarTemplates}
        />
      )}
    </Wrapper>
  );
}

function TemplateViewContainer() {
  const params = useParams<{ templateId: string }>();
  return (
    <PageWrapper>
      <TemplateView templateId={params.templateId} />
    </PageWrapper>
  );
}

export default TemplateViewContainer;

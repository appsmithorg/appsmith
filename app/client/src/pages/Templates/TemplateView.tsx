import React, { useEffect, useRef } from "react";
import styled from "styled-components";
import { Classes } from "@blueprintjs/core";
import { useParams } from "react-router";
import { useDispatch, useSelector } from "react-redux";
import { Icon, IconSize, Text, TextType } from "design-system";
import EntityNotFoundPane from "pages/Editor/EntityNotFoundPane";
import { Template as TemplateInterface } from "api/TemplatesApi";
import {
  getActiveTemplateSelector,
  isFetchingTemplateSelector,
} from "selectors/templatesSelectors";
import {
  getSimilarTemplatesInit,
  getTemplateInformation,
} from "actions/templateActions";
import { AppState } from "@appsmith/reducers";
import history from "utils/history";
import { TEMPLATES_PATH } from "constants/routes";
import { Colors } from "constants/Colors";
import { createMessage, GO_BACK } from "@appsmith/constants/messages";
import AnalyticsUtil from "utils/AnalyticsUtil";
import ReconnectDatasourceModal from "pages/Editor/gitSync/ReconnectDatasourceModal";
import TemplateDescription from "./Template/TemplateDescription";
import SimilarTemplates from "./Template/SimilarTemplates";
import { templateIdUrl } from "RouteBuilder";

const breakpointColumnsObject = {
  default: 4,
  1600: 3,
  1100: 2,
  700: 1,
};

const Wrapper = styled.div`
  overflow: auto;
  position: relative;
`;

const TemplateViewWrapper = styled.div`
  padding-right: 132px;
  padding-left: 132px;
  padding-top: ${(props) => props.theme.spaces[12]}px;
  padding-bottom: 80px;
  background-color: ${Colors.WHITE};
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

const BackButtonWrapper = styled.div<{ width?: number }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spaces[2]}px;
  ${(props) => props.width && `width: ${props.width};`}
`;

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
              <div className="left">
                <BackButtonWrapper onClick={goBack}>
                  <Icon name="view-less" size={IconSize.XL} />
                  <Text type={TextType.P4}>{createMessage(GO_BACK)}</Text>
                </BackButtonWrapper>
              </div>
              <Title type={TextType.DANGER_HEADING}>
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
              <iframe
                src={`${currentTemplate.appUrl}?embed=true`}
                width={"100%"}
              />
            </IframeWrapper>
            <TemplateDescription template={currentTemplate} />
          </TemplateViewWrapper>
          <SimilarTemplates
            breakpointCols={breakpointColumnsObject}
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

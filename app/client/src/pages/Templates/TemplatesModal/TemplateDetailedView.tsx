import {
  createMessage,
  FETCHING_TEMPLATES,
  FORKING_TEMPLATE,
  SIMILAR_TEMPLATES,
  VIEW_ALL_TEMPLATES,
} from "@appsmith/constants/messages";
import {
  getSimilarTemplatesInit,
  getTemplateInformation,
  importTemplateIntoApplication,
} from "actions/templateActions";
import Icon, { IconSize } from "components/ads/Icon";
import { Text, FontWeight, TextType } from "design-system";
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
  IframeTopBar,
  IframeWrapper,
  SimilarTemplatesTitleWrapper,
  SimilarTemplatesWrapper,
} from "../TemplateView";
import PageSelection from "./PageSelection";
import TemplateComponent from "../Template";
import LoadingScreen from "./LoadingScreen";
import { Template } from "api/TemplatesApi";
import { generatePath, matchPath } from "react-router";
import { isURLDeprecated, trimQueryString } from "utils/helpers";
import { VIEWER_PATH, VIEWER_PATH_DEPRECATED } from "constants/routes";
import TemplateModalHeader from "./Header";
import TemplateDescription, { Section } from "../Template/TemplateDescription";

const breakpointColumns = {
  default: 4,
  2100: 3,
  1600: 2,
  1100: 1,
};

const Wrapper = styled.div`
  height: 85vh;
  display: flex;
  flex-direction: column;
`;

const BackButtonWrapper = styled.div<{ width?: number }>`
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: ${(props) => props.theme.spaces[2]}px;
  ${(props) => props.width && `width: ${props.width};`}
`;

const Body = styled.div`
  margin-top: ${(props) => props.theme.spaces[15]}px;
  padding: 0 ${(props) => props.theme.spaces[11]}px;
  height: 80vh;
  overflow: auto;
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
  const [previewUrl, setPreviewUrl] = useState("");
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
    ? createMessage(FORKING_TEMPLATE)
    : createMessage(FETCHING_TEMPLATES);

  useEffect(() => {
    dispatch(getTemplateInformation(currentTemplateId));
    dispatch(getSimilarTemplatesInit(currentTemplateId));
  }, [currentTemplateId]);

  useEffect(() => {
    if (currentTemplate?.appUrl) {
      setPreviewUrl(currentTemplate.appUrl);
    }
  }, [currentTemplate?.id]);

  const onSimilarTemplateClick = (id: string) => {
    setCurrentTemplateId(id);
    if (containerRef.current) {
      containerRef.current.scrollTo({ top: 0 });
    }
  };

  const onForkTemplateClick = (template: Template) => {
    dispatch(importTemplateIntoApplication(template.id, template.title));
  };

  if (isFetchingTemplate || isImportingTemplateToApp) {
    return <LoadingScreen text={LoadingText} />;
  }

  if (!currentTemplate) {
    return null;
  }

  // Update the page id in the url
  const onPageSelection = (pageId: string) => {
    const url = new URL(currentTemplate.appUrl);
    const path = isURLDeprecated(url.pathname)
      ? VIEWER_PATH_DEPRECATED
      : VIEWER_PATH;
    const matchViewerPath = matchPath(url.pathname, {
      path: [trimQueryString(path)],
    });
    url.pathname = generatePath(path, {
      ...matchViewerPath?.params,
      pageId,
    });
    setPreviewUrl(url.toString());
  };

  return (
    <Wrapper ref={containerRef}>
      <TemplateModalHeader
        onBackPress={props.onBackPress}
        onClose={props.onClose}
      />
      <Body className="flex flex-row">
        <div className="flex flex-col flex-1">
          <Text type={TextType.DANGER_HEADING}>{currentTemplate.title}</Text>
          <IframeWrapper>
            <IframeTopBar>
              <div className="round red" />
              <div className="round yellow" />
              <div className="round green" />
            </IframeTopBar>
            <iframe src={`${previewUrl}?embed=true`} />
          </IframeWrapper>
          <TemplateDescription hideForkButton template={currentTemplate} />
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
                  breakpointCols={breakpointColumns}
                  className="grid"
                  columnClassName="grid_column"
                >
                  {similarTemplates.map((template) => (
                    <TemplateComponent
                      key={template.id}
                      onClick={() => {
                        onSimilarTemplateClick(template.id);
                      }}
                      onForkTemplateClick={() => onForkTemplateClick(template)}
                      template={template}
                    />
                  ))}
                </Masonry>
              </Section>
            </StyledSimilarTemplatesWrapper>
          )}
        </div>
        <PageSelection
          onPageSelection={onPageSelection}
          pages={currentTemplate.pages || []}
          template={currentTemplate}
        />
      </Body>
    </Wrapper>
  );
}

export default TemplateDetailedView;

import React, { useState } from "react";
import styled from "styled-components";
import history from "utils/history";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import { Button, Tooltip, Text } from "@appsmith/ads";
import ForkTemplateDialog from "../ForkTemplate";
import DatasourceChip from "../DatasourceChip";
import { createMessage, FORK_THIS_TEMPLATE } from "ee/constants/messages";
import { templateIdUrl } from "ee/RouteBuilder";
import { Position } from "@blueprintjs/core";
import {
  activeLoadingTemplateId,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import { useSelector } from "react-redux";

const TemplateWrapper = styled.div`
  border: 1px solid var(--ads-v2-color-border);
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  margin-bottom: 24px;
  cursor: pointer;
  background-color: var(--ads-v2-color-bg);
  border-radius: var(--ads-v2-border-radius);

  &:hover {
    border-color: var(--ads-v2-color-border-emphasis);
  }
`;

const ImageWrapper = styled.div`
  padding: ${(props) => props.theme.spaces[9]}px;
  overflow: hidden;
`;

const StyledImage = styled.img`
  object-fit: contain;
  width: 100%;
  height: 236px;
`;

const TemplateContent = styled.div`
  padding: 0 25px 0 25px;
  display: flex;
  flex-direction: column;
  flex: 1;

  .title {
    color: var(--ads-v2-color-fg-emphasis-plus);
  }
  .categories {
    // font-weight: normal;
    color: var(--ads-v2-color-fg-emphasis);
    margin-top: ${(props) => props.theme.spaces[1]}px;
  }
  .description {
    margin-top: ${(props) => props.theme.spaces[2]}px;
    color: var(--ads-v2-color-fg);
  }
`;

const TemplateContentFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: ${(props) => props.theme.spaces[7]}px;
  padding: 0 25px 20px 25px;
`;

const TemplateDatasources = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spaces[1]}px;
`;

export interface TemplateProps {
  hideForkTemplateButton: boolean;
  template: TemplateInterface;
  size?: string;
  onClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
}

const Template = (props: TemplateProps) => {
  return <TemplateLayout {...props} />;
};

export interface TemplateLayoutProps extends TemplateProps {
  className?: string;
}

export function TemplateLayout(props: TemplateLayoutProps) {
  const { datasources, description, functions, id, screenshotUrls, title } =
    props.template;

  const [showForkModal, setShowForkModal] = useState(false);
  const loadingTemplateId = useSelector(activeLoadingTemplateId);
  const isImportingTemplateToApp = useSelector(
    isImportingTemplateToAppSelector,
  );
  const onClick = () => {
    if (props.onClick) {
      props.onClick(id);
    } else {
      history.push(templateIdUrl({ id }));
    }
  };

  const onForkButtonTrigger = (e: React.MouseEvent<HTMLElement>) => {
    if (props.onForkTemplateClick) {
      e.preventDefault();
      e.stopPropagation();
      props.onForkTemplateClick(props.template);
    } else {
      e.stopPropagation();
      setShowForkModal(true);
    }
  };

  const onForkModalClose = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    setShowForkModal(false);
  };

  return (
    <>
      <ForkTemplateDialog
        onClose={onForkModalClose}
        showForkModal={showForkModal}
        templateId={id}
      />
      <TemplateWrapper
        className={props.className}
        data-testid="template-card"
        onClick={onClick}
      >
        <ImageWrapper className="image-wrapper">
          <StyledImage alt="Template Thumbnail" src={screenshotUrls[0]} />
        </ImageWrapper>
        <TemplateContent className="template-content">
          <Tooltip content={title} placement="right">
            <Text
              className="title"
              data-testid="template-content-title"
              kind="heading-m"
              renderAs="h1"
            >
              {title}
            </Text>
          </Tooltip>
          <Text className="categories" kind="heading-s" renderAs="h4">
            {functions.join(" • ")}
          </Text>
          <Text className="description" kind="body-m">
            {description}
          </Text>
        </TemplateContent>

        <TemplateContentFooter>
          <TemplateDatasources>
            {datasources.map((pluginPackageName) => {
              return (
                <DatasourceChip
                  key={pluginPackageName}
                  pluginPackageName={pluginPackageName}
                />
              );
            })}
          </TemplateDatasources>
          {!props.hideForkTemplateButton && (
            <Tooltip
              content={createMessage(FORK_THIS_TEMPLATE)}
              placement={Position.BOTTOM}
            >
              <Button
                className="t--fork-template fork-button"
                data-testid="t--fork-template-button"
                isDisabled={isImportingTemplateToApp || !!loadingTemplateId}
                isIconButton
                isLoading={
                  props.onForkTemplateClick && loadingTemplateId === id
                }
                onClick={onForkButtonTrigger}
                size="sm"
                startIcon="plus"
              />
            </Tooltip>
          )}
        </TemplateContentFooter>
      </TemplateWrapper>
    </>
  );
}

export default Template;

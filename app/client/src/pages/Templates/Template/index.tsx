import React, { useState } from "react";
import styled from "styled-components";
import history from "utils/history";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import { Button, Tooltip, Text } from "design-system";
import ForkTemplateDialog from "../ForkTemplate";
import DatasourceChip from "../DatasourceChip";
import LargeTemplate from "./LargeTemplate";
import {
  createMessage,
  FORK_THIS_TEMPLATE,
  FORK_THIS_TEMPLATE_BUILDING_BLOCK,
} from "@appsmith/constants/messages";
import { templateIdUrl } from "@appsmith/RouteBuilder";
import { Position } from "@blueprintjs/core";
import { isImportingTemplateToAppSelector } from "selectors/templatesSelectors";
import { useSelector } from "react-redux";

const TemplateWrapper = styled.div`
  border: 1px solid var(--ads-v2-color-border);
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
  padding: 0 25px 16px 25px;
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
`;

const TemplateDatasources = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${(props) => props.theme.spaces[1]}px;
`;

export interface TemplateProps {
  hideForkTemplateButton: boolean;
  isBuildingBlock?: boolean;
  template: TemplateInterface;
  size?: string;
  onClick?: (id: string) => void;
  onForkTemplateClick?: (template: TemplateInterface) => void;
}

const Template = (props: TemplateProps) => {
  if (props.size) {
    return <LargeTemplate {...props} />;
  } else {
    return <TemplateLayout {...props} />;
  }
};

export interface TemplateLayoutProps extends TemplateProps {
  className?: string;
}

export function TemplateLayout(props: TemplateLayoutProps) {
  const { datasources, description, functions, id, screenshotUrls, title } =
    props.template;
  const [showForkModal, setShowForkModal] = useState(false);
  const isImportingTemplateToApp = useSelector(
    isImportingTemplateToAppSelector,
  );
  const FORK_BUTTON_TOOLTIP_TEXT = props.isBuildingBlock
    ? FORK_THIS_TEMPLATE_BUILDING_BLOCK
    : FORK_THIS_TEMPLATE;
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
          <StyledImage src={screenshotUrls[0]} />
        </ImageWrapper>
        <TemplateContent className="template-content">
          <Text className="title" kind="heading-m" renderAs="h1">
            {title}
          </Text>
          <Text className="categories" kind="heading-s" renderAs="h4">
            {functions.join(" • ")}
          </Text>
          <Text className="description" kind="body-m">
            {description}
          </Text>
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
            {props.hideForkTemplateButton && (
              <Tooltip
                content={createMessage(FORK_BUTTON_TOOLTIP_TEXT)}
                placement={Position.BOTTOM}
              >
                <Button
                  className="t--fork-template fork-button"
                  isIconButton
                  isLoading={
                    props.onForkTemplateClick && isImportingTemplateToApp
                  }
                  onClick={onForkButtonTrigger}
                  size="sm"
                  startIcon="plus"
                />
              </Tooltip>
            )}
          </TemplateContentFooter>
        </TemplateContent>
      </TemplateWrapper>
    </>
  );
}

export default Template;

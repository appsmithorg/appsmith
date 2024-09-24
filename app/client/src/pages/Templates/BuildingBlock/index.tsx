import React, { useState } from "react";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import {
  BuildingBlockWrapper,
  ImageWrapper,
  StyledImage,
  BuildingBlockContent,
  BuildingBlockContentFooter,
} from "./StyledComponents";
import { Button, Text, Tooltip } from "@appsmith/ads";
import history from "utils/history";
import {
  FORK_THIS_TEMPLATE_BUILDING_BLOCK,
  createMessage,
} from "ee/constants/messages";
import { Position } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import {
  activeLoadingTemplateId,
  isImportingTemplateToAppSelector,
} from "selectors/templatesSelectors";
import { templateIdUrl } from "ee/RouteBuilder";
import { BUILDING_BLOCK_THUMBNAIL_ALT_TEXT } from "../constants";
import ForkTemplateDialog from "../ForkTemplate";

export interface BuildingBlockProps {
  buildingBlock: TemplateInterface;
  onClick?: (id: string) => void;
  onForkTemplateClick?: (buildingBlock: TemplateInterface) => void;
  hideForkTemplateButton?: boolean;
}

const BuildingBlock = (props: BuildingBlockProps) => {
  const { description, id, screenshotUrls, title } = props.buildingBlock;
  const [showForkModal, setShowForkModal] = useState(false);
  const loadingTemplateId = useSelector(activeLoadingTemplateId);
  const isImportingTemplateToApp = useSelector(
    isImportingTemplateToAppSelector,
  );
  const onForkButtonTrigger = (e: React.MouseEvent<HTMLElement>) => {
    if (props.onForkTemplateClick) {
      e.preventDefault();
      e.stopPropagation();
      props.onForkTemplateClick(props.buildingBlock);
    } else {
      e.stopPropagation();
      setShowForkModal(true);
    }
  };

  const onClick = () => {
    if (props.onClick) {
      props.onClick(id);
    } else {
      history.push(templateIdUrl({ id }));
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
      <BuildingBlockWrapper onClick={onClick}>
        <ImageWrapper className="image-wrapper">
          <StyledImage
            alt={BUILDING_BLOCK_THUMBNAIL_ALT_TEXT}
            src={screenshotUrls[0]}
          />
        </ImageWrapper>
        <BuildingBlockContent>
          <Text className="title" kind="heading-m" renderAs="h1">
            {title}
          </Text>

          <Text className="description" kind="body-m">
            {description}
          </Text>

          <BuildingBlockContentFooter>
            {!props.hideForkTemplateButton && (
              <Tooltip
                content={createMessage(FORK_THIS_TEMPLATE_BUILDING_BLOCK)}
                placement={Position.BOTTOM}
              >
                <Button
                  className="t--fork-template fork-button"
                  data-testid="t--fork-building-block"
                  isDisabled={!!isImportingTemplateToApp || !!loadingTemplateId}
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
          </BuildingBlockContentFooter>
        </BuildingBlockContent>
      </BuildingBlockWrapper>
    </>
  );
};

export default BuildingBlock;

import React from "react";
import type { Template as TemplateInterface } from "api/TemplatesApi";
import {
  BuildingBlockWrapper,
  ImageWrapper,
  StyledImage,
  BuildingBlockContent,
  BuildingBlockContentFooter,
} from "./StyledComponents";
import { Button, Text, Tooltip } from "design-system";
import history from "utils/history";
import {
  FORK_THIS_TEMPLATE_BUILDING_BLOCK,
  createMessage,
} from "@appsmith/constants/messages";
import { Position } from "@blueprintjs/core";
import { useSelector } from "react-redux";
import { activeLoadingTemplateId } from "selectors/templatesSelectors";
import { templateIdUrl } from "@appsmith/RouteBuilder";

export interface BuildingBlockProps {
  buildingBlock: TemplateInterface;
  onClick?: (id: string) => void;
  onForkTemplateClick?: (buildingBlock: TemplateInterface) => void;
  hideForkTemplateButton?: boolean;
}

const BuildingBlock = (props: BuildingBlockProps) => {
  const { description, id, screenshotUrls, title } = props.buildingBlock;
  const loadingTemplateId = useSelector(activeLoadingTemplateId);

  const onForkButtonTrigger = (e: React.MouseEvent<HTMLElement>) => {
    if (props.onForkTemplateClick) {
      e.preventDefault();
      e.stopPropagation();
      props.onForkTemplateClick(props.buildingBlock);
    }
  };

  const onClick = () => {
    if (props.onClick) {
      props.onClick(id);
    } else {
      history.push(templateIdUrl({ id }));
    }
  };

  return (
    <BuildingBlockWrapper onClick={onClick}>
      <ImageWrapper className="image-wrapper">
        <StyledImage src={screenshotUrls[0]} />
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
  );
};

export default BuildingBlock;

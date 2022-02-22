import React, { useState } from "react";
import styled from "styled-components";
import { Template as TemplateInterface } from "api/TemplatesApi";
import history from "utils/history";
import Button, { Size } from "components/ads/Button";
import Tooltip from "components/ads/Tooltip";
import { TEMPLATE_ID_URL } from "constants/routes";
import ForkTemplateDialog from "../ForkTemplate";
import DatasourceChip from "../DatasourceChip";
import TemplateSampleImage from "./template-test.png";
import LargeTemplate from "./LargeTemplate";
import { getTypographyByKey } from "constants/DefaultTheme";
import { Colors } from "constants/Colors";

const TemplateWrapper = styled.div`
  border: 1px solid #e7e7e7;
  margin-bottom: 32px;
  transition: all 1s ease-out;
  cursor: pointer;

  &:hover {
    box-shadow: 0px 20px 24px -4px rgba(16, 24, 40, 0.1),
      0px 8px 8px -4px rgba(16, 24, 40, 0.04);
  }
`;

const ImageWrapper = styled.div`
  padding: 20px 24px;
  overflow: hidden;
`;

const StyledImage = styled.img`
  box-shadow: 0px 17.52px 24.82px rgba(0, 0, 0, 0.09);
  object-fit: cover;
`;

const TemplateContent = styled.div`
  border-top: 0.73px solid #e7e7e7;
  padding: 16px 25px;

  .title {
    ${(props) => getTypographyByKey(props, "h4")}
    color: ${Colors.EBONY_CLAY};
  }
  .categories {
    ${(props) => getTypographyByKey(props, "p3")}
    color: var(--appsmith-color-black-800);
    margin-top: 4px;
  }
  .description {
    margin-top: 6px;
    color: var(--appsmith-color-black-700);
    ${(props) => getTypographyByKey(props, "p3")}
  }
`;

const TemplateContentFooter = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 17px;
`;

const TemplateDatasources = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
`;

const StyledButton = styled(Button)`
  border-radius: 18px;
  && {
    & > span {
      margin-right: 0px;
    }
  }
`;

export interface TemplateProps {
  template: TemplateInterface;
  size?: string;
}

const Template = (props: TemplateProps) => {
  if (props.size) {
    return <LargeTemplate {...props} />;
  } else {
    return <TemplateLayout {...props} />;
  }
};

export interface TemplateLayoutProps {
  template: TemplateInterface;
  className?: string;
}

export function TemplateLayout(props: TemplateLayoutProps) {
  const { datasources, description, functions, id, title } = props.template;
  const [showForkModal, setShowForkModal] = useState(false);
  const onClick = () => {
    history.push(TEMPLATE_ID_URL(id));
  };

  const onForkButtonTrigger = (e: React.MouseEvent<HTMLElement>) => {
    e.stopPropagation();
    setShowForkModal(true);
  };

  const onForkModalClose = (e?: React.MouseEvent<HTMLElement>) => {
    e?.stopPropagation();
    setShowForkModal(false);
  };

  return (
    <TemplateWrapper className={props.className} onClick={onClick}>
      <ImageWrapper className="image-wrapper">
        <StyledImage src={TemplateSampleImage} />
      </ImageWrapper>
      <TemplateContent>
        <div className="title">{title}</div>
        <div className="categories">{functions.join(" • ")}</div>
        <div className="description">{description}</div>
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
          <div onClick={onForkButtonTrigger}>
            <ForkTemplateDialog
              onClose={onForkModalClose}
              showForkModal={showForkModal}
              templateId={id}
            >
              <Tooltip content={"Fork this template"}>
                <StyledButton
                  className="fork-button"
                  icon="fork-2"
                  size={Size.medium}
                  tag="button"
                />
              </Tooltip>
            </ForkTemplateDialog>
          </div>
        </TemplateContentFooter>
      </TemplateContent>
    </TemplateWrapper>
  );
}

export default Template;

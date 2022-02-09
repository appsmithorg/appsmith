import React from "react";
import styled from "styled-components";
import Masonry from "react-masonry-css";
import history from "utils/history";
import Text, { FontWeight, TextType } from "components/ads/Text";
import Button, { IconPositions, Size } from "components/ads/Button";
import { TEMPLATES_URL } from "constants/routes";
import { templates } from "./TemplateList";
import Template from "./Template";
import DatasourceChip from "./DatasourceChip";
import WidgetInfo from "./WidgetInfo";

const Wrapper = styled.div`
  width: calc(100% - ${(props) => props.theme.homePage.sidebar}px);
  height: calc(100vh - ${(props) => props.theme.homePage.search.height}px);
`;

const TemplateViewWrapper = styled.div`
  padding-right: 32px;
  padding-left: 32px;
`;

const BreadCrumbs = styled.div`
  margin-top: 30px;
  .templates-text {
    font-weight: normal;
    color: #716e6e;
    cursor: pointer;

    :hover {
      text-decoration: underline;
    }
  }
`;

const Title = styled(Text)`
  margin-top: 26px;
  display: inline-block;
`;

const IframeWrapper = styled.div`
  border: 2px dashed #6eb9f0;
  background: rgba(110, 185, 240, 0.08);
  height: 500px;
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

  .fork-button {
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

const SimilarTemplatesWrapper = styled.div`
  margin-top: 82px;
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

function TemplateView() {
  const navigateToTemplatesPage = () => {
    history.push(TEMPLATES_URL);
  };

  return (
    <Wrapper>
      <TemplateViewWrapper>
        <BreadCrumbs>
          <Text
            className={"templates-text"}
            onClick={navigateToTemplatesPage}
            type={TextType.P0}
          >
            Templates{" "}
          </Text>
          <Text color={"#716E6E"} type={TextType.P0}>
            &gt;
          </Text>
          <Text type={TextType.P0}> Job Application Tracker</Text>
        </BreadCrumbs>
        <Title type={TextType.H4}>Job Application Tracker</Title>
        <IframeWrapper>
          <iframe
            height={"100%"}
            src="https://app.appsmith.com/applications/5f2aeb2580ca1f6faaed4e4a/pages/5f2d61b580ca1f6faaed4e79"
            width={"100%"}
          />
        </IframeWrapper>
        <DescriptionWrapper>
          <DescriptionColumn>
            <Section>
              <Text type={TextType.H1}>Overview</Text>
              <div className="section-content">
                <Text type={TextType.H2} weight={FontWeight.NORMAL}>
                  An admin panel for reading from and writing to your customer
                  data, built on PostgreSQL. This app lets you look through,
                  edit, and add users, orders, and products.
                </Text>
              </div>
              <Button
                className="fork-button"
                icon="fork"
                iconPosition={IconPositions.left}
                size={Size.large}
                text="FORK THIS TEMPLATE"
                width="228px"
              />
            </Section>
            <Section>
              <Text type={TextType.H1}>Function</Text>
              <div className="section-content">
                <Text type={TextType.H1} weight={FontWeight.NORMAL}>
                  Customer Support • Data and Analytics
                </Text>
              </div>
            </Section>
            <Section>
              <Text type={TextType.H1}>Industry</Text>
              <div className="section-content">
                <Text type={TextType.H1} weight={FontWeight.NORMAL}>
                  Technology • Logistics
                </Text>
              </div>
            </Section>
          </DescriptionColumn>
          <DescriptionColumn>
            <Section>
              <Text type={TextType.H1}>Data Sources</Text>
              <div className="section-content">
                <StyledDatasourceChip />
                <div className="datasource-note">
                  <Text type={TextType.H2}>Note: </Text>
                  <Text type={TextType.H2} weight={FontWeight.NORMAL}>
                    You can add your data sources as well
                  </Text>
                </div>
              </div>
            </Section>
            <Section>
              <Text type={TextType.H1}>Widgets Used</Text>
              <div className="section-content">
                <WidgetInfo />
              </div>
            </Section>
          </DescriptionColumn>
        </DescriptionWrapper>
      </TemplateViewWrapper>

      <SimilarTemplatesWrapper>
        <Section>
          <Text type={TextType.H1}>Similar Templates</Text>
          <Masonry
            breakpointCols={3}
            className="grid"
            columnClassName="grid_column"
          >
            {templates.map((template) => (
              <Template key={template.id} template={template} />
            ))}
          </Masonry>
        </Section>
      </SimilarTemplatesWrapper>
    </Wrapper>
  );
}

export default TemplateView;

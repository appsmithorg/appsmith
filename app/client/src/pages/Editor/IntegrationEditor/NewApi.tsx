import React from "react";
import { Link } from "react-router-dom";
import { connect } from "react-redux";
import { Icon, Card } from "@blueprintjs/core";
import styled from "styled-components";
import { getCurlImportPageURL } from "constants/routes";
import { SAAS_EDITOR_URL } from "pages/Editor/SaaSEditor/constants";
import { AppState } from "reducers";
import { Colors } from "constants/Colors";
import { API_EDITOR_URL_WITH_SELECTED_PAGE_ID } from "constants/routes";
import CurlLogo from "assets/images/Curl-logo.svg";
import { Plugin } from "api/PluginApi";
import { createNewApiAction } from "actions/apiPaneActions";
import AnalyticsUtil, { EventLocation } from "utils/AnalyticsUtil";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import { PluginType } from "entities/Action";

const StyledContainer = styled.div`
  flex: 1;

  .sectionHeadings {
    font-weight: 500;
    font-size: 16px;
  }
  .link {
    color: ${Colors.OXFORD_BLUE};
  }
  .link:hover {
    color: ${Colors.OXFORD_BLUE};
    text-decoration: none !important;
  }
  .textBtn {
    font-size: 14px;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.17px;
    color: ${Colors.OXFORD_BLUE};
    font-weight: 500;
    text-decoration: none !important;
    flex-wrap: wrap;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  @media (min-width: 2500px) {
    .textBtn {
      font-size: 18px;
    }
  }
  .link {
    color: ${Colors.OXFORD_BLUE};
  }
  a:hover {
    color: ${Colors.OXFORD_BLUE};
    text-decoration: none;
  }
  .providerSearchCard {
    display: flex;
    color: ${Colors.BLACK};
    padding: 5px;
    cursor: pointer;
  }
  .providerSearchCard:hover {
    background-color: ${Colors.CONCRETE};
  }
  .providerSearchResultImage {
    height: 50px;
    width: 60px;
    object-fit: contain;
  }
  .providerSearchResultName {
    display: flex;
    align-self: center;
    padding-left: 15px;
    font-size: 16px;
  }
  .apiImage {
    object-fit: contain;
    height: 50px;
    width: auto;
    max-width: 100%;
    margin-top: -5px;
    margin-bottom: 10px;
    min-height: 50px;
  }
  .curlImage {
    width: 55px;
  }
  .saasImage.t--saas-google-sheets-plugin-image {
    width: 40px;
  }
  .createIcon {
    align-items: center;
    margin-top: 15px;
    margin-bottom: 25px;
  }
  .eachCard {
    margin: 15px;
    width: 140px;
    height: 110px;
    padding-bottom: 0px;
    cursor: pointer;
    border: 1px solid #e6e6e6;
    box-shadow: none;
  }
  .eachCard:active {
    border: 1px solid ${Colors.JAFFA_DARK};
    background: rgba(242, 153, 74, 0.17);
  }
  .eachCard:hover {
    border: 1px solid ${Colors.JAFFA_DARK};
  }
  @media (min-width: 2500px) {
    .eachCard {
      width: 240px;
      height: 200px;
    }
    .apiImage {
      margin-top: 25px;
      margin-bottom: 20px;
      height: 80px;
    }
    .curlImage {
      width: 100px;
    }
    .createIcon {
      height: 70px;
    }
  }
`;

const ApiCard = styled.div`
  flex: 1;
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  column-gap: 10px;
  flex-wrap: wrap;
  margin-left: -10px;
  text-align: center;
  min-width: 150px;
  border-radius: 4px;
  width: 100%;
  @media (min-width: 2500px) {
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  }
`;

type ApiHomeScreenProps = {
  applicationId: string;
  createNewApiAction: (pageId: string, from: EventLocation) => void;
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  location: {
    search: string;
  };
  pageId: string;
  plugins: Plugin[];
};

type Props = ApiHomeScreenProps;

const newApiScreen = (props: Props) => {
  const {
    applicationId,
    createNewApiAction,
    history,
    location,
    pageId,
    plugins,
  } = props;

  const handleCreateNew = () => {
    const pageId = new URLSearchParams(location.search).get("importTo");
    if (pageId) {
      createNewApiAction(pageId, "API_PANE");
    }
  };

  let destinationPageId = new URLSearchParams(location.search).get("importTo");

  if (!destinationPageId) {
    destinationPageId = pageId;
    history.push(
      API_EDITOR_URL_WITH_SELECTED_PAGE_ID(applicationId, pageId, pageId),
    );
  }
  const curlImportURL =
    getCurlImportPageURL(applicationId, pageId) + location.search;

  return (
    <StyledContainer>
      <ApiCard>
        <Card
          className="eachCard t--createBlankApiCard"
          interactive={false}
          onClick={handleCreateNew}
        >
          <Icon className="createIcon" icon="plus" iconSize={20} />
          <p className="textBtn">Create new</p>
        </Card>
        <Link
          onClick={() => {
            AnalyticsUtil.logEvent("IMPORT_API_CLICK", {
              importSource: CURL,
            });
          }}
          to={curlImportURL}
        >
          <Card className="eachCard" interactive={false}>
            <img alt="CURL" className="curlImage t--curlImage" src={CurlLogo} />
            <p className="textBtn">CURL</p>
          </Card>
        </Link>
        {plugins
          .filter((p) => p.type === PluginType.SAAS)
          .map((p) => (
            <Link
              key={p.id}
              to={
                SAAS_EDITOR_URL(applicationId, pageId, p.packageName) +
                location.search
              }
            >
              <Card className="eachCard" interactive={false}>
                <img
                  alt={p.name}
                  className={"saasImage t--saas-" + p.packageName + "-image"}
                  src={p.iconLocation}
                />
                <p className="textBtn">{p.name}</p>
              </Card>
            </Link>
          ))}
      </ApiCard>
    </StyledContainer>
  );
};

const mapStateToProps = (state: AppState) => ({
  plugins: state.entities.plugins.list,
});

const mapDispatchToProps = {
  createNewApiAction,
};

export default connect(mapStateToProps, mapDispatchToProps)(newApiScreen);

import React, { useCallback } from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { getCurlImportPageURL } from "constants/routes";
import { createDatasourceFromForm } from "actions/datasourceActions";
import { AppState } from "reducers";
import { Colors } from "constants/Colors";
import CurlLogo from "assets/images/Curl-logo.svg";
import PlusLogo from "assets/images/Plus-logo.svg";
import OauthLogo from "assets/images/oauth-logo.svg";
import { Plugin } from "api/PluginApi";
import { createNewApiAction } from "actions/apiPaneActions";
import AnalyticsUtil, { EventLocation } from "utils/AnalyticsUtil";
import { CURL } from "constants/AppsmithActionConstants/ActionConstants";
import { PluginType } from "entities/Action";
import { Spinner } from "@blueprintjs/core";

const StyledContainer = styled.div`
  flex: 1;
  margin-top: 8px;
  .textBtn {
    font-size: 16px;
    line-height: 24px;
    margin: 0;
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

const ApiCardsContainer = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
  text-align: center;
  min-width: 150px;
  border-radius: 4px;
  align-items: center;

  .create-new-api {
    &:hover {
      cursor: pointer;
    }
  }
`;

const ApiCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  &:hover {
    background: ${Colors.Gallery};
    cursor: pointer;
  }

  .content-icon-wrapper {
    width: 40px;
    height: 40px;
    border-radius: 20px;
    margin: 0 8px;
    background: #f0f0f0;
    display: flex;
    align-items: center;

    .content-icon {
      height: 28px;
      width: auto;
      margin: 0 auto;
      max-width: 100%;
      margin-bottom: 2px;
    }
  }

  .cta {
    display: none;
    margin-right: 32px;
  }

  &:hover {
    .cta {
      display: flex;
    }
  }
`;

const CardContentWrapper = styled.div`
  display: flex;
  align-items: center;
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
  createDatasourceFromForm: (data: any) => void;
  isCreating: boolean;
};

type Props = ApiHomeScreenProps;

function NewApiScreen(props: Props) {
  const {
    applicationId,
    createNewApiAction,
    history,
    isCreating,
    location,
    pageId,
    plugins,
  } = props;
  const handleCreateNew = () => {
    if (pageId) {
      createNewApiAction(pageId, "API_PANE");
    }
  };
  const handleCreateOAuthDatasource = useCallback(() => {
    const plugin = plugins.find((p) => p.name === "REST API");
    plugin &&
      props.createDatasourceFromForm({
        pluginId: plugin.id,
        // Following obj is the only difference between REST API creation and OAuth
        datasourceConfiguration: {
          authentication: {
            authenticationType: "oAuth2",
          },
        },
      });
  }, [plugins, props.createDatasourceFromForm]);
  const curlImportURL =
    getCurlImportPageURL(applicationId, pageId) +
    "?from=datasources" +
    location.search;

  return (
    <StyledContainer>
      <ApiCardsContainer>
        <ApiCard
          className="t--createBlankApiCard create-new-api"
          onClick={handleCreateNew}
        >
          <CardContentWrapper>
            <div className="content-icon-wrapper">
              <img
                alt="New"
                className="curlImage t--plusImage content-icon"
                src={PlusLogo}
              />
            </div>
            <p className="textBtn">Create new</p>
          </CardContentWrapper>
          {isCreating && <Spinner className="cta" size={25} />}
        </ApiCard>
        <ApiCard
          className="t--createBlankCurlCard"
          onClick={() => {
            AnalyticsUtil.logEvent("IMPORT_API_CLICK", {
              importSource: CURL,
            });
            history.push(curlImportURL);
          }}
        >
          <CardContentWrapper>
            <div className="content-icon-wrapper">
              <img
                alt="CURL"
                className="curlImage t--curlImage content-icon"
                src={CurlLogo}
              />
            </div>
            <p className="textBtn">CURL</p>
          </CardContentWrapper>
        </ApiCard>
        <ApiCard
          className="t--createBlankOAuthCard"
          onClick={handleCreateOAuthDatasource}
        >
          <CardContentWrapper>
            <div className="content-icon-wrapper">
              <img
                alt="OAuth2"
                className="oAuthImage t--oAuthImage content-icon"
                src={OauthLogo}
              />
            </div>
            <p className="textBtn">Authenticated API</p>
          </CardContentWrapper>
        </ApiCard>
        {plugins
          .filter((p) => p.type === PluginType.SAAS)
          .map((p) => (
            <ApiCard
              className={`t--createBlankApi-${p.packageName}`}
              key={p.id}
              onClick={() => props.createDatasourceFromForm({ pluginId: p.id })}
            >
              <CardContentWrapper>
                <div className="content-icon-wrapper">
                  <img
                    alt={p.name}
                    className={
                      "content-icon saasImage t--saas-" +
                      p.packageName +
                      "-image"
                    }
                    src={p.iconLocation}
                  />
                </div>
                <p className="textBtn">{p.name}</p>
              </CardContentWrapper>
            </ApiCard>
          ))}
      </ApiCardsContainer>
    </StyledContainer>
  );
}

const mapStateToProps = (state: AppState) => ({
  plugins: state.entities.plugins.list,
});

const mapDispatchToProps = {
  createNewApiAction,
  createDatasourceFromForm,
};

export default connect(mapStateToProps, mapDispatchToProps)(NewApiScreen);

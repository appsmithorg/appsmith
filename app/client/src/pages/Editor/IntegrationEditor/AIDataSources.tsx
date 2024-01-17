import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
} from "actions/datasourceActions";
import type { AppState } from "@appsmith/reducers";
import type { Plugin } from "api/PluginApi";
import AnalyticsUtil from "utils/AnalyticsUtil";
import { PluginPackageName, PluginType } from "entities/Action";
import { getAssetUrl } from "@appsmith/utils/airgapHelpers";
import { createNewApiActionBasedOnEditorType } from "@appsmith/actions/helpers";
import type { ActionParentEntityTypeInterface } from "@appsmith/entities/Engine/actionHelpers";

export const StyledContainer = styled.div`
  flex: 1;
  margin-top: 8px;
  .textBtn {
    font-size: 16px;
    line-height: 24px;
    margin: 0;
    justify-content: center;
    text-align: center;
    letter-spacing: -0.24px;
    color: var(--ads-v2-color-fg);
    font-weight: 400;
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

export const DatasourceCardsContainer = styled.div`
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

export const DatasourceCard = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
  border-radius: var(--ads-v2-border-radius);

  &:hover {
    background-color: var(--ads-v2-color-bg-subtle);
    cursor: pointer;
  }

  .content-icon {
    height: 34px;
    width: auto;
    margin: 0 auto;
    max-width: 100%;
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

export const CardContentWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 13px;
  padding-left: 13.5px;
`;

interface ApiHomeScreenProps {
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
  showUnsupportedPluginDialog: (callback: any) => void;
  createTempDatasourceFromForm: (data: any) => void;
  showSaasAPIs: boolean; // If this is true, only SaaS APIs will be shown
  createNewApiActionBasedOnEditorType: (
    editorType: string,
    editorId: string,
    parentEntityId: string,
    parentEntityType: ActionParentEntityTypeInterface,
    apiType: string,
  ) => void;
}

type Props = ApiHomeScreenProps;

function AIDataSources(props: Props) {
  const { plugins } = props;

  const handleOnClick = (plugin: Plugin) => {
    AnalyticsUtil.logEvent("CREATE_DATA_SOURCE_CLICK", {
      pluginName: plugin.name,
      pluginPackageName: plugin.packageName,
    });
    props.createTempDatasourceFromForm({
      pluginId: plugin.id,
      type: plugin.type,
    });
  };

  // AI Plugins
  const aiPlugins = plugins
    .filter((p) => {
      // Remove Appsmith AI Plugin from Datasources page
      // TODO: @Diljit Remove this when knowledge retrieval for Appsmith AI is implemented
      return p.packageName !== PluginPackageName.APPSMITH_AI;
    })
    .sort((a, b) => {
      // Sort the AI plugins alphabetically
      return a.name.localeCompare(b.name);
    })
    .filter((p) => p.type === PluginType.AI);

  return (
    <StyledContainer>
      <DatasourceCardsContainer data-testid="newapi-datasource-card-container">
        {aiPlugins.map((plugin) => (
          <DatasourceCard
            className={`t--createBlankApi-${plugin.packageName}`}
            key={plugin.id}
            onClick={() => {
              handleOnClick(plugin);
            }}
          >
            <CardContentWrapper>
              <img
                alt={plugin.name}
                className={
                  "content-icon saasImage t--saas-" +
                  plugin.packageName +
                  "-image"
                }
                src={getAssetUrl(plugin.iconLocation)}
              />
              <p className="t--plugin-name textBtn">{plugin.name}</p>
            </CardContentWrapper>
          </DatasourceCard>
        ))}
      </DatasourceCardsContainer>
    </StyledContainer>
  );
}

const mapStateToProps = (state: AppState) => ({
  plugins: state.entities.plugins.list,
});

const mapDispatchToProps = {
  createDatasourceFromForm,
  createTempDatasourceFromForm,
  createNewApiActionBasedOnEditorType,
};

export default connect(mapStateToProps, mapDispatchToProps)(AIDataSources);

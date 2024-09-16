import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { createTempDatasourceFromForm } from "actions/datasourceActions";
import type { AppState } from "ee/reducers";
import type { Plugin } from "api/PluginApi";
import AnalyticsUtil from "ee/utils/AnalyticsUtil";
import { PluginType } from "entities/Action";
import { getAssetUrl } from "ee/utils/airgapHelpers";

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

interface Props {
  location: {
    search: string;
  };
  pageId: string;
  plugins: Plugin[];
  isCreating: boolean;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  showUnsupportedPluginDialog: (callback: any) => void;
  // TODO: Fix this the next time the file is edited
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createTempDatasourceFromForm: (data: any) => void;
  showSaasAPIs: boolean; // If this is true, only SaaS APIs will be shown
}

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
    .sort((a, b) => {
      // Sort the AI plugins alphabetically
      return a.name.localeCompare(b.name);
    })
    .filter((p) => p.type === PluginType.AI);

  return (
    <StyledContainer>
      <DatasourceCardsContainer data-testid="newai-datasource-card-container">
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
  createTempDatasourceFromForm,
};

export default connect(mapStateToProps, mapDispatchToProps)(AIDataSources);

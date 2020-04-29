import React from "react";
import { connect } from "react-redux";
import { initialize } from "redux-form";
import styled from "styled-components";
import { RouteComponentProps } from "react-router";
import Button from "components/editorComponents/Button";
import { DATASOURCE_DB_FORM } from "constants/forms";
import { IIconProps } from "@blueprintjs/core";
import { Colors } from "constants/Colors";
import TreeDropdown from "components/editorComponents/actioncreator/TreeDropdown";
import { BaseTextInput } from "components/designSystems/appsmith/TextInputComponent";
import { getDataSources } from "selectors/editorSelectors";
import { getPlugins } from "selectors/entitiesSelector";
import { Plugin } from "api/PluginApi";
import {
  initDatasourcePane,
  storeDatastoreRefs,
} from "actions/datasourceActions";
import { ControlIcons } from "icons/ControlIcons";
import { theme } from "constants/DefaultTheme";
import { selectPlugin } from "actions/datasourceActions";
import { fetchPluginForm } from "actions/pluginActions";
import ImageAlt from "assets/images/placeholder-image.svg";
import Postgres from "assets/images/Postgress.png";
import MongoDB from "assets/images/MongoDB.png";
import RestTemplateImage from "assets/images/RestAPI.png";
import {
  DATA_SOURCES_EDITOR_ID_URL,
  DATA_SOURCES_EDITOR_URL,
} from "constants/routes";
import { REST_PLUGIN_PACKAGE_NAME } from "constants/ApiEditorConstants";
import {
  PLUGIN_PACKAGE_POSTGRES,
  PLUGIN_PACKAGE_MONGO,
} from "constants/QueryEditorConstants";
import { AppState } from "reducers";
import { Datasource } from "api/DatasourcesApi";

interface ReduxDispatchProps {
  initDatasourcePane: (pluginType: string, urlId?: string) => void;
  selectPlugin: (pluginType: string) => void;
  initializeForm: (data: Record<string, any>) => void;
  storeDatastoreRefs: (refsList: []) => void;
  fetchFormConfig: (id: string) => void;
}

interface ReduxStateProps {
  dataSources: Datasource[];
  plugins: Plugin[];
  datastoreRefs: Record<string, any>;
  formConfigs: Record<string, []>;
}

type DataSourceSidebarProps = {};

type State = {
  search: string;
};

const ActionItem = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
`;

const ActionName = styled.span`
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 130px;
  margin-left: 10px;
`;

const SearchBar = styled(BaseTextInput)`
  margin-bottom: 10px;
  input {
    background-color: #23292e;
    border: none;
    color: ${props => props.theme.colors.textOnDarkBG}
    :focus {
      background-color: #23292e;
    }
  }
  .bp3-icon {
    background-color: #23292e;
  }
`;

const ItemContainer = styled.div<{
  isSelected: boolean;
}>`
width: 210px;
padding: 8px 12px;
border-radius: 4px;
align-items: center;
cursor: pointer;
display: flex;
font-size: 14px;
margin-bottom: 2px;
  background-color: ${props =>
    props.isSelected ? props.theme.colors.paneCard : props.theme.colors.paneBG}
  :hover {
    background-color: ${props => props.theme.colors.paneCard};
  }
`;

const StyledImage = styled.img`
  height: 20px;
  width: 20px;

  svg {
    path {
      fill: ${Colors.WHITE};
    }
  }
`;

const StyledAddButton = styled(Button)<IIconProps>`
  &&& {
    outline: none;

    padding: 10px !important;
  }
  span {
    font-weight: normal !important;
  }
`;

const Controls = styled.div`
  padding: 10px;
`;

const Wrapper = styled.div`
  padding: 5px;
`;

const Container = styled.div`
  .createBtn {
    border: none;
    color: ${Colors.WHITE} !important;
    width: 210px;
    display: block !important;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;

    &:hover {
      color: ${Colors.WHITE} !important;
      background-color: ${Colors.BLUE_CHARCOAL} !important;

      svg {
        path {
          fill: ${Colors.WHITE};
        }
      }
    }
  }
  .highlightButton {
    color: ${Colors.WHITE} !important;
    background-color: ${Colors.BLUE_CHARCOAL} !important;
    width: 210px;
    display: block !important;
    font-weight: normal;
    font-size: 14px;
    line-height: 20px;

    svg {
      path {
        fill: ${Colors.WHITE};
      }
    }
  }
`;

type Props = DataSourceSidebarProps &
  RouteComponentProps<{
    pageId: string;
    applicationId: string;
    datasourceId: string;
  }> &
  ReduxStateProps &
  ReduxDispatchProps;

class DataSourceSidebar extends React.Component<Props, State> {
  refsCollection: any;

  constructor(props: Props) {
    super(props);
    this.state = {
      search: "",
    };

    this.refsCollection = {};
  }

  componentDidMount() {
    const { dataSources, storeDatastoreRefs } = this.props;
    this.refsCollection = dataSources.reduce((acc: any, value) => {
      acc[value.id] = React.createRef();
      return acc;
    }, {});
    storeDatastoreRefs(this.refsCollection);
  }

  handleCreateNewDatasource = () => {
    const { history } = this.props;
    const { pageId, applicationId } = this.props.match.params;

    history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
  };

  handleItemSelected = (datasource: Datasource) => {
    const { history, formConfigs } = this.props;
    const { pageId, applicationId } = this.props.match.params;

    this.props.initializeForm(datasource);
    this.props.selectPlugin(datasource.pluginId);
    if (!formConfigs[datasource.pluginId]) {
      this.props.fetchFormConfig(datasource.pluginId);
    }
    history.push(
      DATA_SOURCES_EDITOR_ID_URL(applicationId, pageId, datasource.id),
    );
  };

  handleSearchChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value;
    this.setState({
      search: value,
    });
  };

  getImageSource = (pluginId: string) => {
    const { plugins } = this.props;
    const plugin = plugins.find(plugin => plugin.id === pluginId);

    switch (plugin?.packageName) {
      case REST_PLUGIN_PACKAGE_NAME:
        return RestTemplateImage;
      case PLUGIN_PACKAGE_MONGO:
        return MongoDB;
      case PLUGIN_PACKAGE_POSTGRES:
        return Postgres;
      default:
        return ImageAlt;
    }
  };

  renderItem = (datasources: Datasource[]) => {
    const {
      match: {
        params: { datasourceId },
      },
      datastoreRefs,
    } = this.props;

    return datasources.map(datasource => {
      return (
        <ItemContainer
          ref={datastoreRefs[datasource.id]}
          key={datasource.id}
          isSelected={datasourceId === datasource.id}
          onClick={() => this.handleItemSelected(datasource)}
        >
          <ActionItem>
            <StyledImage
              src={this.getImageSource(datasource.pluginId)}
              className="pluginImage"
              alt="Plugin Image"
            />
            <ActionName>{datasource.name}</ActionName>
          </ActionItem>
          <TreeDropdown
            defaultText=""
            onSelect={() => {
              return null;
            }}
            selectedValue=""
            optionTree={[
              {
                value: "delete",
                onSelect: () => null,
                label: "Delete",
                intent: "danger",
              },
            ]}
            toggle={
              <ControlIcons.MORE_HORIZONTAL_CONTROL
                width={theme.fontSizes[4]}
                height={theme.fontSizes[4]}
              />
            }
          />
        </ItemContainer>
      );
    });
  };

  render() {
    const { search } = this.state;
    const { dataSources } = this.props;
    const {
      match: {
        params: { datasourceId },
      },
    } = this.props;

    return (
      <Wrapper>
        <Controls>
          <SearchBar
            icon="search"
            input={{
              value: search,
              onChange: this.handleSearchChange,
            }}
            placeholder="Search"
          />
        </Controls>
        <Container>
          <StyledAddButton
            text={"Create a new Datasource"}
            icon="plus"
            className={datasourceId ? "createBtn" : "highlightButton"}
            style={{ padding: "9px" }}
            onClick={this.handleCreateNewDatasource}
          />
        </Container>
        {this.renderItem(dataSources)}
      </Wrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
  return {
    formConfigs: state.entities.plugins.formConfigs,
    dataSources: getDataSources(state),
    plugins: getPlugins(state),
    datastoreRefs: state.ui.datasourcePane.datasourceRefs,
  };
};

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
  initDatasourcePane: (pluginType: string, urlId?: string) =>
    dispatch(initDatasourcePane(pluginType, urlId)),
  fetchFormConfig: (id: string) => dispatch(fetchPluginForm({ id })),
  selectPlugin: (pluginId: string) => dispatch(selectPlugin(pluginId)),
  initializeForm: (data: Record<string, any>) =>
    dispatch(initialize(DATASOURCE_DB_FORM, data)),
  storeDatastoreRefs: (refsList: {}) => {
    dispatch(storeDatastoreRefs(refsList));
  },
});

export default connect(mapStateToProps, mapDispatchToProps)(DataSourceSidebar);

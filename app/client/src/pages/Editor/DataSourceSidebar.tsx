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
import { getPluginImages } from "selectors/entitiesSelector";
import {
  initDatasourcePane,
  storeDatastoreRefs,
  deleteDatasource,
  changeDatasource,
} from "actions/datasourceActions";
import { ControlIcons } from "icons/ControlIcons";
import { theme } from "constants/DefaultTheme";
import { selectPlugin } from "actions/datasourceActions";
import { fetchPluginForm } from "actions/pluginActions";
import { DATA_SOURCES_EDITOR_URL } from "constants/routes";
import { AppState } from "reducers";
import { Datasource } from "api/DatasourcesApi";
import Fuse from "fuse.js";

interface ReduxDispatchProps {
  initDatasourcePane: (pluginType: string, urlId?: string) => void;
  selectPlugin: (pluginType: string) => void;
  initializeForm: (data: Record<string, any>) => void;
  storeDatastoreRefs: (refsList: []) => void;
  fetchFormConfig: (id: string) => void;
  deleteDatasource: (id: string) => void;
  onDatasourceChange: (datasource: Datasource) => void;
}

interface ReduxStateProps {
  dataSources: Datasource[];
  pluginImages: Record<string, string>;
  datastoreRefs: Record<string, any>;
  formConfigs: Record<string, []>;
  drafts: Record<string, Datasource>;
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
  padding: "9px";
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
    width: 100%;
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

const DraftIconIndicator = styled.span<{ isHidden: boolean }>`
  width: 8px;
  height: 8px;
  border-radius: 8px;
  background-color: #f2994a;
  margin: 0 5px;
  opacity: ${({ isHidden }) => (isHidden ? 0 : 1)};
`;

type Props = DataSourceSidebarProps &
  RouteComponentProps<{
    pageId: string;
    applicationId: string;
    datasourceId: string;
  }> &
  ReduxStateProps &
  ReduxDispatchProps;

const FUSE_OPTIONS = {
  shouldSort: true,
  threshold: 0.5,
  location: 0,
  minMatchCharLength: 3,
  findAllMatches: true,
  keys: ["name"],
};

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

  shouldComponentUpdate(nextProps: Readonly<Props>): boolean {
    if (Object.keys(nextProps.drafts) !== Object.keys(this.props.drafts)) {
      return true;
    }
    return nextProps.dataSources !== this.props.dataSources;
  }

  handleCreateNewDatasource = () => {
    const { history } = this.props;
    const { pageId, applicationId } = this.props.match.params;

    history.push(DATA_SOURCES_EDITOR_URL(applicationId, pageId));
  };

  handleItemSelected = (datasource: Datasource) => {
    this.props.onDatasourceChange(datasource);
  };

  handleSearchChange = (e: React.ChangeEvent<{ value: string }>) => {
    const value = e.target.value;
    this.setState({
      search: value,
    });
  };

  getSearchFilteredList = () => {
    const { search } = this.state;
    const { dataSources } = this.props;
    const fuse = new Fuse(dataSources, FUSE_OPTIONS);
    return search ? fuse.search(search) : dataSources;
  };

  renderItem = () => {
    const {
      match: {
        params: { datasourceId },
      },
      datastoreRefs,
      deleteDatasource,
      drafts,
      pluginImages,
    } = this.props;

    const filteredList = this.getSearchFilteredList();

    return filteredList.map(datasource => {
      return (
        <ItemContainer
          data-cy={datasource.id}
          ref={datastoreRefs[datasource.id]}
          key={datasource.id}
          isSelected={datasourceId === datasource.id}
          onClick={() => this.handleItemSelected(datasource)}
        >
          <ActionItem>
            <StyledImage
              src={pluginImages[datasource.pluginId]}
              className="pluginImage"
              alt="Plugin Image"
            />
            <ActionName>{datasource.name}</ActionName>
          </ActionItem>
          <DraftIconIndicator isHidden={!(datasource.id in drafts)} />
          <TreeDropdown
            defaultText=""
            onSelect={() => {
              return null;
            }}
            selectedValue=""
            optionTree={[
              {
                value: "delete",
                onSelect: () => deleteDatasource(datasource.id),
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
            fluid
            className={datasourceId ? "createBtn" : "highlightButton"}
            onClick={this.handleCreateNewDatasource}
          />
        </Container>
        {this.renderItem()}
      </Wrapper>
    );
  }
}

const mapStateToProps = (state: AppState): ReduxStateProps => {
  const { drafts } = state.ui.datasourcePane;
  return {
    formConfigs: state.entities.plugins.formConfigs,
    dataSources: getDataSources(state),
    pluginImages: getPluginImages(state),
    datastoreRefs: state.ui.datasourcePane.datasourceRefs,
    drafts,
  };
};

const mapDispatchToProps = (dispatch: Function): ReduxDispatchProps => ({
  initDatasourcePane: (pluginType: string, urlId?: string) =>
    dispatch(initDatasourcePane(pluginType, urlId)),
  onDatasourceChange: (datasource: Datasource) =>
    dispatch(changeDatasource(datasource)),
  fetchFormConfig: (id: string) => dispatch(fetchPluginForm({ id })),
  selectPlugin: (pluginId: string) => dispatch(selectPlugin(pluginId)),
  initializeForm: (data: Record<string, any>) =>
    dispatch(initialize(DATASOURCE_DB_FORM, data)),
  storeDatastoreRefs: (refsList: {}) => {
    dispatch(storeDatastoreRefs(refsList));
  },
  deleteDatasource: (id: string) => dispatch(deleteDatasource({ id })),
});

export default connect(mapStateToProps, mapDispatchToProps)(DataSourceSidebar);

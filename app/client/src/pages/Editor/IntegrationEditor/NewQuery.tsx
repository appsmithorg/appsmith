import React from "react";
import styled from "styled-components";
import { connect } from "react-redux";
import { createActionRequest } from "actions/pluginActionActions";
import { QueryAction } from "entities/Action";
import DataSourceHome from "./DatasourceHome";

const QueryHomePage = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: 8px;
  .sectionHeader {
    font-weight: ${(props) => props.theme.fontWeights[2]};
    font-size: ${(props) => props.theme.fontSizes[4]}px;
    margin-top: 10px;
  }
`;

type QueryHomeScreenProps = {
  pageId: string;
  createAction: (data: Partial<QueryAction> & { eventData: any }) => void;
  isCreating: boolean;
  location: {
    search: string;
  };
  history: {
    replace: (data: string) => void;
    push: (data: string) => void;
  };
  showUnsupportedPluginDialog: (callback: any) => void;
};

class QueryHomeScreen extends React.Component<QueryHomeScreenProps> {
  render() {
    const {
      history,
      location,
      pageId,
      showUnsupportedPluginDialog,
    } = this.props;

    return (
      <QueryHomePage>
        <DataSourceHome
          history={history}
          location={location}
          pageId={pageId}
          showUnsupportedPluginDialog={showUnsupportedPluginDialog}
        />
      </QueryHomePage>
    );
  }
}

const mapDispatchToProps = (dispatch: any) => ({
  createAction: (data: Partial<QueryAction> & { eventData: any }) => {
    dispatch(createActionRequest(data));
  },
});

export default connect(null, mapDispatchToProps)(QueryHomeScreen);

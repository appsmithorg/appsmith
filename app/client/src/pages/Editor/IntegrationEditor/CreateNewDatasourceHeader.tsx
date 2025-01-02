import { Flex, Text } from "@appsmith/ads";
import type { AppState } from "ee/reducers";
import {
  CONNECT_A_DATASOURCE_HEADING,
  CONNECT_A_DATASOURCE_SUBHEADING,
  createMessage,
  SEARCH_FOR_DATASOURCES,
} from "ee/constants/messages";
import React from "react";
import { connect } from "react-redux";
import styled from "styled-components";
import { Field, formValueSelector, reduxForm } from "redux-form";
import ReduxFormTextField from "components/utils/ReduxFormTextField";

const CREATE_NEW_INTEGRATION_SEARCH_FORM = "CREATE_NEW_INTEGRATION_SEARCH_FORM";

export const pluginSearchSelector = formValueSelector(
  CREATE_NEW_INTEGRATION_SEARCH_FORM,
);

const HeaderText = styled(Flex)`
  flex-grow: 1;
  flex-shrink: 0;
`;

const SearchContainer = styled(Flex)`
  flex-grow: 1;
  max-width: 480px;
  input {
    height: 28px;
    font-size: var(--ads-v2-font-size-3);
  }
`;

interface HeaderProps {
  search?: string;
}

const CreateNewDatasourceHeader = () => {
  return (
    <Flex alignItems="flex-end" gap="spaces-5">
      <HeaderText flexDirection="column">
        <Text kind="heading-l">
          {createMessage(CONNECT_A_DATASOURCE_HEADING)}
        </Text>
        <Text>{createMessage(CONNECT_A_DATASOURCE_SUBHEADING)}</Text>
      </HeaderText>
      <SearchContainer justifyContent="flex-end">
        <Field
          component={ReduxFormTextField}
          name="search"
          placeholder={createMessage(SEARCH_FOR_DATASOURCES)}
          size="md"
          startIcon="search-line"
          style={{ maxWidth: "480px" }}
          type="search"
        />
      </SearchContainer>
    </Flex>
  );
};

export default connect((state: AppState) => {
  return {
    search: pluginSearchSelector(state, "search"),
  };
}, null)(
  reduxForm<HeaderProps>({
    form: CREATE_NEW_INTEGRATION_SEARCH_FORM,
    enableReinitialize: true,
  })(CreateNewDatasourceHeader),
);

import React from "react";
import styled from "styled-components";
import Secure from "assets/images/secure.svg";
import AppsmithDatasource from "assets/images/appsmith-datasource.svg";
import { Colors } from "constants/Colors";
import { BaseButton } from "components/designSystems/appsmith/BaseButton";

const Wrapper = styled.div`
  border: 2px solid #d6d6d6;
  padding: 23px;
  flex-direction: row;
  display: flex;
`;

const Header = styled.div`
  font-weight: 600;
  font-size: 24px;
  color: ${Colors.OXFORD_BLUE};
  margin-top: 8px;
`;

const Content = styled.div`
  margin-top: 8px;
  color: ${Colors.OXFORD_BLUE};
  max-width: 65%;
`;

const ActionButton = styled(BaseButton)`
  &&& {
    max-width: 155px;
    max-height: 36px;
    margin-top: 18px;
  }
`;

type AddDatasourceSecurelyProps = {
  onAddDatasource: () => void;
};

function AddDatasourceSecurely(props: AddDatasourceSecurelyProps) {
  return (
    <Wrapper>
      <div>
        <img src={Secure} />
        <Header>Secure & fast database connection</Header>
        <Content>
          Connect your database to start building read/write workflows. Your
          Passwords are fully encrypted and we never store any of your data.
          That’s a promise.
        </Content>
        <ActionButton
          accent="primary"
          className="t--add-datasource"
          filled
          icon={"plus"}
          onClick={props.onAddDatasource}
          text="New Datasource"
        />
      </div>
      <img src={AppsmithDatasource} />
    </Wrapper>
  );
}

export default AddDatasourceSecurely;

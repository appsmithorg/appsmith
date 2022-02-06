import React from "react";
import styled from "styled-components";
import Secure from "assets/images/secure.svg";
import AppsmithDatasource from "assets/images/appsmith-datasource.svg";
import { Colors } from "constants/Colors";

const Wrapper = styled.div`
  border: 2px solid #d6d6d6;
  padding: 23px;
  flex-direction: row;
  display: flex;
  justify-content: space-between;
  align-items: center;

  .datasource-img {
    height: 108px;
  }
`;

const HeadWrapper = styled.div`
  display: flex;
  align-items: center;
  & > img {
    margin-right: 10px;
  }
`;

const Header = styled.div`
  font-weight: 600;
  font-size: 24px;
  line-height: 32px;
  color: ${Colors.OXFORD_BLUE};
`;

const Content = styled.p`
  margin-top: 8px;
  color: ${Colors.OXFORD_BLUE};
  max-width: 360px;
  font-size: 14px;
  line-height: 20px;
`;

function AddDatasourceSecurely() {
  return (
    <Wrapper>
      <div>
        <HeadWrapper>
          <img src={Secure} />
          <Header>Secure & fast database connection</Header>
        </HeadWrapper>
        <Content>
          Connect your database to start building read/write workflows. Your
          Passwords are fully encrypted and we never store any of your data.
          That’s a promise.
        </Content>
      </div>
      <img className="datasource-img" src={AppsmithDatasource} />
    </Wrapper>
  );
}

export default AddDatasourceSecurely;

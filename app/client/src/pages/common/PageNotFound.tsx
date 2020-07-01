import React from "react";
import styled from "styled-components";
import { NonIdealState, Button, Card, Elevation } from "@blueprintjs/core";
import { RouterProps } from "react-router";

const NotFoundPageWrapper = styled.div`
  width: 100vw;
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
`;
const Title = styled.div`
  font-size: ${props => props.theme.fontSizes[10]}px;
  text-align: center;
`;
class PageNotFound extends React.PureComponent<RouterProps> {
  public render() {
    return (
      <NotFoundPageWrapper>
        <Card elevation={Elevation.TWO}>
          <Title>
            <span role="img" aria-label="Page Not Found">
              🙊
            </span>
          </Title>
          <NonIdealState
            description={
              "We didn't mean for you to reach this page. Let's find your way back to building awesome applications."
            }
            action={
              <Button
                onClick={() => {
                  this.props.history.push("/");
                }}
              >
                {"Home"}
              </Button>
            }
          />
        </Card>
      </NotFoundPageWrapper>
    );
  }
}

export default PageNotFound;

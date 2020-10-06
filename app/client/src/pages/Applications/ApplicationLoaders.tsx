import { Classes } from "@blueprintjs/core";
import { Theme } from "constants/DefaultTheme";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";

export const LoadingAnimation = createGlobalStyle<{ theme: Theme }>`
	&&&& .${Classes.SKELETON} {
		background:  ${props => props.theme.colors.loader.light};;
		border-color:  ${props => props.theme.colors.loader.light};;
		animation: 1000ms linear infinite alternate loaderAnimation;

		@keyframes loaderAnimation {
			from {
				background: ${props => props.theme.colors.loader.light};
				border-color:  ${props => props.theme.colors.loader.light};;
			}

			to {
				background: ${props => props.theme.colors.loader.dark};
				border-color: ${props => props.theme.colors.loader.dark};
			}
		}
	}
`;

const LoaderContainer = styled.div`
  margin-top: 50px;
  margin-left: 400px;
`;

const SmallAppName = styled.div`
  margin-top: 10px;
  width: 75px;
  height: 16px;
`;

const AppsContainer = styled.div`
  display: flex;
  align-items: center;

  .app-box:nth-child(1) {
    margin-left: 0px;
  }
  .app-box {
    margin-top: 10px;
  }
`;

const Container = styled.div`
  margin: 32px;
`;

const OrgLoader = styled.div`
  margin-bottom: 50px;
`;

const OrgNameLoader = styled.div`
  width: 76px;
  height: 22px;
  margin-bottom: 26px;
`;

const ContentLoader = styled.div`
  width: 150px;
  height: 150px;
`;

const PaneLoader = styled.div`
  width: 170px;
  margin: 50px 0px;
`;

const LoadingHeader = styled.div`
  width: 92px;
  height: 10px;
`;

const LoadingOrgs = styled.div`
  width: 170px;
  height: 16px;
  margin-top: 20px;
`;

export const AppLoader = () => {
  return (
    <>
      <LoadingAnimation />
      <Container className="app-box">
        <ContentLoader className={Classes.SKELETON}></ContentLoader>
        <SmallAppName className={Classes.SKELETON}></SmallAppName>
      </Container>
    </>
  );
};

export const ApplicationLoader = () => {
  return (
    <LoaderContainer>
      <LoadingAnimation />
      {[1, 2].map((el: number) => {
        const arr = [1, 2];
        if (el === 2) {
          arr.push(3);
        }
        return (
          <OrgLoader key={el}>
            <OrgNameLoader className={Classes.SKELETON}></OrgNameLoader>
            <AppsContainer>
              {arr.map((_, index) => (
                <AppLoader key={index} />
              ))}
            </AppsContainer>
          </OrgLoader>
        );
      })}
    </LoaderContainer>
  );
};

export const LeftPaneLoader = () => {
  return (
    <React.Fragment>
      <LoadingAnimation />
      {[1, 2].map(org => (
        <PaneLoader key={org}>
          <LoadingHeader className={Classes.SKELETON}></LoadingHeader>
          {[1, 2, 3].map(el => (
            <LoadingOrgs key={el} className={Classes.SKELETON}></LoadingOrgs>
          ))}
        </PaneLoader>
      ))}
    </React.Fragment>
  );
};

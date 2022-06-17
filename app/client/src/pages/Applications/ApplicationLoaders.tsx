import { Classes } from "@blueprintjs/core";
import { Theme } from "constants/DefaultTheme";
import React from "react";
import styled, { createGlobalStyle } from "styled-components";

export const LoadingAnimation = createGlobalStyle<{ theme: Theme }>`
	&&&& .${Classes.SKELETON} {
		background:  ${(props) => props.theme.colors.loader.light};;
		border-color:  ${(props) => props.theme.colors.loader.light};;
		animation: 1000ms linear infinite alternate loaderAnimation;

		@keyframes loaderAnimation {
			from {
				background: ${(props) => props.theme.colors.loader.light};
				border-color:  ${(props) => props.theme.colors.loader.light};;
			}

			to {
				background: ${(props) => props.theme.colors.loader.dark};
				border-color: ${(props) => props.theme.colors.loader.dark};
			}
		}
	}
`;

export const loadingUserOrgs = [
  {
    organization: {
      id: "loadingOrgId1",
      userPermissions: ["read:organizations", "read:orgApplications"],
      name: "loadingOrgName1",
      organizationSettings: [],
      plugins: [
        {
          userPermissions: [],
          pluginId: "5c9f512f96c1a50004819786",
          status: "FREE",
          new: true,
        },
        {
          userPermissions: [],
          pluginId: "5ca385dc81b37f0004b4db85",
          status: "FREE",
          new: true,
        },
        {
          userPermissions: [],
          pluginId: "5e687c18fb01e64e6a3f873f",
          status: "FREE",
          new: true,
        },
        {
          userPermissions: [],
          pluginId: "5e75ce2b8f4b473507a4a52e",
          status: "FREE",
          new: true,
        },
        {
          userPermissions: [],
          pluginId: "5f16c4be93f44d4622f487e2",
          status: "FREE",
          new: true,
        },
      ],
      slug: "d60b8e5f",
      logoUrl: "/api/v1/assets/null",
      new: false,
    },
    applications: [
      {
        id: "loadingAppId1",
        userPermissions: ["read:applications"],
        name: "loadingAppName1",
        organizationId: "loadingOrgId1",
        isPublic: false,
        pages: [
          {
            id: "5f7c3bc3b295692137139bd7",
            isDefault: true,
            default: true,
          },
        ],
        appIsExample: false,
        new: false,
        defaultPageId: "5f7c3bc3b295692137139bd7",
      },
      {
        id: "loadingAppId2",
        userPermissions: ["read:applications"],
        name: "loadingAppName2",
        organizationId: "loadingOrgId1",
        isPublic: false,
        pages: [
          {
            id: "5f7daa65349e65508a53e3c1",
            isDefault: true,
            default: true,
          },
        ],
        appIsExample: false,
        color: "#5CE7EF",
        new: false,
        defaultPageId: "5f7daa65349e65508a53e3c1",
      },
    ],
  },
  {
    organization: {
      id: "loadingOrgId2",
      userPermissions: [
        "read:organizations",
        "manage:orgApplications",
        "inviteUsers:organization",
        "manage:organizations",
        "publish:orgApplications",
        "read:orgApplications",
      ],
      name: "loadingOrgName2",
      organizationSettings: [],
      plugins: [
        {
          userPermissions: [],
          pluginId: "5c9f512f96c1a50004819786",
          status: "FREE",
          new: true,
        },
        {
          userPermissions: [],
          pluginId: "5ca385dc81b37f0004b4db85",
          status: "FREE",
          new: true,
        },
        {
          userPermissions: [],
          pluginId: "5e687c18fb01e64e6a3f873f",
          status: "FREE",
          new: true,
        },
        {
          userPermissions: [],
          pluginId: "5e75ce2b8f4b473507a4a52e",
          status: "FREE",
          new: true,
        },
        {
          userPermissions: [],
          pluginId: "5f16c4be93f44d4622f487e2",
          status: "FREE",
          new: true,
        },
      ],
      slug: "aaf8723f",
      logoUrl: "/api/v1/assets/null",
      new: false,
    },
    applications: [
      {
        id: "loadingAppId3",
        userPermissions: ["read:applications"],
        name: "loadingAppName3",
        organizationId: "loadingOrgId2",
        isPublic: false,
        pages: [
          {
            id: "5f7da6d6e71ebc07bb2699f5",
            isDefault: true,
            default: true,
          },
        ],
        appIsExample: false,
        new: false,
        defaultPageId: "5f7da6d6e71ebc07bb2699f5",
      },
      {
        id: "loadingAppId4",
        userPermissions: ["read:applications"],
        name: "loadingAppName4",
        organizationId: "loadingOrgId2",
        isPublic: false,
        pages: [
          {
            id: "5f7da88ee71ebc07bb269a03",
            isDefault: true,
            default: true,
          },
        ],
        appIsExample: false,
        new: false,
        defaultPageId: "5f7da88ee71ebc07bb269a03",
      },
      {
        id: "loadingAppId5",
        userPermissions: ["read:applications"],
        name: "loadingAppName5",
        organizationId: "loadingOrgId2",
        isPublic: false,
        pages: [
          {
            id: "5f7da915349e65508a53e3b6",
            isDefault: true,
            default: true,
          },
        ],
        appIsExample: false,
        new: false,
        defaultPageId: "5f7da915349e65508a53e3b6",
      },
    ],
  },
];

const AppName = styled.div`
  margin-top: 10px;
  width: 150px;
  height: 16px;
`;

const Container = styled.div`
  margin: 32px;
`;

const ContentLoader = styled.div`
  width: 150px;
  height: 150px;
`;

export function AppLoader() {
  return (
    <>
      <LoadingAnimation />
      <Container className="app-box">
        <ContentLoader className={Classes.SKELETON} />
        <AppName className={Classes.SKELETON} />
      </Container>
    </>
  );
}

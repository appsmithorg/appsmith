export class Provisioning {
  public locators = {
    provisioningCategory: ".t--settings-category-provisioning",
    pageHeader: "[data-testid='t--provisioning-header']",
    methodCard: "[data-testid='t--method-card']",
    cardTitle: "[data-testid='t--method-title']",
    configureButton: "[data-testid='t--btn-scim-configure']",
    generateApiKeyButton: "[data-testid='t--generate-api-key']",
    apiKey: "[data-testid='scim-api-key']",
    copyApiKey: "[data-testid='scim-api-key-copy-icon']",
    copyScimEndpoint: "[data-testid='scim-api-endpoint-copy-icon']",
    inputScimApiEndpoint: "input[name='scim-api-endpoint']",
    inputScimApiKey: "input[name='scim-api-key']",
    disableScimButton: "[data-testid='t--disable-scim-btn']",
    connectionStatus: "[data-testid='t--connection-status']",
    lastSyncInfo: "[data-testid='t--last-sync-info']",
    syncedResourcesInfo: "[data-testid='t--synced-resources-info']",
    disableScimConfigBtn: "[data-testid='t--disable-scim-config-button']",
    confirmCheckbox: ".ads-v2-checkbox",
    radioButtons: ".ads-v2-radio",
    confirmButton: "[data-testid='t--confirm-reconfigure-api-key']",
    cancelButton: "[data-testid='t--cancel-reconfigure-api-key']",
  };

  public UpdateLicenseKey(type?: "business" | "enterprise") {
    cy.request({
      method: "PUT",
      url: "/api/v1/tenants/license",
      body: {
        key:
          type === "business"
            ? "BUSINESS-PAID-LICENSE-KEY"
            : "VALID-LICENSE-KEY",
      },
      failOnStatusCode: false,
    })
      .its("status")
      .should("equal", 200);
  }

  public GetApiKey() {
    return cy
      .request({
        method: "POST",
        url: `/api/v1/api-key/provision`,
        body: {},
        headers: {
          "X-Requested-By": "Appsmith",
        },
      })
      .then((response) => {
        return response;
      });
  }

  public GetUsers(apiKey: string, id?: string, filter?: string) {
    return cy
      .request({
        method: "GET",
        url: `/scim/Users${id ? `/${id}` : ""}${
          filter ? `?filter=userName eq ${filter}` : ""
        }`,
        body: {},
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }

  public GetGroups(apiKey: string, id?: string, filter?: string) {
    return cy
      .request({
        method: "GET",
        url: `/scim/Groups${id ? `/${id}` : ""}${
          filter ? `?filter=displayName eq ${filter}` : ""
        }`,
        body: {},
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }

  public CreateUser(apiKey: string, userObj: any) {
    return cy
      .request({
        method: "POST",
        url: "/scim/Users",
        body: userObj,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }

  public CreateGroup(apiKey: string, groupObj: any) {
    return cy
      .request({
        method: "POST",
        url: "/scim/Groups",
        body: groupObj,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }

  public UpdateUser(apiKey: string, userObj: any, userId: string) {
    return cy
      .request({
        method: "PUT",
        url: `/scim/Users/${userId}`,
        body: userObj,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }

  public UpdateGroup(apiKey: string, groupObj: any, groupId: string) {
    return cy
      .request({
        method: "PUT",
        url: `/scim/Groups/${groupId}`,
        body: groupObj,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }

  public PatchGroup(apiKey: string, groupObj: any, groupId: string) {
    return cy
      .request({
        method: "PATCH",
        url: `/scim/Groups/${groupId}`,
        body: groupObj,
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }

  public DeleteUser(apiKey: string, userId: string) {
    return cy
      .request({
        method: "DELETE",
        url: `/scim/Users/${userId}`,
        body: {},
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }

  public DeleteGroup(apiKey: string, groupId: string) {
    return cy
      .request({
        method: "DELETE",
        url: `/scim/Groups/${groupId}`,
        body: {},
        headers: {
          Authorization: `Bearer ${apiKey}`,
        },
      })
      .then((response) => {
        return response;
      });
  }
}

export enum UserAttributes {
  userName = "userName",
  active = "active",
  email = "email",
  id = "id",
  displayName = "displayName",
}

export enum GroupAttributes {
  displayName = "displayName",
  members = "members",
  id = "id",
  description = "description",
}

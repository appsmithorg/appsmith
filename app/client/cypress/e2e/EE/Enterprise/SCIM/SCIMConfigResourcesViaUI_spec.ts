import {
  agHelper,
  adminSettings,
  provisioning,
  deployMode,
} from "../../../../support/ee/ObjectsCore_EE";
import RBAC from "../../../../locators/RBAClocators.json";
import {
  GroupAttributes,
  UserAttributes,
} from "../../../../support/Pages/ProvisioningHelper";
import adminsSettings from "../../../../locators/AdminsSettings";
import { featureFlagIntercept } from "../../../../support/Objects/FeatureFlags";

describe("SCIM Provisioning", function () {
  let scimEndpointUrl: any, apiKey: any;
  let email = "";
  let userId = "";
  let groupName = "";
  let groupId = "";
  let email2 = "";
  let userId2 = "";
  let groupName2 = "";

  before(() => {
    agHelper.GenerateUUID();
    cy.get("@guid").then((uuid) => {
      email = `${uuid}@appsmith.com`.toLocaleLowerCase();
    });

    agHelper.GenerateUUID();
    cy.get("@guid").then((uuid) => {
      email2 = `${uuid}@appsmith.com`.toLocaleLowerCase();
    });

    agHelper.GenerateUUID();
    cy.get("@guid").then((uuid) => {
      groupName = `${uuid}`;
    });

    agHelper.GenerateUUID();
    cy.get("@guid").then((uuid) => {
      groupName2 = `${uuid}`;
    });
  });

  // Upgrade page for Business edition
  it.skip(
    "excludeForAirgap",
    "1. Go to admin settings and check provisioning should show upgrade page for business edition",
    function () {
      provisioning.UpdateLicenseKey();
      agHelper.Sleep(4000);
      agHelper.VisitNAssert("/settings/general", "getEnvVariables");
      // click provisioning tab
      agHelper.GetNClick(adminsSettings.provisioning);
      agHelper.AssertURL("/settings/provisioning");
      cy.get(adminsSettings.provisioning).within(() => {
        cy.get(adminsSettings.enterpriseTag)
          .should("exist")
          .should("contain", "Enterprise");
      });
      deployMode.StubWindowNAssert(
        adminsSettings.upgrade,
        "https://www.appsmith.com/pricing?source=BE",
        "getEnvVariables",
      );
      cy.wait(2000);
    },
  );

  it(
    "excludeForAirgap",
    "1. Go to admin settings and check provisioning should show upgrade page for free plan",
    function () {
      agHelper.VisitNAssert("/settings/general", "getEnvVariables");

      featureFlagIntercept({ license_scim_enabled: false });

      // click provisioning tab
      agHelper.GetNClick(adminsSettings.provisioning);
      agHelper.AssertURL("/settings/provisioning");
      cy.get(adminsSettings.provisioning).within(() => {
        cy.get(adminsSettings.enterpriseTag)
          .should("exist")
          .should("contain", "Enterprise");
      });

      cy.get(provisioning.locators.upgradeContainer).should("be.visible");
      cy.get(provisioning.locators.upgradeButton)
        .should("be.visible")
        .should("have.text", "Upgrade");
      deployMode.StubWindowNAssert(
        adminsSettings.upgrade,
        "https://www.appsmith.com/pricing?source=BE",
        "getEnvVariables",
      );
      cy.wait(2000);
    },
  );

  // Configuring SCIM to test Remove resources flow
  it(
    "excludeForAirgap",
    "2. Go to admin settings and configure SCIM",
    function () {
      // provisioning.UpdateLicenseKey("enterprise");
      provisioning.UpdateLicenseKey();
      agHelper.Sleep(4000);
      agHelper.VisitNAssert("/settings/general", "getEnvVariables");
      // click provisioning tab
      agHelper.GetNClick(provisioning.locators.provisioningCategory);
      agHelper.AssertURL("/settings/provisioning");
      agHelper.WaitUntilEleAppear(provisioning.locators.pageHeader);
      agHelper.GetNAssertElementText(
        provisioning.locators.pageHeader,
        "User provisioning & Group sync",
      );
      agHelper.AssertElementLength(provisioning.locators.methodCard, 1);
      agHelper.GetNAssertElementText(
        provisioning.locators.cardTitle,
        "System for Cross-domain Identity Management",
      );
      agHelper.GetNAssertElementText(
        provisioning.locators.configureButton,
        "Configure",
      );
      agHelper.GetNClick(provisioning.locators.configureButton);
      agHelper.AssertURL("/settings/provisioning/scim");

      cy.get(provisioning.locators.inputScimApiEndpoint)
        .invoke("val")
        .then((value: any) => {
          scimEndpointUrl = value;
        });

      // agHelper.GetNClick(provisioning.locators.inputScimApiEndpoint);
      // agHelper.WaitUntilToastDisappear("SCIM API endpoint copied to clipboard");

      // cy.window()
      //   .its("navigator.clipboard")
      //   .invoke("readText")
      //   .then((text) => {
      //     cy.wrap(text).as("scimEndpointUrl");
      //   });

      // cy.get("@scimEndpointUrl").then((url) => {
      // scimEndpointUrl = url.toString();
      // agHelper.ValidateFieldInputValue(
      //   provisioning.locators.inputScimApiEndpoint,
      //   scimEndpointUrl,
      // );
      // });

      agHelper.GetElementsNAssertTextPresence(
        provisioning.locators.generateApiKeyButton,
        "Generate API key",
      );
      agHelper.GetNClick(provisioning.locators.generateApiKeyButton);
      cy.get(provisioning.locators.inputScimApiKey)
        .invoke("val")
        .then((value: any) => {
          apiKey = value;
        });
      // agHelper.GetNClick(provisioning.locators.inputScimApiKey);
      // agHelper.WaitUntilToastDisappear(
      //   "API key to setup SCIM copied to clipboard",
      // );
      // cy.window()
      //   .its("navigator.clipboard")
      //   .invoke("readText")
      //   .then((text) => {
      //     cy.wrap(text).as("apiKey");
      //   });

      // cy.get("@apiKey").then((key) => {
      //   apiKey = key;
      // });
    },
  );

  it("airgap", "2. Go to admin settings and configure SCIM", function () {
    agHelper.Sleep(4000);
    agHelper.VisitNAssert("/settings/general", "getEnvVariables");
    // click provisioning tab
    agHelper.GetNClick(provisioning.locators.provisioningCategory);
    agHelper.AssertURL("/settings/provisioning");
    agHelper.WaitUntilEleAppear(provisioning.locators.pageHeader);
    agHelper.GetNAssertElementText(
      provisioning.locators.pageHeader,
      "User provisioning & Group sync",
    );
    agHelper.AssertElementLength(provisioning.locators.methodCard, 1);
    agHelper.GetNAssertElementText(
      provisioning.locators.cardTitle,
      "System for Cross-domain Identity Management",
    );
    agHelper.GetNAssertElementText(
      provisioning.locators.configureButton,
      "Configure",
    );
    agHelper.GetNClick(provisioning.locators.configureButton);
    agHelper.AssertURL("/settings/provisioning/scim");

    cy.get(provisioning.locators.inputScimApiEndpoint)
      .invoke("val")
      .then((value: any) => {
        scimEndpointUrl = value;
      });

    // agHelper.GetNClick(provisioning.locators.inputScimApiEndpoint);
    // agHelper.WaitUntilToastDisappear("SCIM API endpoint copied to clipboard");

    // cy.window()
    //   .its("navigator.clipboard")
    //   .invoke("readText")
    //   .then((text) => {
    //     cy.wrap(text).as("scimEndpointUrl");
    //   });

    // cy.get("@scimEndpointUrl").then((url) => {
    // scimEndpointUrl = url.toString();
    // agHelper.ValidateFieldInputValue(
    //   provisioning.locators.inputScimApiEndpoint,
    //   scimEndpointUrl,
    // );
    // });

    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.generateApiKeyButton,
      "Generate API key",
    );
    agHelper.GetNClick(provisioning.locators.generateApiKeyButton);
    cy.get(provisioning.locators.inputScimApiKey)
      .invoke("val")
      .then((value: any) => {
        apiKey = value;
      });
    // agHelper.GetNClick(provisioning.locators.inputScimApiKey);
    // agHelper.WaitUntilToastDisappear(
    //   "API key to setup SCIM copied to clipboard",
    // );
    // cy.window()
    //   .its("navigator.clipboard")
    //   .invoke("readText")
    //   .then((text) => {
    //     cy.wrap(text).as("apiKey");
    //   });

    // cy.get("@apiKey").then((key) => {
    //   apiKey = key;
    // });
  });

  it("3. SCIM provisioning should be configured but inactive", function () {
    adminSettings.NavigateToAdminSettings();
    // click provisioning tab
    agHelper.GetNClick(provisioning.locators.provisioningCategory);
    agHelper.AssertURL("/settings/provisioning");
    agHelper.WaitUntilEleAppear(provisioning.locators.pageHeader);
    agHelper.GetNAssertElementText(
      provisioning.locators.pageHeader,
      "User provisioning & Group sync",
    );
    agHelper.AssertElementLength(provisioning.locators.methodCard, 1);
    agHelper.GetNAssertElementText(
      provisioning.locators.cardTitle,
      "System for Cross-domain Identity Management",
    );
    agHelper.GetNAssertElementText(
      provisioning.locators.configureButton,
      "Edit",
    );
    agHelper.GetNClick(provisioning.locators.configureButton);
    agHelper.AssertURL("/settings/provisioning/scim");
    agHelper.WaitUntilEleAppear(provisioning.locators.generateApiKeyButton);

    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.generateApiKeyButton,
      "Re-configure API key",
    );
    agHelper.GetNClick(provisioning.locators.generateApiKeyButton);
    agHelper.GetNClick(provisioning.locators.cancelButton);
    agHelper.AssertElementAbsence(provisioning.locators.inputScimApiKey);
    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.generateApiKeyButton,
      "Re-configure API key",
    );
    agHelper.GetNClick(provisioning.locators.generateApiKeyButton);
    agHelper.GetNClick(provisioning.locators.confirmButton);
    cy.get(provisioning.locators.inputScimApiKey)
      .invoke("val")
      .then((value: any) => {
        apiKey = value;
      });
    // agHelper.GetNClick(provisioning.locators.inputScimApiKey);
    // agHelper.WaitUntilToastDisappear(
    //   "API key to setup SCIM copied to clipboard",
    // );
    // cy.window()
    //   .its("navigator.clipboard")
    //   .invoke("readText")
    //   .then((text) => {
    //     cy.wrap(text).as("apiKey");
    //   });

    // cy.get("@apiKey").then((key) => {
    //   apiKey = key;
    // });

    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.connectionStatus,
      "Connection Inactive",
    );
    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.lastSyncInfo,
      "Last sync never happened",
    );
    agHelper.GetNAssertContains(
      provisioning.locators.syncedResourcesInfo,
      "0 users and 0 groups are linked to your IdP",
    );
    agHelper.AssertElementExist(provisioning.locators.disableScimButton);
  });

  // All API tests for SCIM
  it("4. Fetch all users and groups via SCIM", function () {
    provisioning.GetUsers(apiKey).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);
      expect(body).to.have.property("totalResults");
      expect(body).to.have.property("itemsPerPage");
      expect(body).to.have.property("Resources");
      expect(body.Resources).to.be.an("array");
      expect(body.Resources[0]).to.have.property(UserAttributes.id);
      expect(body.Resources[0]).to.have.property(UserAttributes.userName);
      expect(body.Resources[0]).to.have.property(UserAttributes.displayName);
      expect(body.Resources[0]).to.have.property(UserAttributes.active);
      expect(body.Resources[0]).to.have.property(UserAttributes.email);

      cy.wrap(body.totalResults).should("be.gte", 1);
      cy.wrap(body.itemsPerPage).should("be.gte", 1);
      cy.wrap(body.Resources.length).should("be.gte", 1);
      expect(
        body.Resources.findIndex(
          (x: any) => x.email === Cypress.env("USERNAME"),
        ),
      ).not.equal(-1);
    });

    provisioning.GetGroups(apiKey).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);
      expect(body).to.have.property("totalResults");
      expect(body).to.have.property("itemsPerPage");
      expect(body).to.have.property("Resources");
      expect(body.Resources).to.be.an("array");

      expect(body.totalResults).equal(0);
      expect(body.itemsPerPage).equal(0);
      expect(body.Resources.length).equal(0);
    });
  });

  it("5. Create a user via SCIM", function () {
    const userObj: any = {
      userName: email,
      displayName: "Test User",
    };

    provisioning.CreateUser(apiKey, userObj).then((response) => {
      const body = response.body;
      expect(response.status).equal(201);

      expect(body).to.have.property(UserAttributes.id);
      expect(body).to.have.property(UserAttributes.userName);
      expect(body).to.have.property(UserAttributes.displayName);
      expect(body).to.have.property(UserAttributes.active);
      expect(body).to.have.property(UserAttributes.email);

      expect(body.userName).equal(email);
      expect(body.active).equal(true);
      expect(body.email).equal(email);
      expect(body.displayName).equal("Test User");

      userId = body.id; // get user id to add this user in group

      provisioning.GetUsers(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        cy.wrap(body.totalResults).should("be.gte", 1);
        cy.wrap(body.itemsPerPage).should("be.gte", 1);
        cy.wrap(body.Resources.length).should("be.gte", 1);
        expect(
          body.Resources.findIndex((x: any) => x.email === email),
        ).not.equal(-1);
      });

      agHelper.VisitNAssert("/settings/users", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, email);
      agHelper.GetNAssertContains(RBAC.searchHighlight, email);
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");
      agHelper.GetNClick(RBAC.userContextMenu, 0, true);
      agHelper.AssertElementLength(RBAC.menuItems, 1);
      agHelper.AssertElementAbsence(RBAC.delete);

      agHelper.VisitNAssert(`/settings/users/${userId}`, "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.userName);
      agHelper.GetNAssertContains(RBAC.userName, "Test User");
      agHelper.AssertElementAbsence(RBAC.userContextMenu);
    });

    const userObj2: any = {
      userName: email2,
      displayName: "Test User 2",
    };

    provisioning.CreateUser(apiKey, userObj2).then((response) => {
      const body = response.body;
      expect(response.status).equal(201);
      userId2 = body.id;
    });
  });

  it("6. Create a group via SCIM", function () {
    const groupObj: any = {
      displayName: groupName,
      description: "Test Group Description",
      members: [{ value: userId, type: "User" }],
    };

    provisioning.CreateGroup(apiKey, groupObj).then((response) => {
      const body = response.body;
      expect(response.status).equal(201);

      expect(body).to.have.property(GroupAttributes.id);
      expect(body).to.have.property(GroupAttributes.displayName);
      expect(body).to.have.property(GroupAttributes.description);
      expect(body.displayName).equal(groupName);
      expect(body.description).equal("Test Group Description");

      groupId = body.id;
      provisioning.GetGroups(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        expect(body.totalResults).equal(1);
        expect(body.itemsPerPage).equal(1);
        expect(body.Resources.length).equal(1);
        expect(
          body.Resources.findIndex((x: any) => x.displayName === groupName),
        ).not.equal(-1);
      });

      agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, groupName);
      agHelper.GetNAssertContains(RBAC.searchHighlight, groupName);
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");
      agHelper.AssertElementAbsence(RBAC.userContextMenu);

      agHelper.VisitNAssert(`/settings/groups/${groupId}`, "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.AssertElementLength(RBAC.groupMembers, 1);
      agHelper.GetNAssertContains(RBAC.groupMembers, email);
      agHelper.AssertElementEnabledDisabled(RBAC.addButton, 0, true);
      agHelper.AssertElementAbsence(RBAC.menuIconUserGroupPage);
    });

    const groupObj2: any = {
      displayName: groupName2,
      description: "Test Group Description 2",
      members: [{ value: userId, type: "User" }],
    };

    provisioning.CreateGroup(apiKey, groupObj2).then((response) => {
      const body = response.body;
      expect(response.status).equal(201);
    });
  });

  it("7. Fetch user by id and filter via SCIM", function () {
    provisioning.GetUsers(apiKey, userId).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);
      expect(body).to.be.not.an("array");
      expect(body).to.have.property(UserAttributes.id);
      expect(body).to.have.property(UserAttributes.userName);
      expect(body).to.have.property(UserAttributes.displayName);
      expect(body).to.have.property(UserAttributes.active);
      expect(body).to.have.property(UserAttributes.email);
      expect(body.userName).equal(email);
      expect(body.active).equal(true);
      expect(body.email).equal(email);
      expect(body.displayName).equal("Test User");
      expect(body.id).equal(userId);
    });

    provisioning.GetUsers(apiKey, "", email).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);
      expect(body).to.have.property("totalResults");
      expect(body).to.have.property("itemsPerPage");
      expect(body).to.have.property("Resources");
      expect(body.Resources).to.be.an("array");
      expect(body.Resources[0]).to.have.property(UserAttributes.id);
      expect(body.Resources[0]).to.have.property(UserAttributes.userName);
      expect(body.Resources[0]).to.have.property(UserAttributes.displayName);
      expect(body.Resources[0]).to.have.property(UserAttributes.active);
      expect(body.Resources[0]).to.have.property(UserAttributes.email);

      expect(body.totalResults).equal(1);
      expect(body.itemsPerPage).equal(1);
      expect(body.Resources.length).equal(1);
      expect(body.Resources[0].userName).equal(email);
      expect(body.Resources[0].active).equal(true);
      expect(body.Resources[0].email).equal(email);
      expect(body.Resources[0].displayName).equal("Test User");
      expect(body.Resources[0].id).equal(userId);
    });
  });

  it("8. Fetch group by id and filter via SCIM", function () {
    provisioning.GetGroups(apiKey, groupId).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);
      expect(body).to.be.not.an("array");
      expect(body).to.have.property(GroupAttributes.id);
      expect(body).to.have.property(GroupAttributes.displayName);
      expect(body).to.have.property(GroupAttributes.description);
      expect(body).to.have.property(GroupAttributes.members);
      expect(body.displayName).equal(groupName);
      expect(body.description).equal("Test Group Description");
      expect(body.members.length).equal(1);
      expect(body.id).equal(groupId);
    });

    provisioning.GetGroups(apiKey, "", groupName).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);
      expect(body).to.have.property("totalResults");
      expect(body).to.have.property("itemsPerPage");
      expect(body).to.have.property("Resources");
      expect(body.Resources).to.be.an("array");
      expect(body.Resources[0]).to.have.property(GroupAttributes.id);
      expect(body.Resources[0]).to.have.property(GroupAttributes.displayName);
      expect(body.Resources[0]).to.have.property(GroupAttributes.description);
      expect(body.Resources[0]).to.have.property(GroupAttributes.members);

      expect(body.totalResults).equal(1);
      expect(body.itemsPerPage).equal(1);
      expect(body.Resources.length).equal(1);
      expect(body.Resources[0].displayName).equal(groupName);
      expect(body.Resources[0].description).equal("Test Group Description");
      expect(body.Resources[0].members.length).equal(1);
      expect(body.Resources[0].id).equal(groupId);
      expect(body.Resources[0].members[0].value).equal(userId);
    });
  });

  it("9. Update a user via SCIM", function () {
    const userObj: any = {
      displayName: "Test User Renamed",
    };

    provisioning.UpdateUser(apiKey, userObj, userId).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);

      expect(body).to.have.property(UserAttributes.id);
      expect(body).to.have.property(UserAttributes.userName);
      expect(body).to.have.property(UserAttributes.displayName);
      expect(body).to.have.property(UserAttributes.active);
      expect(body).to.have.property(UserAttributes.email);

      expect(body.userName).equal(email);
      expect(body.active).equal(true);
      expect(body.email).equal(email);
      expect(body.displayName).equal("Test User Renamed");

      userId = body.id; // get user id to add this user in group

      provisioning.GetUsers(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        cy.wrap(body.totalResults).should("be.gte", 1);
        cy.wrap(body.itemsPerPage).should("be.gte", 1);
        cy.wrap(body.Resources.length).should("be.gte", 1);
        expect(
          body.Resources.findIndex((x: any) => x.email === email),
        ).not.equal(-1);
      });

      agHelper.VisitNAssert("/settings/users", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, email);
      agHelper.GetNAssertContains(RBAC.searchHighlight, email);
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");

      agHelper.VisitNAssert(`/settings/users/${userId}`, "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.userName);
      agHelper.GetNAssertContains(RBAC.userName, "Test User Renamed");
    });
  });

  it("10. Update a group's data via SCIM (Replicating Azure)", function () {
    const groupObj: any = {
      Operations: [
        {
          op: "Replace",
          path: "displayName",
          value: "Test Group 2",
        },
      ],
    };

    provisioning.PatchGroup(apiKey, groupObj, groupId).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);

      expect(body).to.have.property(GroupAttributes.id);
      expect(body).to.have.property(GroupAttributes.displayName);
      expect(body.displayName).equal("Test Group 2");

      groupId = body.id;
      provisioning.GetGroups(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        expect(body.totalResults).equal(2);
        expect(body.itemsPerPage).equal(2);
        expect(body.Resources.length).equal(2);
        expect(
          body.Resources.findIndex(
            (x: any) => x.displayName === "Test Group 2",
          ),
        ).not.equal(-1);
      });

      agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, "Test Group 2");
      agHelper.GetNAssertContains(RBAC.searchHighlight, "Test Group 2");
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");

      agHelper.VisitNAssert(`/settings/groups/${groupId}`, "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.AssertElementLength(RBAC.groupMembers, 1);
      agHelper.GetNAssertContains(RBAC.groupMembers, email);
      agHelper.AssertElementEnabledDisabled(RBAC.addButton, 0, true);
    });
  });

  it("11. Update a group's data via SCIM (Replicating Okta)", function () {
    const groupObj: any = {
      displayName: `${groupName} Renamed`,
      description: "Test Group Description Renamed",
      members: [{ value: userId, type: "User" }],
    };

    provisioning.UpdateGroup(apiKey, groupObj, groupId).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);

      expect(body).to.have.property(GroupAttributes.id);
      expect(body).to.have.property(GroupAttributes.displayName);
      expect(body).to.have.property(GroupAttributes.description);
      expect(body.displayName).equal(`${groupName} Renamed`);
      expect(body.description).equal("Test Group Description Renamed");

      groupId = body.id;
      provisioning.GetGroups(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        expect(body.totalResults).equal(2);
        expect(body.itemsPerPage).equal(2);
        expect(body.Resources.length).equal(2);
        expect(
          body.Resources.findIndex(
            (x: any) => x.displayName === `${groupName} Renamed`,
          ),
        ).not.equal(-1);
      });

      agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, `${groupName} Renamed`);
      agHelper.GetNAssertContains(RBAC.searchHighlight, `${groupName} Renamed`);
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");

      agHelper.VisitNAssert(`/settings/groups/${groupId}`, "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.AssertElementLength(RBAC.groupMembers, 1);
      agHelper.GetNAssertContains(RBAC.groupMembers, email);
      agHelper.AssertElementEnabledDisabled(RBAC.addButton, 0, true);
    });
  });

  it("12. Update a group's members using PUT update via SCIM", function () {
    const groupObj: any = {
      displayName: `${groupName} Renamed twice`,
      description: "Test Group Description Renamed twice",
      members: [
        { operation: "delete", value: userId, type: "User" },
        { operation: "add", value: userId2, type: "User" },
      ],
    };

    provisioning.UpdateGroup(apiKey, groupObj, groupId).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);

      expect(body).to.have.property(GroupAttributes.id);
      expect(body).to.have.property(GroupAttributes.displayName);
      expect(body).to.have.property(GroupAttributes.description);
      expect(body.displayName).equal(`${groupName} Renamed twice`);
      expect(body.description).equal("Test Group Description Renamed twice");

      groupId = body.id;
      provisioning.GetGroups(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        expect(body.totalResults).equal(2);
        expect(body.itemsPerPage).equal(2);
        expect(body.Resources.length).equal(2);
        expect(
          body.Resources.findIndex(
            (x: any) => x.displayName === `${groupName} Renamed twice`,
          ),
        ).not.equal(-1);
      });

      agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, `${groupName} Renamed twice`);
      agHelper.GetNAssertContains(
        RBAC.searchHighlight,
        `${groupName} Renamed twice`,
      );
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");

      agHelper.VisitNAssert(`/settings/groups/${groupId}`, "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.AssertElementLength(RBAC.groupMembers, 1);
      agHelper.GetNAssertContains(RBAC.groupMembers, email2);
      agHelper.GetNAssertContains(RBAC.groupMembers, email, "not.exist");
      agHelper.AssertElementEnabledDisabled(RBAC.addButton, 0, true);
    });
  });

  it("13. Update a group's members using PATCH update by adding a user via SCIM", function () {
    const groupObj: any = {
      members: [{ operation: "add", value: userId, type: "User" }],
    };

    provisioning.PatchGroup(apiKey, groupObj, groupId).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);

      expect(body).to.have.property(GroupAttributes.id);
      expect(body).to.have.property(GroupAttributes.displayName);
      expect(body).to.have.property(GroupAttributes.description);
      expect(body.displayName).equal(`${groupName} Renamed twice`);
      expect(body.description).equal("Test Group Description Renamed twice");

      groupId = body.id;
      provisioning.GetGroups(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        expect(body.totalResults).equal(2);
        expect(body.itemsPerPage).equal(2);
        expect(body.Resources.length).equal(2);
        expect(
          body.Resources.findIndex(
            (x: any) => x.displayName === `${groupName} Renamed twice`,
          ),
        ).not.equal(-1);
      });

      agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, `${groupName} Renamed twice`);
      agHelper.GetNAssertContains(
        RBAC.searchHighlight,
        `${groupName} Renamed twice`,
      );
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");

      agHelper.VisitNAssert(`/settings/groups/${groupId}`, "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.AssertElementLength(RBAC.groupMembers, 2);
      agHelper.GetNAssertContains(RBAC.groupMembers, email2);
      agHelper.GetNAssertContains(RBAC.groupMembers, email);
      agHelper.AssertElementEnabledDisabled(RBAC.addButton, 0, true);
    });
  });

  it("14. Update a group's members using PATCH update by removing the user via SCIM", function () {
    const groupObj: any = {
      members: [{ operation: "delete", value: userId2, type: "User" }],
    };

    provisioning.PatchGroup(apiKey, groupObj, groupId).then((response) => {
      const body = response.body;
      expect(response.status).equal(200);

      expect(body).to.have.property(GroupAttributes.id);
      expect(body).to.have.property(GroupAttributes.displayName);
      expect(body).to.have.property(GroupAttributes.description);
      expect(body.displayName).equal(`${groupName} Renamed twice`);
      expect(body.description).equal("Test Group Description Renamed twice");

      groupId = body.id;
      provisioning.GetGroups(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        expect(body.totalResults).equal(2);
        expect(body.itemsPerPage).equal(2);
        expect(body.Resources.length).equal(2);
        expect(
          body.Resources.findIndex(
            (x: any) => x.displayName === `${groupName} Renamed twice`,
          ),
        ).not.equal(-1);
      });

      agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, `${groupName} Renamed twice`);
      agHelper.GetNAssertContains(
        RBAC.searchHighlight,
        `${groupName} Renamed twice`,
      );
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");

      agHelper.VisitNAssert(`/settings/groups/${groupId}`, "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.AssertElementLength(RBAC.groupMembers, 1);
      agHelper.GetNAssertContains(RBAC.groupMembers, email);
      agHelper.GetNAssertContains(RBAC.groupMembers, email2, "not.exist");
      agHelper.AssertElementEnabledDisabled(RBAC.addButton, 0, true);
    });
  });

  it("15. Delete a user via SCIM", function () {
    provisioning.DeleteUser(apiKey, userId).then((response) => {
      expect(response.status).equal(204);

      provisioning.GetUsers(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        cy.wrap(body.totalResults).should("be.gte", 1);
        cy.wrap(body.itemsPerPage).should("be.gte", 1);
        cy.wrap(body.Resources.length).should("be.gte", 1);
        expect(body.Resources.findIndex((x: any) => x.email === email)).equal(
          -1,
        );
      });

      agHelper.VisitNAssert("/settings/users", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, email);
      agHelper.AssertElementAbsence(RBAC.searchHighlight);
    });
  });

  it("16. Delete a group via SCIM", function () {
    provisioning.DeleteGroup(apiKey, groupId).then((response) => {
      expect(response.status).equal(204);

      provisioning.GetGroups(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        expect(body.totalResults).equal(1);
        expect(body.itemsPerPage).equal(1);
        expect(body.Resources.length).equal(1);
        expect(
          body.Resources.findIndex(
            (x: any) => x.displayName === `${groupName} Renamed`,
          ),
        ).equal(-1);
      });

      agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, `${groupName} Renamed`);
      agHelper.AssertElementAbsence(RBAC.searchHighlight);
    });
  });

  it("17. Disable SCIM provisioning", function () {
    adminSettings.NavigateToAdminSettings();
    // click provisioning tab
    agHelper.GetNClick(provisioning.locators.provisioningCategory);
    agHelper.AssertURL("/settings/provisioning");
    agHelper.WaitUntilEleAppear(provisioning.locators.configureButton);
    agHelper.GetNClick(provisioning.locators.configureButton);
    agHelper.AssertURL("/settings/provisioning/scim");
    agHelper.WaitUntilEleAppear(provisioning.locators.connectionStatus);

    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.connectionStatus,
      "Connection Active",
    );
    cy.get(provisioning.locators.lastSyncInfo)
      .should("exist")
      .should("not.contain", "Last sync never happened");
    agHelper.GetNAssertContains(
      provisioning.locators.syncedResourcesInfo,
      "1 user and 1 group are linked to your IdP",
    );
    agHelper.GetNClick(provisioning.locators.disableScimButton);
    agHelper.WaitUntilEleAppear(provisioning.locators.radioButtons);
    agHelper.AssertElementEnabledDisabled(
      provisioning.locators.disableScimConfigBtn,
      0,
      true,
    );
    agHelper.GetNClick(provisioning.locators.radioButtons, 0);
    agHelper.GetNClick(provisioning.locators.disableScimConfigBtn);
    agHelper.WaitUntilEleAppear(provisioning.locators.confirmCheckbox);
    agHelper.AssertElementEnabledDisabled(
      provisioning.locators.disableScimConfigBtn,
      0,
      true,
    );
    agHelper.GetNClick(provisioning.locators.confirmCheckbox);
    agHelper.GetNClick(provisioning.locators.disableScimConfigBtn);

    agHelper.VisitNAssert("/settings/users", "getEnvVariables");
    cy.wait(2000);
    agHelper.TypeText(RBAC.searchBar, email);
    agHelper.AssertElementAbsence(RBAC.searchHighlight);

    agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
    cy.wait(2000);
    agHelper.TypeText(RBAC.searchBar, groupName);
    agHelper.AssertElementAbsence(RBAC.searchHighlight);
  });

  // Re-configuring SCIM to no resources synced flow
  it("18. Go to admin settings and configure SCIM", function () {
    agHelper.VisitNAssert("/settings/general", "getEnvVariables");
    // click provisioning tab
    agHelper.GetNClick(provisioning.locators.provisioningCategory);
    agHelper.AssertURL("/settings/provisioning");
    agHelper.WaitUntilEleAppear(provisioning.locators.pageHeader);
    agHelper.GetNAssertElementText(
      provisioning.locators.pageHeader,
      "User provisioning & Group sync",
    );
    agHelper.AssertElementLength(provisioning.locators.methodCard, 1);
    agHelper.GetNAssertElementText(
      provisioning.locators.cardTitle,
      "System for Cross-domain Identity Management",
    );
    agHelper.GetNAssertElementText(
      provisioning.locators.configureButton,
      "Configure",
    );
    agHelper.GetNClick(provisioning.locators.configureButton);
    agHelper.AssertURL("/settings/provisioning/scim");

    cy.get(provisioning.locators.inputScimApiEndpoint)
      .invoke("val")
      .then((value: any) => {
        scimEndpointUrl = value;
      });

    // agHelper.GetNClick(provisioning.locators.inputScimApiEndpoint);
    // agHelper.WaitUntilToastDisappear("SCIM API endpoint copied to clipboard");

    // cy.window()
    //   .its("navigator.clipboard")
    //   .invoke("readText")
    //   .then((text) => {
    //     cy.wrap(text).as("scimEndpointUrl");
    //   });

    // cy.get("@scimEndpointUrl").then((url) => {
    //   scimEndpointUrl = url.toString();
    // agHelper.ValidateFieldInputValue(
    //   provisioning.locators.inputScimApiEndpoint,
    //   scimEndpointUrl,
    // );
    // });

    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.generateApiKeyButton,
      "Generate API key",
    );
    agHelper.GetNClick(provisioning.locators.generateApiKeyButton);
    cy.get(provisioning.locators.inputScimApiKey)
      .invoke("val")
      .then((value: any) => {
        apiKey = value;
      });
    // agHelper.GetNClick(provisioning.locators.inputScimApiKey);
    // agHelper.WaitUntilToastDisappear(
    //   "API key to setup SCIM copied to clipboard",
    // );
    // cy.window()
    //   .its("navigator.clipboard")
    //   .invoke("readText")
    //   .then((text) => {
    //     cy.wrap(text).as("apiKey");
    //   });

    // cy.get("@apiKey").then((key) => {
    //   apiKey = key;
    // });
  });

  it("19. Disable SCIM provisioning", function () {
    adminSettings.NavigateToAdminSettings();
    // click provisioning tab
    agHelper.GetNClick(provisioning.locators.provisioningCategory);
    agHelper.AssertURL("/settings/provisioning");
    agHelper.WaitUntilEleAppear(provisioning.locators.configureButton);
    agHelper.GetNClick(provisioning.locators.configureButton);
    agHelper.AssertURL("/settings/provisioning/scim");
    agHelper.WaitUntilEleAppear(provisioning.locators.connectionStatus);

    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.connectionStatus,
      "Connection Inactive",
    );
    cy.get(provisioning.locators.lastSyncInfo)
      .should("exist")
      .should("contain", "Last sync never happened");
    agHelper.GetNAssertContains(
      provisioning.locators.syncedResourcesInfo,
      "0 users and 0 groups are linked to your IdP",
    );
    agHelper.GetNClick(provisioning.locators.disableScimButton);
    agHelper.WaitUntilEleAppear(provisioning.locators.confirmCheckbox);
    agHelper.AssertElementEnabledDisabled(
      provisioning.locators.disableScimConfigBtn,
      0,
      true,
    );
    agHelper.GetNClick(provisioning.locators.confirmCheckbox);
    agHelper.GetNClick(provisioning.locators.disableScimConfigBtn);
  });

  // Re-configuring SCIM to test Keep resources flow
  it("20. Go to admin settings and configure SCIM", function () {
    agHelper.VisitNAssert("/settings/general", "getEnvVariables");
    // click provisioning tab
    agHelper.GetNClick(provisioning.locators.provisioningCategory);
    agHelper.AssertURL("/settings/provisioning");
    agHelper.WaitUntilEleAppear(provisioning.locators.pageHeader);
    agHelper.GetNAssertElementText(
      provisioning.locators.pageHeader,
      "User provisioning & Group sync",
    );
    agHelper.AssertElementLength(provisioning.locators.methodCard, 1);
    agHelper.GetNAssertElementText(
      provisioning.locators.cardTitle,
      "System for Cross-domain Identity Management",
    );
    agHelper.GetNAssertElementText(
      provisioning.locators.configureButton,
      "Configure",
    );
    agHelper.GetNClick(provisioning.locators.configureButton);
    agHelper.AssertURL("/settings/provisioning/scim");

    cy.get(provisioning.locators.inputScimApiEndpoint)
      .invoke("val")
      .then((value: any) => {
        scimEndpointUrl = value;
      });

    // agHelper.GetNClick(provisioning.locators.inputScimApiEndpoint);
    // agHelper.WaitUntilToastDisappear("SCIM API endpoint copied to clipboard");

    // cy.window()
    //   .its("navigator.clipboard")
    //   .invoke("readText")
    //   .then((text) => {
    //     cy.wrap(text).as("scimEndpointUrl");
    //   });

    // cy.get("@scimEndpointUrl").then((url) => {
    //   scimEndpointUrl = url.toString();
    // agHelper.ValidateFieldInputValue(
    //   provisioning.locators.inputScimApiEndpoint,
    //   scimEndpointUrl,
    // );
    // });

    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.generateApiKeyButton,
      "Generate API key",
    );
    agHelper.GetNClick(provisioning.locators.generateApiKeyButton);
    cy.get(provisioning.locators.inputScimApiKey)
      .invoke("val")
      .then((value: any) => {
        apiKey = value;
      });
    // agHelper.GetNClick(provisioning.locators.inputScimApiKey);
    // agHelper.WaitUntilToastDisappear(
    //   "API key to setup SCIM copied to clipboard",
    // );
    // cy.window()
    //   .its("navigator.clipboard")
    //   .invoke("readText")
    //   .then((text) => {
    //     cy.wrap(text).as("apiKey");
    //   });

    // cy.get("@apiKey").then((key) => {
    //   apiKey = key;
    // });
  });

  it("21. Create a user via SCIM", function () {
    const userObj: any = {
      userName: email,
      displayName: "Test User",
    };

    provisioning.CreateUser(apiKey, userObj).then((response) => {
      const body = response.body;
      expect(response.status).equal(201);

      expect(body).to.have.property(UserAttributes.id);
      expect(body).to.have.property(UserAttributes.userName);
      expect(body).to.have.property(UserAttributes.displayName);
      expect(body).to.have.property(UserAttributes.active);
      expect(body).to.have.property(UserAttributes.email);

      expect(body.userName).equal(email);
      expect(body.active).equal(true);
      expect(body.email).equal(email);
      expect(body.displayName).equal("Test User");

      userId = body.id; // get user id to add this user in group

      provisioning.GetUsers(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        cy.wrap(body.totalResults).should("be.gte", 1);
        cy.wrap(body.itemsPerPage).should("be.gte", 1);
        cy.wrap(body.Resources.length).should("be.gte", 1);
        expect(
          body.Resources.findIndex((x: any) => x.email === email),
        ).not.equal(-1);
      });

      cy.visit("/settings/users");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, email);
      agHelper.GetElementsNAssertTextPresence(RBAC.searchHighlight, email);
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");
      agHelper.GetNClick(RBAC.userContextMenu, 0, true);
      cy.get(RBAC.menuItems).should("have.length", 1);
      agHelper.AssertElementAbsence(RBAC.delete);

      cy.visit(`/settings/users/${userId}`);
      agHelper.WaitUntilEleAppear(RBAC.userName);
      agHelper.GetElementsNAssertTextPresence(RBAC.userName, "Test User");
      agHelper.AssertElementAbsence(RBAC.userContextMenu);
    });
  });

  it("22. Create a group via SCIM", function () {
    const groupObj: any = {
      displayName: groupName,
      description: "Test Group Description",
      members: [{ value: userId, type: "User" }],
    };

    provisioning.CreateGroup(apiKey, groupObj).then((response) => {
      const body = response.body;
      expect(response.status).equal(201);

      expect(body).to.have.property(GroupAttributes.id);
      expect(body).to.have.property(GroupAttributes.displayName);
      expect(body).to.have.property(GroupAttributes.description);
      expect(body.displayName).equal(groupName);
      expect(body.description).equal("Test Group Description");

      groupId = body.id;
      provisioning.GetGroups(apiKey).then((response) => {
        const body = response.body;
        expect(response.status).equal(200);

        expect(body.totalResults).equal(1);
        expect(body.itemsPerPage).equal(1);
        expect(body.Resources.length).equal(1);
        expect(
          body.Resources.findIndex((x: any) => x.displayName === groupName),
        ).not.equal(-1);
      });

      cy.visit("/settings/groups");
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      agHelper.TypeText(RBAC.searchBar, groupName);
      agHelper.GetElementsNAssertTextPresence(RBAC.searchHighlight, groupName);
      cy.get(RBAC.searchHighlight)
        .siblings(RBAC.provisionedIcon)
        .should("exist");
      agHelper.AssertElementAbsence(RBAC.userContextMenu);

      cy.visit(`/settings/groups/${groupId}`);
      agHelper.WaitUntilEleAppear(RBAC.searchBar);
      cy.get(RBAC.groupMembers).should("have.length", 1);
      agHelper.AssertContains(email, "exist", RBAC.groupMembers);
      agHelper.AssertElementEnabledDisabled(RBAC.addButton, 0, true);
      agHelper.AssertElementAbsence(RBAC.menuIconUserGroupPage);
    });
  });

  it("23. Disable SCIM provisioning", function () {
    adminSettings.NavigateToAdminSettings();
    // click provisioning tab
    agHelper.GetNClick(provisioning.locators.provisioningCategory);
    agHelper.AssertURL("/settings/provisioning");
    agHelper.WaitUntilEleAppear(provisioning.locators.configureButton);
    agHelper.GetNClick(provisioning.locators.configureButton);
    agHelper.AssertURL("/settings/provisioning/scim");
    agHelper.WaitUntilEleAppear(provisioning.locators.connectionStatus);

    agHelper.GetElementsNAssertTextPresence(
      provisioning.locators.connectionStatus,
      "Connection Active",
    );
    cy.get(provisioning.locators.lastSyncInfo)
      .should("exist")
      .should("not.contain", "Last sync never happened");
    agHelper.GetNAssertContains(
      provisioning.locators.syncedResourcesInfo,
      "1 user and 1 group are linked to your IdP",
    );
    agHelper.GetNClick(provisioning.locators.disableScimButton);
    agHelper.WaitUntilEleAppear(provisioning.locators.radioButtons);
    agHelper.AssertElementEnabledDisabled(
      provisioning.locators.disableScimConfigBtn,
      0,
      true,
    );
    agHelper.GetNClick(provisioning.locators.radioButtons, 1);
    agHelper.GetNClick(provisioning.locators.disableScimConfigBtn);
    agHelper.WaitUntilEleAppear(provisioning.locators.confirmCheckbox);
    agHelper.AssertElementEnabledDisabled(
      provisioning.locators.disableScimConfigBtn,
      0,
      true,
    );
    agHelper.GetNClick(provisioning.locators.confirmCheckbox);
    agHelper.GetNClick(provisioning.locators.disableScimConfigBtn);

    agHelper.VisitNAssert("/settings/users", "getEnvVariables");
    agHelper.WaitUntilEleAppear(RBAC.searchBar);
    agHelper.TypeText(RBAC.searchBar, email);
    agHelper.GetNAssertContains(RBAC.searchHighlight, email);
    cy.get(RBAC.searchHighlight)
      .siblings(RBAC.provisionedIcon)
      .should("not.exist");
    agHelper.GetNClick(RBAC.userContextMenu, 0, true);
    agHelper.AssertElementLength(RBAC.menuItems, 2);
    agHelper.AssertElementExist(RBAC.delete);
    agHelper.AssertElementExist(RBAC.edit);

    agHelper.VisitNAssert(`/settings/users/${userId}`, "getEnvVariables");
    agHelper.WaitUntilEleAppear(RBAC.userName);
    agHelper.GetNAssertContains(RBAC.userName, "Test User");
    agHelper.GetNClick(RBAC.userContextMenu);
    agHelper.AssertElementLength(RBAC.menuItems, 1);
    agHelper.AssertElementExist(RBAC.delete);

    agHelper.VisitNAssert("/settings/groups", "getEnvVariables");
    agHelper.WaitUntilEleAppear(RBAC.searchBar);
    agHelper.TypeText(RBAC.searchBar, groupName);
    agHelper.GetNAssertContains(RBAC.searchHighlight, groupName);
    cy.get(RBAC.searchHighlight)
      .siblings(RBAC.provisionedIcon)
      .should("not.exist");
    agHelper.GetNClick(RBAC.userContextMenu, 0, true);
    agHelper.AssertElementLength(RBAC.menuItems, 2);
    agHelper.AssertElementExist(RBAC.delete);
    agHelper.AssertElementExist(RBAC.edit);

    agHelper.VisitNAssert(`/settings/groups/${groupId}`, "getEnvVariables");
    agHelper.WaitUntilEleAppear(RBAC.searchBar);
    agHelper.AssertElementLength(RBAC.groupMembers, 1);
    agHelper.GetNAssertContains(RBAC.groupMembers, email);
    agHelper.AssertElementEnabledDisabled(RBAC.addButton, 0, false);
    agHelper.GetNClick(RBAC.menuIconUserGroupPage);
    agHelper.AssertElementLength(RBAC.menuItems, 3);
    agHelper.AssertElementExist(RBAC.delete);
    agHelper.AssertElementExist(RBAC.renameMenuItem);
    agHelper.AssertElementExist(RBAC.editDescMenuItem);
  });

  // Tests deletion of SCIM user and group after resources are retained while disabling SCIM provisioning
  after(() => {
    agHelper.VisitNAssert(`/settings/users/${userId}`, "getEnvVariables");
    agHelper.WaitUntilEleAppear(RBAC.searchBar);
    agHelper.GetNClick(RBAC.userContextMenu);
    agHelper.GetNClick(RBAC.delete);
    agHelper.GetNClick(RBAC.deleteConfirmation);
    agHelper.VisitNAssert(`/settings/groups/${groupId}`, "getEnvVariables");
    agHelper.WaitUntilEleAppear(RBAC.searchBar);
    agHelper.GetNClick(RBAC.menuIconUserGroupPage);
    agHelper.GetNClick(RBAC.delete);
    agHelper.GetNClick(RBAC.deleteConfirmation);
  });
});

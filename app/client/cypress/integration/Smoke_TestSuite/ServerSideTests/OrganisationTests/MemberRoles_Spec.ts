import { ObjectsRegistry } from "../../../../support/Objects/Registry"

let orgid: any, appid: any;
let agHelper = ObjectsRegistry.AggregateHelper,
    homePage = ObjectsRegistry.HomePage;

describe("Create new org and invite user & validate all roles", () => {
    it("1. Create new Organization, Share with a user from UI & verify", () => {
        homePage.NavigateToHome()
        agHelper.GenerateUUID()
        cy.get("@guid").then(uid => {
            orgid = uid;
            appid = uid;
            //localStorage.setItem("OrgName", orgid);
            homePage.CreateNewOrg(orgid)
            homePage.CheckOrgShareUsersCount(orgid, 1);
            homePage.InviteUserToOrg(orgid, Cypress.env("TESTUSERNAME1"), 'App Viewer');
            cy.xpath(homePage._visibleTextSpan('MANAGE USERS')).click({ force: true })
            homePage.NavigateToHome()
            homePage.CheckOrgShareUsersCount(orgid, 2);
            homePage.CreateAppInOrg(orgid, appid);
        })
        homePage.LogOutviaAPI()
    });

    it("2. Login as Invited user and validate Viewer role", function () {
        homePage.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"), 'App Viewer')
        homePage.FilterApplication(appid, orgid)
        cy.get(homePage._applicationCard).first().trigger("mouseover");
        cy.get(homePage._appHoverIcon('edit')).should("not.exist");
        homePage.LaunchAppFromAppHover()
        homePage.LogOutviaAPI()
    });

    it("3. Login as Org owner and Update the Invited user role to Developer", function () {
        homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"))
        homePage.FilterApplication(appid, orgid)
        homePage.UpdateUserRoleInOrg(orgid, Cypress.env("TESTUSERNAME1"), 'App Viewer', 'Developer');
        homePage.LogOutviaAPI()
    });

    it("4. Login as Invited user and validate Developer role", function () {
        homePage.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"), 'Developer')
        homePage.FilterApplication(appid, orgid)
        cy.get(homePage._applicationCard).first().trigger("mouseover");
        cy.get(homePage._appHoverIcon('edit')).first()
            .click({ force: true });
        cy.xpath(homePage._editPageLanding).should("exist");
        homePage.LogOutviaAPI()
    });

    it("5. Login as Org owner and Update the Invited user role to Administrator", function () {
        homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"))
        homePage.FilterApplication(appid, orgid)
        homePage.UpdateUserRoleInOrg(orgid, Cypress.env("TESTUSERNAME1"), 'Developer', 'Administrator');
        homePage.LogOutviaAPI()
    });

    it("6. Login as Invited user and validate Administrator role", function () {
        homePage.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"), 'Administrator')
        homePage.FilterApplication(appid, orgid)
        cy.get(homePage._applicationCard).first().trigger("mouseover");
        homePage.InviteUserToOrg(orgid, Cypress.env("TESTUSERNAME2"), 'App Viewer');
        homePage.LogOutviaAPI()
    });

    it("7. Login as Org owner and verify all 3 users are present", function () {
        homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"))
        homePage.FilterApplication(appid, orgid)
        homePage.OpenMembersPageForOrg(orgid)
        cy.get(homePage._usersEmailList).then(function ($list) {
            expect($list).to.have.length(3);
            expect($list.eq(0)).to.contain(Cypress.env("USERNAME"));
            expect($list.eq(1)).to.contain(Cypress.env("TESTUSERNAME1"));
            expect($list.eq(2)).to.contain(Cypress.env("TESTUSERNAME2"));
        });
        homePage.NavigateToHome()
    });

});
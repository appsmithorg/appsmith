import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";
import { HomePage } from "../../../../support/Pages/HomePage";

const agHelper = new AggregateHelper();
const homePage = new HomePage();

describe("Create new org and invite user & validate all roles", () => {
    let orgid: any;
    let appid: any;

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
            cy.get(homePage._visibleTextSpan('MANAGE USERS')).click({ force: true })
            homePage.NavigateToHome()
            homePage.CheckOrgShareUsersCount(orgid, 2);
            homePage.CreateAppInOrg(orgid, appid);
        })
        homePage.LogOutviaAPI()
    });

    it("2. Login as Invited user and then validate Viewer role", function () {
        homePage.LogintoApp(Cypress.env("TESTUSERNAME1"), Cypress.env("TESTPASSWORD1"))
        homePage.FilterApplication(appid, orgid)
        cy.get(homePage._applicationCard).first().trigger("mouseover");
        cy.get(homePage._appHoverIcon('edit')).should("not.exist");
        homePage.LaunchAppFromAppHover()
        homePage.LogOutviaAPI()
    });

    // it("3. Login as Org owner and Update the Invited user role to Developer", function() {
    //     homePage.LogintoApp(Cypress.env("USERNAME"), Cypress.env("PASSWORD"))
    //     homePage.FilterApplication(appid, orgid)
    //     homePage.UpdateUserRoleInOrg(orgid, Cypress.env("TESTUSERNAME1"), 'App Viewer', 'Developer');
    //     homePage.LogOutviaAPI()
    //   });

});
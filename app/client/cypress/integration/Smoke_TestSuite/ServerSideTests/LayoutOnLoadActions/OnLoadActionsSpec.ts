import { ApiPage } from "../../../../support/Pages/ApiPage";
import { AggregateHelper } from "../../../../support/Pages/AggregateHelper";

const apiPage = new ApiPage();
const agHelper = new AggregateHelper();

describe("Layout OnLoad Actions tests", function () {
    let dsl: any;
    before(() => {
        cy.fixture('onPageLoadActionsDsl').then((val: any) => {
            dsl = val;
        });
    });

    it("1. Bug 8595: OnPageLoad execution - when No api to run on Pageload", function () {
        agHelper.AddDsl(dsl)
        agHelper.SelectEntityByName('Page1')
        cy.url().then((url) => {
            let currentURL = url;
            const myRegexp = /pages(.*)/;
            const match = myRegexp.exec(currentURL);
            let pageid = match![1].split("/")[1];
            cy.log(pageid + "page id");
            cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
                const respBody = JSON.stringify(response.body);
                let _emptyResp = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions;
                expect(JSON.parse(JSON.stringify(_emptyResp))).to.deep.eq([])
            });
        });
    });

    it("2. Bug 8595: OnPageLoad execution - when Query Parmas added via Params tab", function () {
        agHelper.AddDsl(dsl)
        apiPage.CreateAndFillApi("https://source.unsplash.com/collection/1599413", "RandomFlora")
        apiPage.RunAPI()

        apiPage.CreateAndFillApi("https://randomuser.me/api/", "RandomUser")
        apiPage.RunAPI()

        apiPage.CreateAndFillApi("https://favqs.com/api/qotd", "InspiringQuotes")
        apiPage.EnterHeader('dependency', '{{RandomUser.data}}')
        apiPage.RunAPI()

        apiPage.CreateAndFillApi("https://www.boredapi.com/api/activity", "Suggestions")
        apiPage.EnterHeader('dependency', '{{InspiringQuotes.data}}')
        apiPage.RunAPI()

        apiPage.CreateAndFillApi("https://api.genderize.io", "Genderize")
        apiPage.EnterParams('name', '{{RandomUser.data.results[0].name.first}}')
        apiPage.RunAPI()

        agHelper.SelectEntityByName('Page1')

        cy.url().then((url) => {
            let currentURL = url;
            const myRegexp = /pages(.*)/;
            const match = myRegexp.exec(currentURL);
            let pageid = match![1].split("/")[1];
            cy.log(pageid + "page id");
            cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
                const respBody = JSON.stringify(response.body);

                let _randomFlora = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions[0];
                let _randomUser = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions[1];
                let _genderize = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions[2];
                let _suggestions = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions[3];
                // cy.log("_randomFlora is: " + JSON.stringify(_randomFlora))
                // cy.log("_randomUser is: " + JSON.stringify(_randomUser))
                // cy.log("_genderize is: " + JSON.stringify(_genderize))
                // cy.log("_suggestions is: " + JSON.stringify(_suggestions))

                expect(JSON.parse(JSON.stringify(_randomFlora))[0]['name']).to.eq('RandomFlora')
                expect(JSON.parse(JSON.stringify(_randomUser))[0]['name']).to.eq('RandomUser')
                expect(JSON.parse(JSON.stringify(_genderize))[0]['name']).to.be.oneOf(['Genderize', 'InspiringQuotes'])
                expect(JSON.parse(JSON.stringify(_genderize))[1]['name']).to.be.oneOf(['Genderize', 'InspiringQuotes'])
                expect(JSON.parse(JSON.stringify(_suggestions))[0]['name']).to.eq('Suggestions')

            });
        });
    });

    it("3. Bug 10049, 10055: Dependency not executed in expected order in layoutOnLoadActions when dependency added via URL", function () {
        agHelper.NavigateToHome()
        agHelper.CreateNewApplication()
        agHelper.AddDsl(dsl)

        apiPage.CreateAndFillApi("https://source.unsplash.com/collection/1599413", "RandomFlora")
        apiPage.RunAPI()

        apiPage.CreateAndFillApi("https://randomuser.me/api/", "RandomUser")
        apiPage.RunAPI()

        apiPage.CreateAndFillApi("https://favqs.com/api/qotd", "InspiringQuotes")
        apiPage.EnterHeader('dependency', '{{RandomUser.data}}')
        apiPage.RunAPI()

        apiPage.CreateAndFillApi("https://www.boredapi.com/api/activity", "Suggestions")
        apiPage.EnterHeader('dependency', '{{InspiringQuotes.data}}')
        apiPage.RunAPI()

        apiPage.CreateAndFillApi("https://api.genderize.io?name={{RandomUser.data.results[0].name.first}}", "Genderize")
        apiPage.ValidateQueryParams({ key: "name", value: "{{RandomUser.data.results[0].name.first}}" }); // verifies Bug 10055
        apiPage.RunAPI()

        agHelper.SelectEntityByName('Page1')

        cy.url().then((url) => {
            let currentURL = url;
            const myRegexp = /pages(.*)/;
            const match = myRegexp.exec(currentURL);
            let pageid = match![1].split("/")[1];
            cy.log(pageid + "page id");
            cy.request("GET", "api/v1/pages/" + pageid).then((response) => {
                const respBody = JSON.stringify(response.body);

                let _randomFlora = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions[0];
                let _randomUser = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions[1];
                let _genderize = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions[2];
                let _suggestions = JSON.parse(respBody).data.layouts[0].layoutOnLoadActions[3];
                // cy.log("_randomFlora is: " + JSON.stringify(_randomFlora))
                // cy.log("_randomUser is: " + JSON.stringify(_randomUser))
                // cy.log("_genderize is: " + JSON.stringify(_genderize))
                // cy.log("_suggestions is: " + JSON.stringify(_suggestions))

                expect(JSON.parse(JSON.stringify(_randomFlora))[0]['name']).to.eq('RandomFlora')
                expect(JSON.parse(JSON.stringify(_randomUser))[0]['name']).to.eq('RandomUser')
                expect(JSON.parse(JSON.stringify(_genderize))[0]['name']).to.be.oneOf(['Genderize', 'InspiringQuotes'])
                expect(JSON.parse(JSON.stringify(_genderize))[1]['name']).to.be.oneOf(['Genderize', 'InspiringQuotes'])
                expect(JSON.parse(JSON.stringify(_suggestions))[0]['name']).to.eq('Suggestions')

            });
        });
    });
});
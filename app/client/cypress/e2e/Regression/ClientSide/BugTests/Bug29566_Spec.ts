import largeJSONData from "../../../../fixtures/largeJSONData.json";
import {
  agHelper,
  deployMode,
  jsEditor,
} from "../../../../support/Objects/ObjectsCore";

describe("JS Function execution data mutation", function () {
  before(() => {
    agHelper.AddDsl("listwidgetData");
  });

  it("1. List widget gets populated on page load", function () {
    const APIJS = `export default {

        async runFetch(dataRequest) {
            return fetch(dataRequest.url, dataRequest.config)
                .then(response => {
                return response.json();
            }).catch(error => {
                showAlert('API error')
            });
        },
    
        async getConditionGroups() {
            const dataRequest = {
                url: "https://api.jsonbin.io/v3/b/656ed15d54105e766fd9ca52",
                config: {
                    method: 'GET',
                },
                name: 'getConditionGroups'
            };
            return await this.runFetch(dataRequest);
        },
    
        async getConditionListData() {
            const dataRequest = {
                url: "https://api.jsonbin.io/v3/b/656ed18454105e766fd9ca6c",
                config: {
                    method: 'GET',
                },
                name: 'getConditionGroups'
            };
            return await this.runFetch(dataRequest);
        },
    
    }`;
    const PAGE1JS = `export default {

        conditionGroups: [],
        allConditionGroups: [],
        maxItemsOnPageMachineConditionGroups: 6,
        startIndex_MCG: 0,
        conditionGroupsToShow: [],
        splittingDataOf_MCG_ToShowIntoThreeColumns: [[],[],[]],
        selectedMachineConditionGroups: [],
    
        async getAllConditionGroupsData() {
          const conditionGroups = await ApiJS.getConditionGroups()|| [];
            this.conditionGroups =  conditionGroups.record
            console.log("conditionGroups ====> ",conditionGroups);
             this.conditionGroups.filter((item) => {
                 this.allConditionGroups.push(item.conditionGroup);
             });
    this.allConditionGroupsSplitedIntoThreeColumns()
        },
    
        allConditionGroupsSplitedIntoThreeColumns() {
            let tmpCounter_MCG = 0;
            for(let i = 0; i < this.maxItemsOnPageMachineConditionGroups; i++) {
                this.conditionGroupsToShow.push([this.allConditionGroups[this.startIndex_MCG]]);
                this.splittingDataOf_MCG_ToShowIntoThreeColumns[tmpCounter_MCG].push(this.allConditionGroups[this.startIndex_MCG]);
                this.startIndex_MCG++;
                tmpCounter_MCG === 2 ? tmpCounter_MCG = 0 : tmpCounter_MCG++;
            }
        },
    
        setBgSelected_MCG(id) {
            return this.selectedMachineConditionGroups.includes(id) ? '#0d9be2' : '#383838';
        },
        test(){
            this.splittingDataOf_MCG_ToShowIntoThreeColumns = [[],[],[]]
            return this.splittingDataOf_MCG_ToShowIntoThreeColumns
        }
    
    }`;
    jsEditor.CreateJSObject(APIJS, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });
    jsEditor.RenameJSObjFromPane("ApiJS");
    cy.wait(5000);

    jsEditor.CreateJSObject(PAGE1JS, {
      paste: true,
      completeReplace: true,
      toRun: false,
      shouldCreateNewJSObj: true,
      prettify: false,
    });
    jsEditor.RenameJSObjFromPane("Page1JS");
    cy.wait(5000);
    jsEditor.EnableDisableAsyncFuncSettings(
      "getAllConditionGroupsData",
      true,
      false,
    );
    deployMode.DeployApp();
    agHelper.AssertContains("MK Condition");
  });
});

import {
  agHelper,
  draggableWidgets,
  entityExplorer,
  propPane,
} from "../../../../support/Objects/ObjectsCore";

describe("Delete No Action card without any error", () => {
  it("1. Bug 23345", () => {
    let t0 = performance.now()
    entityExplorer.DragDropWidgetNVerify(draggableWidgets.BUTTON, 200, 200);
    cy.wrap(performance.now()).then(t1 => {   // this is now a queued command which will 
      // only run after the previous command
      cy.log(`Step1 - DragNdropWidgetNVerify ---- ${t1 - t0} milliseconds.`);
      t0 = t1;
    })

    propPane.AddAction("onClick");
    cy.wrap(performance.now()).then(t1 => {   // this is now a queued command which will 
      // only run after the previous command
      cy.log(`Step1 - Adding Onclick Action ---- ${t1 - t0} milliseconds.`);
      t0 = t1;
    })

    agHelper.AssertElementVisibility(propPane._actionCardByTitle("No action"));
    cy.wrap(performance.now()).then(t1 => {   // this is now a queued command which will 
      // only run after the previous command
      t0 = t1;
    })

    agHelper.GetNClick(propPane._actionSelectorDelete);

    agHelper.AssertElementAbsence(propPane._actionCardByTitle("No action"));
    cy.wrap(performance.now()).then(t1 => {   // this is now a queued command which will 
      // only run after the previous command
      cy.log(`Step1 - Deleting the widget  ---- ${t1 - t0} milliseconds.`);
      t0 = t1;
    })
  });
});

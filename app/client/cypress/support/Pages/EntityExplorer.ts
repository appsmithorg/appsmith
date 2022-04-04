import { ObjectsRegistry } from "../Objects/Registry"

export class EntityExplorer {

    public agHelper = ObjectsRegistry.AggregateHelper
    public locator = ObjectsRegistry.CommonLocators;

    public SelectEntityByName(entityNameinLeftSidebar: string, section: 'WIDGETS' | 'QUERIES/JS' | 'DATASOURCES' | '' = '') {
        if (section)
            this.expandCollapseEntity(section)//to expand respective section
        cy.xpath(this.locator._entityNameInExplorer(entityNameinLeftSidebar))
            .last()
            .click({ multiple: true })
        this.agHelper.Sleep()
    }

    public NavigateToSwitcher(navigationTab: 'explorer' | 'widgets') {
        cy.get(this.locator._openNavigationTab(navigationTab)).click()
    }

    public AssertEntityPresenceInExplorer(entityNameinLeftSidebar: string) {
        cy.xpath(this.locator._entityNameInExplorer(entityNameinLeftSidebar))
            .should("have.length", 1);
    }

    public AssertEntityAbsenceInExplorer(entityNameinLeftSidebar: string) {
        cy.xpath(this.locator._entityNameInExplorer(entityNameinLeftSidebar)).should('not.exist');
    }

    public expandCollapseEntity(entityName: string, expand = true) {
        cy.xpath(this.locator._expandCollapseArrow(entityName)).invoke('attr', 'name').then((arrow) => {
            if (expand && arrow == 'arrow-right')
                cy.xpath(this.locator._expandCollapseArrow(entityName)).trigger('click', { multiple: true }).wait(1000);
            else if (!expand && arrow == 'arrow-down')
                cy.xpath(this.locator._expandCollapseArrow(entityName)).trigger('click', { multiple: true }).wait(1000);
            else
                this.agHelper.Sleep(500)
        })
    }

    public ActionContextMenuByEntityName(entityNameinLeftSidebar: string, action = "Delete", subAction = "") {
        this.agHelper.Sleep();
        cy.xpath(this.locator._contextMenu(entityNameinLeftSidebar))
            .last()
            .click({ force: true });
        cy.xpath(this.locator._contextMenuItem(action))
            .click({ force: true })
        this.agHelper.Sleep(500)
        if (subAction) {
            cy.xpath(this.locator._contextMenuItem(subAction))
                .click({ force: true })
            this.agHelper.Sleep(500)
        }
    }

    public DragDropWidgetNVerify(widgetType: string, x: number, y: number) {
        this.NavigateToSwitcher('widgets')
        this.agHelper.Sleep()
        cy.get(this.locator._widgetPageIcon(widgetType)).first()
            .trigger("dragstart", { force: true })
            .trigger("mousemove", x, y, { force: true });
        cy.get(this.locator._dropHere)
            .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
            .trigger("mousemove", x, y, { eventConstructor: "MouseEvent" })
            .trigger("mouseup", x, y, { eventConstructor: "MouseEvent" });
        this.agHelper.AssertAutoSave()//settling time for widget on canvas!
        cy.get(this.locator._widgetInCanvas(widgetType)).should('exist')
    }
}

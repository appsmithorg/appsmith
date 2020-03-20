var widgetsPage= require('../../locators/Widgets.json')
var loginPage= require('../../locators/LoginPage.json')
const loginData=require('../../fixtures/user.json')
var commonlocators = require('../../locators/commonlocators.json')

context('Cypress test',function() {

    it('Input Widget Functionality',function(){
      
        cy.get(widgetsPage.inputWidget).first().trigger('mouseover')
        cy.get(widgetsPage.inputWidget).children(commonlocators.editicon).first().click()
        //Checking the edit props for container and also the properties of container
        cy.get('.CodeMirror textarea').first().focus().type("{meta}a").clear({ force: true }).type('Test Input Label')
        cy.get('.CodeMirror textarea').first().should('have.value', 'Test Input Label')
        cy.get(commonlocators.editPropCrossButton).click()

    })
})
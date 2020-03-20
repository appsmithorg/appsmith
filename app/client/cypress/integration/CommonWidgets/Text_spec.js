var widgetsPage= require('../../locators/Widgets.json')
var loginPage= require('../../locators/LoginPage.json')
const loginData=require('../../fixtures/user.json')
var commonlocators = require('../../locators/commonlocators.json')

context('Cypress test',function() {

    it('Text Widget Functionality',function(){

        cy.get(widgetsPage.textWidget).first().trigger('mouseover')
        cy.get(widgetsPage.textWidget).children(commonlocators.editIcon).first().click()
        cy.get('.CodeMirror textarea').first().focus().type("{meta}a").clear({ force: true }).type('Test text')
        cy.get(commonlocators.editPropCrossButton).click()

    })
})
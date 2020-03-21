var loginPage= require('../../locators/LoginPage.json')
var homePage = require('../../locators/HomePage.json')
var commonlocators = require('../../locators/commonlocators.json')
var widgetsPage= require('../../locators/Widgets.json')



context('Cypress test',function() {

it('Login functionality',function(){

	cy.get(widgetsPage.buttonWidget).click({ force: true })
	cy.get('.CodeMirror textarea').focus().type("{meta}a").clear({ force: true }).type('Test', { force: true })
	cy.get(commonlocators.editPropCrossButton).click()
})
})
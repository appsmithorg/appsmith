var loginPage= require('../../locators/LoginPage.json')
const loginData=require('../../fixtures/user.json')

context('Cypress test',function() {

it('Login functionality',function(){
	
	cy.LogintoApp(loginData.username,loginData.password)
	cy.get('input[type="text"]').type('Test app')
	cy.wait(3000)
	cy.get('.t--application-edit-link').click()
	cy.wait(5000)
	cy.get('.t--draggable-buttonwidget').click({ force: true })
	cy.wait(2000)
	cy.get('textarea').first().click({ force: true }).clear({ force: true }).type('Test', { force: true })
	cy.wait(5000)
	cy.get('.t--application-publish-btn').click()
	
})
})
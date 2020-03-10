var loginPage= require('../locators/LoginPage.json')

Cypress.Commands.add("LogintoApp",(uname,pword)=>{
    cy.visit('/')
	cy.wait(6000)
	cy.get(loginPage.username).type(uname)
	cy.get(loginPage.password).type(pword)
	cy.get(loginPage.submitBtn).click()
})
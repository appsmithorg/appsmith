var loginPage= require('../locators/LoginPage.json')
var homePage = require('../locators/HomePage.json')

Cypress.Commands.add("LogintoApp",(uname,pword)=>{
    cy.visit('/')
	cy.get(loginPage.username).should('be.visible')
	cy.get(loginPage.username).type(uname)
	cy.get(loginPage.password).type(pword)
	cy.get(loginPage.submitBtn).click()
})
Cypress.Commands.add("SearchApp",(appname)=>{
	cy.get(homePage.searchInput).type(appname)
	cy.get(homePage.appEditIcon).should('have.length', 1)
	cy.get(homePage.appEditIcon).click()
	cy.get('#loading').should('not.exist')
})


Cypress.Commands.add("PublishtheApp",()=>{
	cy.wait(4000)
	cy.get(homePage.publishButton).click()
	cy.window()
    .then((win) => {
		cy.get(homePage.publishCrossButton).click()
      
    })
	
})


	

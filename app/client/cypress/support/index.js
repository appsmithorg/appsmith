// ***********************************************************
// This example support/index.js is processed and
// loaded automatically before your test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/configuration
// ***********************************************************

const loginData=require('../fixtures/user.json')
const inputData=require('../fixtures/inputdata.json')

// Import commands.js using ES2015 syntax:
import './commands'
before(function () {
   
    cy.LogintoApp(loginData.username,loginData.password)
    cy.SearchApp(inputData.appname)
  })

  beforeEach(function () {
   
    Cypress.Cookies.preserveOnce('session_id', 'remember_token')
  
  })

// Alternatively you can use CommonJS syntax:
// require('./commands')
after(function() {
 
  cy.PublishtheApp()
})

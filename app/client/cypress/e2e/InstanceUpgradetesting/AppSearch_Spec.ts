import { LoginPage } from '../pages/loginPage_spec'
import { HomePage } from '../pages/homepage_spec'
import { ApplicationPage } from '../pages/ApplicationPage'
import { DeployPage } from '../pages/deploy_spec'

describe('Appsmith Application Search and Verification', () => {
  const loginPage = new LoginPage()
  const homePage = new HomePage()
  const applicationPage = new ApplicationPage()
  const deployPage = new DeployPage()
  const appName = "Xolair"

  beforeEach(() => {
    cy.visit('http://ec2-3-110-218-99.ap-south-1.compute.amazonaws.com/')
  })

  it('should login, search app, and verify table content', () => {
    loginPage.login("","")
    homePage.searchApplication(appName)
    homePage.clickSuggestedApp(appName)
    cy.wait(5000)
    cy.get(".t--tab-Providers").should("be.visible")
    deployPage.verifyPatientsTab()
  })
}) 

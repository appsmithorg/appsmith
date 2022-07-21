## Goal
- Build new DigitalOcean snapshot to publish new version for One-Click Appsmith on DigitalOcean Marketplace

## Setup Build Development
- Install Packer [https://www.packer.io/downloads](https://www.packer.io/downloads)
  - MacOS:
  ```
  brew tap hashicorp/tap
  brew install hashicorp/tap/packer
  ```
  - Ubuntu/Debian
  ```
  curl -fsSL https://apt.releases.hashicorp.com/gpg | sudo apt-key add -
  sudo apt-add-repository "deb [arch=amd64] https://apt.releases.hashicorp.com $(lsb_release -cs) main"
  sudo apt-get update && sudo apt-get install packer
  ```

## Build DigitalOcean Snapshot
- You will need to generate DigitalOcean token and provide to Packer. Please follow this document to generate a token: [https://docs.digitalocean.com/products/api/create-personal-access-token/](https://docs.digitalocean.com/products/api/create-personal-access-token/)
- Export your DigitalOcean token to the environment variables
```
export DIGITALOCEAN_TOKEN=<your-personal-token>
```
- Change directory to the DigitalOcean deployment directory
```
cd deploy/digital_ocean
```
- Run Packer build
```
packer build template.json
```

## Publish New Version 
- After using Packer to build new snapshot, you will need to edit the `System Image` of the One-Click Application on DigitalOcean Marketplace.
- Firstly, please go to the `Marketplace Vendor Portal`
- Then, select Appsmith application in the One-Click App list to edit application information
- From the Edit form, click on `Select system image` to choose the new snapshot which we have just created by Packer (you may also need to change the `App Version` by higher version)

<img src='https://raw.githubusercontent.com/appsmithorg/appsmith/release/deploy/digital_ocean/images/edit-app.png' width="80%">

- In the pop-up window that shows all snapshots, choose the latest snapshot or the one that you wish to publish to `DigitalOcean Marketplace`
- Then, scrolling down to the bottom of the form and clicking on `Preview` (*The preview process will take around 2-3 business days*)
- Finally, after successful review, you can submit to apply the change to the `DigitalOcean Marketplace`
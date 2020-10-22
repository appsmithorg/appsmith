<div align="center">
    <img src="https://github.com/appsmithOrg/appsmith/blob/release/static/logo-no-padding.png" alt="Appsmith.com logo" width="100"/>
    <H1>Appsmith</H1>
</div>

<div align="center">
  <p>
  
  [![GitHub release](https://img.shields.io/github/v/release/appsmithorg/appsmith.svg?logo=GitHub)](https://github.com/appsmithorg/appsmith/releases/latest) 
  [![Website](https://img.shields.io/website?url=https%3A%2F%2Fappsmith.com&logo=Appsmith)](https://appsmith.com)
  [![Chat on Discord](https://img.shields.io/badge/chat-Discord-violet?logo=discord)](https://discord.gg/rBTTVJp)
  [![Docs](https://img.shields.io/badge/docs-v1.x-brightgreen.svg?style=flat)](https://docs.appsmith.com)<!-- ALL-CONTRIBUTORS-BADGE:START - Do not remove or modify this section -->
  [![All Contributors](https://img.shields.io/badge/contributors-50+-orange.svg?style=flat-square)](#-contributors)
  <!-- ALL-CONTRIBUTORS-BADGE:END -->
  
  </p>
</div>

-----------------

Appsmith is a **Visual MVC** Framework to build sophisticated internal tools without having to wrestle with ever-upcoming frontend technologies, or cumbersome HTML/CSS. 

You can build complex workflows using pre-built widgets (forms, tables, charts etc.), connect to any API or Database and even write conditional logic using Javascript.

API Support: REST & GraphQL APIs
Database Support: PostgreSQL, MongoDB & MySQL
Hosting: Cloud-hosted & On-premise

-------------------
<img src="https://github.com/appsmithOrg/appsmith/blob/readme-v2-images/static/UI.gif">
<p align="center">
  <img src="https://github.com/appsmithOrg/appsmith/blob/readme-v2-images/static/Query2.png" width="270">
  <img src="https://github.com/appsmithOrg/appsmith/blob/readme-v2-images/static/API2.png" width="270">
  <img src="https://github.com/appsmithOrg/appsmith/blob/readme-v2-images/static/Share5.png" width="270">
</p>

## 🏭 Features

* **5-minute setup**: Deploy Appsmith your server, or use it on cloud to start building in 5 minutes.
* **Frontend as a service**: Drag-and-drop to build sophisticated **dashboards** and **workflows, without writing HTML/CSS**. Write Javascript anywhere to transform data. [Read more here.](https://docs.appsmith.com/core-concepts/building-the-ui)
* **Database CRUD**: Query & update your database directly by connecting it to the UI. Connect to **PostgreSQL, MongoDB, MySQL & more!**.
* **Trigger APIs**: Connect to internal or external REST and GraphQL APIs to build custom apps.
* **Security**: DB Credentials are AES 256 encrypted and no data is stored by appsmith. Deploy behind your private VPC for additional security!
* **One-click deployment**: Managed deployment of your apps with a click of a button.
* **Access-control**: Control who can edit / view your applications. [Read more here.](https://docs.appsmith.com/core-concepts/access-control)
* **Authentication**: Allow users to authenticate via Google Auth or GitHub Auth.

Read more at [Appsmith.com](https://www.appsmith.com/), or jump start with the [docs](https://docs.appsmith.com/).

## 📺 Demo

Unsure if Appsmith is for you? [Watch it in action here](http://bit.ly/appsmith-demo-github) 

But if you’d rather check out some real applications that can be built with Appsmith, check below:
* Customer Support Dashboard
  * [Try it out](https://bit.ly/cs-dashboard-appsmith)
  * [Tutorial](https://www.youtube.com/watch?v=-O_6OLREEzo) (5:33 mins)

* Job Application Tracker
  * [Try it out](https://bit.ly/3hbYtTi)
  * Tutorial

* Recommendation Manager
  * Try it out
  * [Tutorial](https://www.youtube.com/watch?v=GGe_5C0eqAo) (5:38 mins)

Or, [go exploring on your own](https://docs.appsmith.com/).

## 🏃‍♀️ Quickstart

### One-click deployment on Appsmith Cloud

The fastest and easiest way to try Appsmith out is via [Appsmith Cloud](https://bit.ly/appsmith-signup-github) 
1. [Sign up](https://bit.ly/appsmith-signup-github).
2. Create a new App within the organization that has already been create for you.
3. Navigate to `Pages -> Queries -> Mock Database` and follow these steps to create a new query -
    1. Write query `select * from users limit 5;`.
    2. Name the query as `usersQuery`.
4. Navigate to `Pages -> Widgets` and create a table `UsersTable` by dragging-and-droping the table-widget.
5. Navigate to `Table Data` property of `UsersTable`, and fill in `{{usersQuery.data}}` to display thq query's results in this table. 
6. Hit the Deploy button.
7. Click on the Share button to get a shareable-link of the app, and manage its access. 

You just built your first app with mock data. Connect your own data to build real apps. [Read more here.](https://docs.appsmith.com/)

### Other deployment options
* [Deploy with Docker](https://bit.ly/appsmith-docker-github)

## 📕 Support & Troubleshooting

The [documentation](https://docs.appsmith.com/) and community will help you troubleshoot most issues. If you have encountered a bug or need to get in touch with us, you can contact us using one of the following channels:

* Issue & bug tracking: [GitHub Issues](https://github.com/appsmithorg/appsmith/issues/new/choose)
* Support & feedback: [Discord](https://discord.gg/rBTTVJp)

We are committed to fostering an open and welcoming environment in the community. Please see the [Code of Conduct](CODE_OF_CONDUCT.md).

## ∞ Contributing

If you're interested in contributing to Appsmith:
1. Start by reading our [Contribution Guide](https://github.com/appsmithorg/appsmith/blob/master/CONTRIBUTING.md) 
2. Learn how to set up your local environment, in our [developer-guide](https://github.com/appsmithorg/appsmith/blob/master/contributions/CodeContributionsGuidelines.md#-setup-for-local-development)
3. Explore our [open issues](https://github.com/appsmithorg/appsmith/issues/new/choose)

## 📑 License

The Appsmith platform is available under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) (Apache-2.0).

## Contributors


<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove or modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://arpitmohan.com"><img src="https://avatars2.githubusercontent.com/u/458946?v=4" width="100px;" alt=""/><br /><sub><b>Arpit Mohan</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=mohanarpit" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Nikhil-Nandagopal"><img src="https://avatars2.githubusercontent.com/u/3897254?v=4" width="100px;" alt=""/><br /><sub><b>Nikhil Nandagopal</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=Nikhil-Nandagopal" title="Documentation">📖</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=Nikhil-Nandagopal" title="Code">💻</a> <a href="#projectManagement-Nikhil-Nandagopal" title="Project Management">📆</a></td>
    <td align="center"><a href="https://github.com/areyabhishek"><img src="https://avatars1.githubusercontent.com/u/30255708?v=4" width="100px;" alt=""/><br /><sub><b>areyabhishek</b></sub></a><br /><a href="#ideas-areyabhishek" title="Ideas, Planning, & Feedback">🤔</a> <a href="#design-areyabhishek" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/trishaanand"><img src="https://avatars2.githubusercontent.com/u/8403079?v=4" width="100px;" alt=""/><br /><sub><b>Trisha Anand</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=trishaanand" title="Code">💻</a> <a href="#infra-trishaanand" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#ideas-trishaanand" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/hetunandu"><img src="https://avatars2.githubusercontent.com/u/12022471?v=4" width="100px;" alt=""/><br /><sub><b>Hetu Nandu</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=hetunandu" title="Code">💻</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=hetunandu" title="Tests">⚠️</a> <a href="#ideas-hetunandu" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/riodeuno"><img src="https://avatars1.githubusercontent.com/u/103687?v=4" width="100px;" alt=""/><br /><sub><b>Abhinav Jha</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=riodeuno" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/satbir121"><img src="https://avatars3.githubusercontent.com/u/39981226?v=4" width="100px;" alt=""/><br /><sub><b>satbir121</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=satbir121" title="Code">💻</a> <a href="#ideas-satbir121" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://sharats.me"><img src="https://avatars3.githubusercontent.com/u/120119?v=4" width="100px;" alt=""/><br /><sub><b>Shrikant Sharat Kandula</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=sharat87" title="Code">💻</a> <a href="#plugin-sharat87" title="Plugin/utility libraries">🔌</a></td>
    <td align="center"><a href="https://github.com/aakashDesign"><img src="https://avatars2.githubusercontent.com/u/65771350?v=4" width="100px;" alt=""/><br /><sub><b>Aakash Shrivastava</b></sub></a><br /><a href="#design-aakashDesign" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/Debsourabh"><img src="https://avatars2.githubusercontent.com/u/34486435?v=4" width="100px;" alt=""/><br /><sub><b>Debsourabh Ghosh</b></sub></a><br /><a href="#design-Debsourabh" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/NandanAnantharamu"><img src="https://avatars1.githubusercontent.com/u/67676905?v=4" width="100px;" alt=""/><br /><sub><b>NandanAnantharamu</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=NandanAnantharamu" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/prapullac"><img src="https://avatars3.githubusercontent.com/u/71753653?v=4" width="100px;" alt=""/><br /><sub><b>prapullac</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Aprapullac" title="Bug reports">🐛</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=prapullac" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/Saket2"><img src="https://avatars0.githubusercontent.com/u/49346036?v=4" width="100px;" alt=""/><br /><sub><b>Saket Agrawal</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3ASaket2" title="Bug reports">🐛</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=Saket2" title="Documentation">📖</a></td>
    <td align="center"><a href="https://harishkotra.me"><img src="https://avatars1.githubusercontent.com/u/4999463?v=4" width="100px;" alt=""/><br /><sub><b>Harish Kotra</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Aharishkotra" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/visibleajay"><img src="https://avatars0.githubusercontent.com/u/13945951?v=4" width="100px;" alt=""/><br /><sub><b>Ajay Kumar</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Avisibleajay" title="Bug reports">🐛</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=visibleajay" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/akbansa"><img src="https://avatars0.githubusercontent.com/u/13042781?v=4" width="100px;" alt=""/><br /><sub><b>Anshul Bansal</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Aakbansa" title="Bug reports">🐛</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=akbansa" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/gogetter22"><img src="https://avatars3.githubusercontent.com/u/71608910?v=4" width="100px;" alt=""/><br /><sub><b>Navia Garg</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Agogetter22" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/Xniveres"><img src="https://avatars0.githubusercontent.com/u/56609232?v=4" width="100px;" alt=""/><br /><sub><b>Xniveres</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3AXniveres" title="Bug reports">🐛</a></td>
  </tr>
</table>

<!-- markdownlint-enable -->
<!-- prettier-ignore-end -->
<!-- ALL-CONTRIBUTORS-LIST:END -->

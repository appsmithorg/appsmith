<p align="center">
    <img src="https://github.com/appsmithOrg/appsmith/blob/release/static/appsmith_logo_white.png" alt="Appsmith.com logo" width="400"/>
    <br>
    <i> Build and self-host all your internal apps.</i>
  <br>
</p>

<p align="center">
    <a href="https://app.appsmith.com/signup"><strong>Try Online Sandbox</strong></a>
</p>

<p align="center">
  <a href="https://docs.appsmith.com/">Documentation</a>
  ·
  <a href="https://discord.gg/rBTTVJp">Discord</a>
  ·
  <a href="./office_hours.md">Office Hours</a>  
  <br>
  <br>
</p>

-----------------
<div>    
Appsmith is a JavaScript-based visual development platform to build and launch internal tools quickly. Drag-and-drop pre-built widgets, and connect them using JavaScript to create interactive pages. Connect UI to your APIs and Databases to build complex workflows in minutes.<br/><br/>

**UI Components**: Table, Chart, Form, Map, Image, Video, and many more.<br/>
**API Support**: REST APIs<br/>
**Database Support**: PostgreSQL, MongoDB, MySQL, Firestore, Redshift, Elastic Search, DynamoDB, Redis, and MSFT SQL Server<br/>
**Hosting**: Cloud-hosted & On-premise

Already familiar with Appsmith? [Quickly start building on your own](#%EF%B8%8F-quickstart).
</div>

<img src="https://github.com/appsmithOrg/appsmith/blob/release/static/UI.gif">
<p align="center">
  <img src="https://github.com/appsmithOrg/appsmith/blob/release/static/Query2.png" width="270">
  <img src="https://github.com/appsmithOrg/appsmith/blob/release/static/API2.png" width="270">
  <img src="https://github.com/appsmithOrg/appsmith/blob/release/static/Share5.png" width="270">
</p>

## 🏭 Features

* **5-minute setup**: Deploy Appsmith on your server, or use our cloud version to start building in 5 minutes. [Quick Start](#%EF%B8%8F-quickstart)
* **Frontend as a service**: Drag-and-drop from pre-built UI widgets like table, form, and image, to build sophisticated **dashboards** and **workflows, without writing HTML/CSS**. Write JavaScript anywhere to transform data, and dynamically control widget-properties.
* **Database CRUD**: Query & update your database directly by connecting it to the UI. Connect to **PostgreSQL, MongoDB, MySQL & more!**
* **Trigger APIs**: Connect to REST APIs to build custom apps.
* **Security**: DB Credentials are AES 256 encrypted and no data is stored by appsmith. Deploy behind your private VPC for additional security!
* **One-click deployment**: Managed deployment of your apps with a click of a button.
* **Access-control**: Assign users different roles & control who can edit / view your applications.
* **Supports OAuth**: Allow users to authenticate via Google Auth or GitHub Auth.

## 📺 Demo

Unsure if Appsmith is for you? [Watch it in action here](http://bit.ly/appsmith-demo-github) 

But if you’d rather check out some real applications that can be built with Appsmith, check below:
* [Customer Support Dashboard](https://bit.ly/cs-dashboard-appsmith)
* [Job Application Tracker](https://bit.ly/3hbYtTi)

## 🏃‍♀️ Quickstart

The following steps introduce you to building a simple user-list dashboard on Appsmith.
1. [Sign up on Appsmith Cloud](https://bit.ly/appsmith-signup-github) or [Deploy Appsmith](https://docs.appsmith.com/setup).
2. Create a new app within the organization that has already been created for you.
3. Click on the `+` icon next to the `Queries` section to add a new query in the mock database
    1. Name the query `usersQuery`.
    2. Write the query `select * from users limit 5;`.
    3. Run the query.
4. Click on the `+` icon next to the `Widgets` section and drag a table onto the screen
5. Link the table data property to the `usersQuery` using JavaScript `{{usersQuery.data}}`
6. Hit the Deploy button and checkout the view mode of the app.

Congratulations 🎉 You just built your first app on Appsmith! 
Connect your own data to build apps for your team. [Read more here.](https://docs.appsmith.com/core-concepts)

## 📕 Support & Troubleshooting

If you encountered a bug or need help troubleshooting an issue, you can use one of the following channels:

* Self Help: [Documentation](https://docs.appsmith.com)
* Community Support: [Discord](https://discord.gg/rBTTVJp)
* Issue & bug tracking: [GitHub Issues](https://github.com/appsmithorg/appsmith/issues/new/choose)

## 🧑‍🤝‍🧑 Contributing

If you're interested in contributing to Appsmith:
1. Start by reading our [Contribution Guide](https://github.com/appsmithorg/appsmith/blob/master/CONTRIBUTING.md).
2. Learn how to set up your local environment, in our [developer-guide](https://github.com/appsmithorg/appsmith/blob/master/contributions/CodeContributionsGuidelines.md#-setup-for-local-development).
3. Explore our list of [good first issues](https://github.com/appsmithorg/appsmith/issues?q=is%3Aissue+is%3Aopen+label%3A%22Good+First+Issue%22).

We are committed to fostering an open and welcoming environment in the community. Please read our [Code of Conduct](CODE_OF_CONDUCT.md).

## 📑 License

The Appsmith platform is available under the [Apache License 2.0](https://www.apache.org/licenses/LICENSE-2.0) (Apache-2.0).

## Contributors


<!-- ALL-CONTRIBUTORS-LIST:START - Do not remove / modify this section -->
<!-- prettier-ignore-start -->
<!-- markdownlint-disable -->
<table>
  <tr>
    <td align="center"><a href="http://arpitmohan.com"><img src="https://avatars2.githubusercontent.com/u/458946?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Arpit Mohan</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=mohanarpit" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Nikhil-Nandagopal"><img src="https://avatars2.githubusercontent.com/u/3897254?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nikhil Nandagopal</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=Nikhil-Nandagopal" title="Documentation">📖</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=Nikhil-Nandagopal" title="Code">💻</a> <a href="#projectManagement-Nikhil-Nandagopal" title="Project Management">📆</a></td>
    <td align="center"><a href="https://github.com/areyabhishek"><img src="https://avatars1.githubusercontent.com/u/30255708?v=4?s=100" width="100px;" alt=""/><br /><sub><b>areyabhishek</b></sub></a><br /><a href="#ideas-areyabhishek" title="Ideas, Planning, & Feedback">🤔</a> <a href="#design-areyabhishek" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/trishaanand"><img src="https://avatars2.githubusercontent.com/u/8403079?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Trisha Anand</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=trishaanand" title="Code">💻</a> <a href="#infra-trishaanand" title="Infrastructure (Hosting, Build-Tools, etc)">🚇</a> <a href="#ideas-trishaanand" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/hetunandu"><img src="https://avatars2.githubusercontent.com/u/12022471?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Hetu Nandu</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=hetunandu" title="Code">💻</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=hetunandu" title="Tests">⚠️</a> <a href="#ideas-hetunandu" title="Ideas, Planning, & Feedback">🤔</a></td>
    <td align="center"><a href="https://github.com/riodeuno"><img src="https://avatars1.githubusercontent.com/u/103687?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Abhinav Jha</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=riodeuno" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/satbir121"><img src="https://avatars3.githubusercontent.com/u/39981226?v=4?s=100" width="100px;" alt=""/><br /><sub><b>satbir121</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=satbir121" title="Code">💻</a> <a href="#ideas-satbir121" title="Ideas, Planning, & Feedback">🤔</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://sharats.me"><img src="https://avatars3.githubusercontent.com/u/120119?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Shrikant Sharat Kandula</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=sharat87" title="Code">💻</a> <a href="#plugin-sharat87" title="Plugin/utility libraries">🔌</a></td>
    <td align="center"><a href="https://github.com/aakashDesign"><img src="https://avatars2.githubusercontent.com/u/65771350?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Aakash Shrivastava</b></sub></a><br /><a href="#design-aakashDesign" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/Debsourabh"><img src="https://avatars2.githubusercontent.com/u/34486435?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Debsourabh Ghosh</b></sub></a><br /><a href="#design-Debsourabh" title="Design">🎨</a></td>
    <td align="center"><a href="https://github.com/NandanAnantharamu"><img src="https://avatars1.githubusercontent.com/u/67676905?v=4?s=100" width="100px;" alt=""/><br /><sub><b>NandanAnantharamu</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=NandanAnantharamu" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/prapullac"><img src="https://avatars3.githubusercontent.com/u/71753653?v=4?s=100" width="100px;" alt=""/><br /><sub><b>prapullac</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Aprapullac" title="Bug reports">🐛</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=prapullac" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/Saket2"><img src="https://avatars0.githubusercontent.com/u/49346036?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Saket Agrawal</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3ASaket2" title="Bug reports">🐛</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=Saket2" title="Documentation">📖</a></td>
    <td align="center"><a href="https://harishkotra.me"><img src="https://avatars1.githubusercontent.com/u/4999463?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Harish Kotra</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Aharishkotra" title="Bug reports">🐛</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/visibleajay"><img src="https://avatars0.githubusercontent.com/u/13945951?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Ajay Kumar</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Avisibleajay" title="Bug reports">🐛</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=visibleajay" title="Documentation">📖</a></td>
    <td align="center"><a href="https://github.com/akbansa"><img src="https://avatars0.githubusercontent.com/u/13042781?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Anshul Bansal</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Aakbansa" title="Bug reports">🐛</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=akbansa" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/gogetter22"><img src="https://avatars3.githubusercontent.com/u/71608910?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Navia Garg</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3Agogetter22" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/Xniveres"><img src="https://avatars0.githubusercontent.com/u/56609232?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Xniveres</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/issues?q=author%3AXniveres" title="Bug reports">🐛</a></td>
    <td align="center"><a href="https://github.com/daniel-shuy"><img src="https://avatars1.githubusercontent.com/u/17351764?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Daniel Shuy</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=daniel-shuy" title="Code">💻</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=daniel-shuy" title="Documentation">📖</a></td>
    <td align="center"><a href="http://prashantchaubey.com"><img src="https://avatars3.githubusercontent.com/u/14848874?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Prashant Chaubey</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=pc9795" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/A-Scratchy"><img src="https://avatars0.githubusercontent.com/u/25309929?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Adam</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=A-Scratchy" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/sumanthyedoti"><img src="https://avatars3.githubusercontent.com/u/30371888?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sumanth Yedoti</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=sumanthyedoti" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/nidhi-nair"><img src="https://avatars2.githubusercontent.com/u/5298848?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Nidhi</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=nidhi-nair" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/jsartisan"><img src="https://avatars1.githubusercontent.com/u/6636360?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Pawan Kumar</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=jsartisan" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/sumitsum"><img src="https://avatars0.githubusercontent.com/u/1757421?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Sumit Kumar</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=sumitsum" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/rishabhsaxena"><img src="https://avatars0.githubusercontent.com/u/1944800?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Rishabh Saxena </b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=rishabhsaxena" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/ofpiyush"><img src="https://avatars0.githubusercontent.com/u/292174?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Piyush Mishra</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=ofpiyush" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/akash-codemonk"><img src="https://avatars2.githubusercontent.com/u/67054171?v=4?s=100" width="100px;" alt=""/><br /><sub><b>akash-codemonk</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=akash-codemonk" title="Code">💻</a></td>
  </tr>
  <tr>
    <td align="center"><a href="https://github.com/vicky-primathon"><img src="https://avatars2.githubusercontent.com/u/67091118?v=4?s=100" width="100px;" alt=""/><br /><sub><b>vicky-primathon</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=vicky-primathon" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/devrk96"><img src="https://avatars0.githubusercontent.com/u/68607686?v=4?s=100" width="100px;" alt=""/><br /><sub><b>devrk96</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=devrk96" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/trdillon"><img src="https://avatars.githubusercontent.com/u/26350151?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Tim Dillon</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=trdillon" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/zegerhoogeboom"><img src="https://avatars.githubusercontent.com/u/5371096?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Zeger Hoogeboom</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=zegerhoogeboom" title="Code">💻</a></td>
    <td align="center"><a href="https://github.com/Devedunkey"><img src="https://avatars.githubusercontent.com/u/29448764?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Young Yoo</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=Devedunkey" title="Code">💻</a></td>
    <td align="center"><a href="http://dwayne.io"><img src="https://avatars.githubusercontent.com/u/347097?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Dwayne Forde</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=osis" title="Code">💻</a> <a href="https://github.com/appsmithorg/appsmith/commits?author=osis" title="Tests">⚠️</a></td>
    <td align="center"><a href="https://github.com/monarch0111"><img src="https://avatars.githubusercontent.com/u/2965013?v=4?s=100" width="100px;" alt=""/><br /><sub><b>Abhishek</b></sub></a><br /><a href="https://github.com/appsmithorg/appsmith/commits?author=monarch0111" title="Code">💻</a></td>
  </tr>
</table>

<!-- markdownlint-restore -->
<!-- prettier-ignore-end -->

<!-- ALL-CONTRIBUTORS-LIST:END -->

<font size = 5>**Module View (Client Side)**</font>

![Client Side Module View Diagram](./ModuleView.png?raw=true "Module View Client Side")

Appsmith has many components that all work together. First, there is the React app’s index file. This is the beginning of the front end that ends up loading the theme and using the React Router component. The index file also loads the ads/Toast Component. This component is in charge of putting the ads on the landing screen. This component acts as a way to redirect the user to different pages within the app. To do so, it communicates with the constants/routes component. This component contains all of the routes to the different pages. Initially, the React router redirects to a landing page component that then redirects you to an authorization component that checks if you are signed in. If you are, it will redirect you to the applications component; otherwise, it will keep you on the landing page. 

Along with Appsmith’s website pages, there are folders related to utils and widgets. The utils folder contains an analytics component, DSL migration component, and history component. These components all work behind the scenes of the website to ensure everything is loaded and logged. The widgets folder contains an audio widget, chart Widget, Icon widget, input widget, and many more. These widgets contribute to the website's look and make it easy for the user to interact with the website. 

The client-side also has a test folder that contains the setup and testing components. The setup component establishes API mocking before all tests, resets the handlers that are declared as part of the tests, and then cleans up after the tests are done. The testing components are composed of testCommon, testMockedWidgets, and testUtils. TestCommon performs basic tests such as the hotkey test and ensures that the correct URLs are loaded. TestMockedWidgets tests the widgets, and testUtils leads you to the sagas component, which lists sagas that need to be tested.

<font size = 5>**Module View (Server Side -  appsmith.server package)**</font>

![Server Side Module View Diagram](./ModuleView2.png?raw=true "Module View Server Side")


The Appsmith server side contains classes that are comprehensively categorized based on functionality. These include appsmith-git, appsmith-interfaces, appsmith-plugins, and appsmith-server. 

**appsmith-git**

This folder contains functionalities for git configurations and updates. When users create their app layout, they can connect it to their own GitHub and use git functions within Appsmith.
- GitExecutorImpl.java is the module that allows you to push and initialize   
  repositories, clone repositories, etc. 
- FilesUtilsImpl.java has functionality such as saving files, converting to and
  dehydrating JSON, deleting files from the repo and creating READMEs. 
- Some other git functions are located in other parts of the repository. For
  example, many git cloud functions or SSH key generators are located in the helpers file. This is possibly due to functionality, and it helps organize the project.

**appsmith-plugins**

Appsmith also has an appsmith-plugins folder within the server folder, which contains all the plugins that appsmith utilizes. These plugins include amazons3, arangoDB, dynamo, elasticSearch, firestore, googleSheets, graphql, js, mongoDB, mssql, mysql, postgres, rapidAPI, redis, redshift, and snowflake. 

**appsmith-server**

A common theme inside the appsmith-server folder is that most classes are split into two parts–one for an abstract class (labeled as “CE”) and another class which extends the abstract class CE. All of the code logic is inside the abstract CE class. The backend code was separated last year, as seen with the commits. No additional details were mentioned on the git issue, but abstract classes avoid redundancy because common code can be placed in parent classes. 

The server code immensely utilizes the class module structure. Since everything is so broken up, it allows things to be changed easily without possibly breaking as many things due to tightly-coupled systems. It is also good for extensibility because it is really easy to see how things relate. The process of adding something is really easy. Utilizing the other classes that are already separated out and not dependent on each other makes it convenient to add a new class and mimic what is already there.

Many packages exist inside the appsmith-server folder, so only significant ones will be analyzed in detail.

- The _acl_ folder handles user permissions, policy groups, and roles. The
  PolicyGeneratorCE.java class in this folder defines permissions available, and then AppsmithRole.java and AclPermission.java assign these roles.

- The _authentication/handers_ folder has all of the login/logout authentication
  and error handling. Receiving an authentication error is one class, and then handling that error (for example, denying access) is a different class. This is good for extensibility and modifiability. 

- The _configurations_ folder has all the configurations for the different
  services appsmith utilizes. Appsmith primarily uses MongoDB, so they have an entire folder dedicated to MongoDB configurations in this folder. The rest of the configurations folder contains configurations for their cloud services, creating an admin email account, encryption configuration, Google Recaptcha, security, Redis, and many more. Whatever configurations need to be made for appsmith are located here.

- The _constants_ package contains all the constants referenced across the server
  code, which is good for modularity. Moreover, when those constants need to be changed, they must only be modified here and not throughout the codebase.

- The _controllers_ package contains the different request mappings for the web
  app categorized by appropriate functionalities. The classes inside the controllers folder are split into an abstract CE class and a controller. The controller class has the @RestMapping annotation and extends the abstract CE class. The controller class calls the super method, passing in the services used to initialize the abstract CE class. 

  The controllers package contains numerous dependencies such as:
  1) the spring framework for the REST controller structure
  2) lombok Slf4j for error logging
  3) server.solutions and server.services for calling server methods
  4) server.exceptions for error messages
  5) server.dtos and server.domains for response objects
  6) server.constants for URLs and field names

Inside the controllers package is a BaseController class. This base class is extended by some controllers and contains basic CRUD methods. 

- CrudService is an interface inside the appsmith.services package, which is
  implemented by the service classes.
-  BaseDomain is an abstract class for persistent, serializable data used in the
  app.
- ID is the generic type of the id for the URL path variable.

This BaseController class benefits the app because common methods are stored within this parent class. As seen throughout the controllers package, the class module structure is heavily used, which allows for good abstraction and code reuse–a sign of good architecture.

- The _domains_ package contains the data objects with respective properties. Some
  examples of domains are Action, Page, and Workspace. Some library dependencies exist here, like Lombok and Spring frameworks, which are used for data libraries and annotations. 

More importantly, the domain objects extend the BaseDomain class. The BaseDomain class exists outside this package and is located in appsmith-interfaces. The BaseDomain is an abstract class that implements spring framework persistable, java serializable, and AppsmithDomain. Appsmith is an empty interface class that was implemented for “Annotation-based encryption,” as explained in the commits. 

The class module structure is exemplified in this package. BaseDomain allows for the child domain objects to inherit its fields, avoiding the work of adding all the fields that exist within BaseDomain to all other domain objects. 

- The _dtos_ package contains the server response data objects. The classes are  
  simple data containers with respective data fields. 

  An important class that exists here is ResponseDTO. 
  - This class is a generic type container implementing Serializable.  
  - This class has a ReponseMetaDTO field initialized to contain the return object's meta fields.
  - The existence of this class exemplifies a good module structure because of
    good abstraction. Appropriate code attributes are placed in respective classes, with little to no code redundancy.

- The _helpers_ package contains the utility classes. An example is a method that
  handles comments. Small modules do miscellaneous tasks like zipping the project into a file. They even have really small classes for common methods. For example, they have one just for getting enums, which is good for code reusability and modularity.

- The _services_ package holds the main logic for data manipulation for the server
  side. This package has a separate CE folder for abstract classes like the controllers. Numerous connections exist between classes in the services package. As an example, let’s look at the comment service.

    - CommentService.java: An empty public interface class that extends  
      CommentServiceCE.
    - CommentServiceImpl.java: An empty class with @Service annotation which
      extends CommentServiceCEImpl and implements CommentService. This class calls super() on CommentServiceCEImpl with necessary parameters such as other services, util methods, and repositories. 
    - CommentServiceCE.java: The interface class containing all definitions for
      the comment service methods. This class extends CrudService–an interface class containing common top-level CRUD methods for all services.
      - Side note: Having the BaseDomain parent class allows for good abstraction
        because the CrudService class doesn’t need to know the specific type of Domain object it uses.
    - CommentServiceImplCE.java: Contains all implementation details of the  
      methods defined in CommentServiceCE. It extends BaseService and implements CommentServiceCE
      - BaseService is an abstract class containing common code extended by all
        service methods.

Some dependencies that exist inside the service method implementation include:
- server constant and helpers for utility
- appropriate server domains and dtos for data objects
- appropriate server repositories
- other service methods

The example above shows strong cohesion between classes in this package. This can signify good architecture because relatedness is used to their advantage. Interfaces avoid exposing implementation details, while abstract classes group common code across different service methods. As their dependencies show, there is also some reasonable coupling with the service methods. However, this is still good because they mostly reference classes with the same functionality. For example, comment services use comment-related domains and repositories. 

<font size = 5>**Deployment View**</font>

![Deployment View Diagram](./Deployment.png?raw=true "Deployment View")

There are multiple tools used in the process of deploying Appsmith. The primary tool that is used to build the code for Appsmith is known as Maven. Maven is an open-source build tool developed by the Apache Group. Many forms of testing occur in the deployment process. For example, multiple mock tests are being run that test all of the widgets and ensure everything runs properly. These tests are in the file _testCommon.ts_ and the _app/client/test/_mocks__ folder.

Additionally, Appsmith uses Cypress testing, which is an automated JavaScript testing solution for web applications. The Cypress testing can be found in the app/client/cypress folder. Multiple scripts within the _Cypress_ file are composed of automated tests aimed at testing the client side of Appsmith. 

When it comes to code deployment, a plethora of softwares are used. The main tools used are Packer, AWS, DigitalOcean, Docker, Ansible, Heroku, Helm, and Kubernetes. 

Packer is an open-source tool for creating identical machine images for multiple platforms from a single source configuration. Within Appsmith, the packer scripts build the AWS and DigitalOcean images. 

Docker is also used within Appsmith because the docker container runs processes such as the Appsmith server, Nginx, and MongoDB inside a single docker container. Docker can be found on the client side of the repository in the _app/client/docker_ folder. Additionally, docker can be found in the deployment folders in deploy/docker within the repository.

Ansible is also another option that Appsmith uses to deploy their code. Ansible is used to push all configuration/ad-hoc tasks to your systems via ssh very fast. It is very useful because it does not require a client to run on the systems you are deploying. It is essentially used to push the app onto your browser using your custom domain or server host. Ansible can be found within the _deploy/ansible/appsmith_playbook_ folder.

Heroku is also used to deploy applications for Appsmith. Heroku is a container-based cloud platform commonly used to deploy, manage, and scale modern apps. Heroku can be found in the _deploy/Heroku_ folder. 

Helm essentially helps you define, install, and upgrade most Kubernetes applications. Helm and Kubernetes can be found in the deploy/Helm folder. On the other hand, Kubernetes is an open-source container orchestration platform that automates many manual processes in deploying, managing, and scaling containerized applications. 

Ultimately, Appsmith allows you to choose what tools you want to use to deploy your newly created app.
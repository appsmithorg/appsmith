## Plugin Code Contribution Guidelines

Please follow the given guidelines to make sure that your commit sails through the review process without any 
hiccups.

### Code Design
As much as possible, please try to abide by the following code design:
1. All plugins are part of the package: com.external.plugins.
2. All plugin src code resides in the path: [app/server/appsmith-plugins](https://github.com/appsmithorg/appsmith/tree/release/app/server/appsmith-plugins) 
3. To integrate the new plugin:
   - add corresponding changes to the file DatabaseChangelog.java like
   [here](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-server/src/main/java/com/appsmith/server/migrations/DatabaseChangelog.java#L1258)
   - add your plugin to [this POM file](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/pom.xml) 
4. Each plugin must implement all the methods defined by [this](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-interfaces/src/main/java/com/appsmith/external/plugins/PluginExecutor.java) interface like [here](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/mysqlPlugin/src/main/java/com/external/plugins/MySqlPlugin.java) and [here](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/restApiPlugin/src/main/java/com/external/plugins/RestApiPlugin.java)

### Package Dependency
1. We use Maven to manage package dependencies, hence please add all your dependencies in POM file as shown in this 
   [reference POM file](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/pom.xml)
2. Always use release version of the packages or release candidate if the release version is not available. 
3. Build and test your code to check for any dependency conflicts and resolve them. 

### Source Code
1. Please name your file like DbnamePlugin.java, for example: [PostgresPlugin.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/main/java/com/external/plugins/PostgresPlugin.java)
2. When importing packages make sure that only those packages are imported that are used, and refrain from using xyz.*
3. Refrain from using magic strings. Whenever possible, assign them to a private static variable for usage.
4. Appsmith's API server is powered by Spring weblfux and hence expects programmers to follow a reactive model.
   - In case a reactive driver is available for the plugin that you want to add, please use it after verifying
     that it supports all of the commonly used data types. In case the reactive driver does not support enough data types,
     please use any other well known and trusted driver.
   - In case the driver that you wish to use does not follow reactive model, please enforce reactive model as shown 
     in the plugin code [here](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/main/java/com/external/plugins/PostgresPlugin.java)
5. Make sure to handle any exceptions
    - Always check for a stale connection and throw an uncaught StaleConnectionException. This exception is caught 
      by upper layers and a retry is triggered. For reference, please check the usage of StaleConnectionException [here](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/main/java/com/external/plugins/PostgresPlugin.java)
6. Always check for null values before using objects. 
7. Comment your code in hard to understand areas. 
    

### Unit Test 
1. Every plugin must have its own unit test file like [this](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/test/java/com/external/plugins/PostgresPluginTest.java)
2. The test file must be named as PluginNameTest.java e.g. PostgresPluginTest.java
3. In case testing against a real instance, for example, using testcontainers is not possible, then use Mockito 
   framework to test via mocking.
4. Please test the following cases in your file:
    - Successfully establishing connection to datasource. 
    - Reject invalid credentials.
    - Successful query execution.
    - Stale connection exception. 
    - In case of a database plugin, test that it is able to fetch tables/collection info from database and key
      constraints info as well.
5. Reference test files:
    - [PostgresPluginTest.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/test/java/com/external/plugins/PostgresPluginTest.java)
    - [MySqlPluginTest.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/mysqlPlugin/src/test/java/com/external/plugins/MySqlPluginTest.java)

### Code Review
1. Before you start working on a code change, please check with any of the maintainers first regarding the same. You 
   may initiate a discussion on Github Discussions page or comment on any of the open issues or directly reach out on 
   our Discord channel. 
2. Before you raise a pull request, please check if there is a bug that has been raised to address it. If not, then 
   raise a bug yourself and link it with your pull request.
3. You may share you pull request on Appsmith's discord channel or send an email to support@appsmith.com for attention.
4. Please be as descriptive as possible in the pull request's description section. Clearly mention how the code has 
   been tested. If possible, add snapshots too. 

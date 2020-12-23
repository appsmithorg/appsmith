## Plugin Code Contribution Guidelines

Please follow the given guidelines to make sure that your commit sails through the review process without any 
hiccups.

### Overall Code Design
// TODO: fill it.
// Topics : 1. overall design 2. plugin src code structure 3. UI Interface

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
    

### Test Code 
// TODO: fill it. 

### Code Review
// TODO: fill it.
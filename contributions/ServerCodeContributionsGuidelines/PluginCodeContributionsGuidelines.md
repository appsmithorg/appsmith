## Plugin Code Contribution Guidelines

Please follow the given guidelines to make sure that your commit sails through the review process without any 
hiccups.

### Code Design
As much as possible, please try to abide by the following code design:
1. All plugins are part of the package: `com.external.plugins`.
2. All plugin src code resides in the path: [app/server/appsmith-plugins](https://github.com/appsmithorg/appsmith/tree/release/app/server/appsmith-plugins). 
3. To integrate the new plugin:
   - add corresponding changes to the file `DatabaseChangelog.java` like
   [here in DatabaseChangelog.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-server/src/main/java/com/appsmith/server/migrations/DatabaseChangelog.java#L1258).
   - add your plugin to [this pom.xml file](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/pom.xml). 
4. Each plugin must implement all the methods defined by the interface in [PluginExecutor.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-interfaces/src/main/java/com/appsmith/external/plugins/PluginExecutor.java), for example: [MySqlPlugin.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/mysqlPlugin/src/main/java/com/external/plugins/MySqlPlugin.java) and [RestApiPlugin.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/restApiPlugin/src/main/java/com/external/plugins/RestApiPlugin.java).
5. The form to be filled by the user when creating a new datasource is rendered by the configuration file [form.json](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/firestorePlugin/src/main/resources/form.json). For details, please see [this mapping](https://github.com/appsmithorg/appsmith/tree/release/static/form.png) between `form.json` and the rendered web page.
6. The form where user enters the query for execution is rendered by the configuration file [editor.json](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/firestorePlugin/src/main/resources/editor.json).
   For details, please see [this mapping](https://github.com/appsmithorg/appsmith/tree/release/static/editor.png) 
   between `editor.json` and the rendered web page.

### Package Dependency
1. We use `Maven` to manage package dependencies, hence please add all your dependencies in `POM` file as shown in this 
   [pom.xml file](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/pom.xml) for postgreSQL plugin.
2. Always use release version of the packages or release candidate if the release version is not available. 
3. Build and test your code to check for any dependency conflicts and resolve them. 

### Source Code
1. Please name your file like `DbnamePlugin.java`, for example: [PostgresPlugin.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/main/java/com/external/plugins/PostgresPlugin.java).
2. When importing packages make sure that only those packages are imported that are used, and refrain from using `xyz.*`.
3. Refrain from using magic strings or magic numbers. Whenever possible, assign them to a `private static` identifier 
   for usage. For example, instead of using `"date"` string directly, assign it to a  `private static` identifier like `private static final String DATE_COLUMN_TYPE_NAME = "date";`
4. Appsmith's API server is powered by [Spring webflux](https://docs.spring.io/spring-framework/docs/current/reference/html/web-reactive.html#webflux) and hence expects programmers to 
   follow a [reactive model](https://www.reactive-streams.org/).
   - In case a reactive driver is available for the plugin that you want to add, please use it after verifying
     that it supports all of the commonly used data types. In case the reactive driver does not support enough data types,
     please use any other well known and trusted driver.
   - In case the driver that you wish to use does not follow reactive model, please enforce reactive model as shown 
     in the plugin code [PostgresPlugin.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/main/java/com/external/plugins/PostgresPlugin.java).
   - Make sure that your [Mono/Flux](https://projectreactor.io/docs/core/release/reference/index.html#core-features) 
     object is processed on a new dedicated thread by chaining [.subscribeOn(...)](https://projectreactor.io/docs/core/release/reference/index.html#schedulers) 
     method call to the Mono/Flux object. For reference, please check its usage in [PostgresPlugin.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/main/java/com/external/plugins/PostgresPlugin.java). 
5. Make sure to handle any exceptions
    - Always check for a stale connection (i.e. if the connection to the datasource has been closed or invalidated) 
      before query execution and throw an uncaught `StaleConnectionException`.
      This exception is caught by Appsmith's framework and a new connection is established before running the query. 
      For reference, please check the usage of StaleConnectionException in 
      [PostgresPlugin.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/main/java/com/external/plugins/PostgresPlugin.java).
    - Print the exceptions on console along with thread information like `System.out.println(Thread.currentThread().
      getName() + ": <your 
      error msg> : " + exception.msg);`
6. Always check for `null` values before using objects. 
7. Comment your code in hard to understand areas. 
8. In case your method implementation is too large (use your own judgement here), please refactor it into smaller 
   methods.

### Unit Test 
1. Every plugin must have its own unit test file like [PostgresPluginTest.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/test/java/com/external/plugins/PostgresPluginTest.java) for [PostgresPlugin.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/main/java/com/external/plugins/PostgresPlugin.java).
2. The test file must be named as `PluginNameTest.java` e.g. `PostgresPluginTest.java`
3. Use Mockito framework to test using mock objects whenever testing against a real instance is not possible, for 
   example, when using [testcontainers](https://www.testcontainers.org/) is not possible.
4. Please test the following cases in your unit test file:
    - Successfully establishing connection to the datasource. 
    - Reject invalid credentials.
    - Successful query execution.
    - Stale connection exception (please see the [Source Code](#source-code) section above for details). 
    - In case of a database plugin, test that it is able to fetch tables/collection information from database and key
      constraints information as well. For example, check out the `testStructure()` method in [PostgresPluginTest.
      java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/test/java/com/external/plugins/PostgresPluginTest.java).
5. Reference test files:
    - [PostgresPluginTest.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/postgresPlugin/src/test/java/com/external/plugins/PostgresPluginTest.java).
    - [MySqlPluginTest.java](https://github.com/appsmithorg/appsmith/blob/release/app/server/appsmith-plugins/mysqlPlugin/src/test/java/com/external/plugins/MySqlPluginTest.java).

### Code Review
1. Before you start working on a code change, please check with any of the maintainers regarding the same. You 
   may initiate a discussion on Github Discussions page or comment on any of the open issues or directly reach out on 
   our Discord channel. It will increase the chances of your pull request getting merged. 
2. Before you raise a pull request, please check if there is a bug that has been raised to address it. If not, then 
   raise a bug yourself and link it with your pull request.
3. You may share you pull request on Appsmith's discord channel or send an email to support@appsmith.com for attention.
4. Please be as descriptive as possible in the pull request's description section. Clearly mention how the code has 
   been tested. If possible, add snapshots too. 

### Need Assistance
- If you are unable to resolve any issue, please initiate a Github discussion or send an email to support@appsmith.com. We'll be happy to help you.
- In case you notice any discrepancy, please raise an issue on Github and/or send an email to support@appsmith.com.

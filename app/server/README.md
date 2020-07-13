# Appsmith Server

This is the server-side repo for the Appsmith framework.

### How to build 
```bash
$ ./build.sh <arguments>
```

For example:
```$bash
$ ./build.sh -DskipTests
```

This will 
1. Compile the code
2. Generate the jars for server & plugins
3. Copy them into the `dist` directory

### How to run
```
$ cd ./dist
$ java -jar -Dspring.profiles.active=$env server-1.0-SNAPSHOT.jar
```

### How to test
In order to test the code, you can run the following command

```
mvn clean package
```

Please make sure that you have a local Redis instance running for the test cases. The MongoDB is run in-memory during tests so that shouldn't be a problem.

## Running Server Codebase
- We use the Spring framework in Java for all backend development.
- We use `maven` as our build tool.
- We use pf4j as a library for plugins.
- We use MongoDB for our database.
- We use IntelliJ as our primary IDE for backend development

1. After cloning the repository, change your directory to `app/server`

2. Run the command  
```bash
  mvn clean compile
```  
  
This generates a bunch of classes required by IntelliJ for compiling the rest of the source code. Without this step, your IDE may complain about missing classes and will be unable to compile the code.

3. Create a copy of the `envs/dev.env.example` 

    ```shell script
    cp envs/dev.env.example .env
    ```

This command creates a `.env` file in the `app/server` folder. All run scripts pick up environment configuration from this file.

4. Modify the property values in the file `.env` to point to your local running instance of MongoDB and Redis.

5. In order to create the final JAR for the Appsmith server, run the command:
```
./build.sh
```

This command will create a `dist` folder which contains the final packaged jar along with multiple jars for the binaries for plugins as well.

6. Start the Java server by running

```
./scripts/start-dev-server.sh
```
By default, the server will start on port 8080.

7. When the server starts, it automatically runs migrations on MongoDB and will populate it with some initial required data.

8. You can check the status of the server by hitting the endpoint: [http://localhost:8080](http://localhost:8080) on your browser. By default you should see an blank page.

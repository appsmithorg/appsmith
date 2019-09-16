# Create the dist directory
mkdir -p dist/plugins

# Copy the server jar
cp ./appsmith-server/target/server-1.0-SNAPSHOT.jar dist/

# Copy all the plugins
cp ./appsmith-plugins/*/target/*.jar dist/plugins/

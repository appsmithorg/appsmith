# Create the dist directory
mkdir -p dist/plugins
mkdir -p plugins

# Copy the server jar
cp ./appsmith-server/target/server-1.0-SNAPSHOT.jar dist/
cp ./appsmith-server/target/server-1.0-SNAPSHOT.jar ./

# Copy all the plugins
cp ./appsmith-plugins/*/target/*.jar dist/plugins/
cp ./appsmith-plugins/*/target/*.jar plugins/

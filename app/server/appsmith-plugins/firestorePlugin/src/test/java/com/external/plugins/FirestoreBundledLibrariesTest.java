package com.external.plugins;

import org.junit.jupiter.api.Test;
import org.pf4j.ClassLoadingStrategy;
import org.pf4j.DefaultPluginDescriptor;
import org.pf4j.DefaultPluginManager;
import org.pf4j.PluginClassLoader;

import java.io.File;
import java.io.IOException;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.util.Set;
import java.util.concurrent.ConcurrentSkipListSet;

import static org.assertj.core.api.Assertions.assertThat;

/**
 * Creates a Firestore client through the plugin class loader that the server uses. The loader asks the server for a
 * class that the plugin does not have. A library that gets some of its classes from the server has two copies that do
 * not match, and creating a client fails.
 *
 * <p>The loader gets the runtime dependencies, which are the ones that the plugin jar contains. The build writes them to
 * {@code runtime-classpath.txt}. The test does not use the packaged jar.
 */
class FirestoreBundledLibrariesTest {

    /** Stands in for the server. Records the classes it is asked for and has none of them. */
    private static class RecordingServerClassLoader extends ClassLoader {

        private final Set<String> requestedClasses = new ConcurrentSkipListSet<>();

        RecordingServerClassLoader() {
            super(ClassLoader.getPlatformClassLoader());
        }

        @Override
        protected Class<?> findClass(String name) throws ClassNotFoundException {
            requestedClasses.add(name);
            throw new ClassNotFoundException(name);
        }
    }

    @Test
    void should_notAskTheServerForOpenTelemetryClasses_when_clientIsCreated() throws Exception {
        // Given
        // The server does not have this class either.
        String absentEverywhere = "io.opentelemetry.sdk.autoconfigure.AutoConfiguredOpenTelemetrySdk";
        RecordingServerClassLoader server = new RecordingServerClassLoader();
        DefaultPluginDescriptor descriptor =
                new DefaultPluginDescriptor("firestore-plugin", "", "", "1.0", "*", "", "");

        // When
        try (PluginClassLoader plugin =
                new PluginClassLoader(new DefaultPluginManager(), descriptor, server, ClassLoadingStrategy.PDA)) {
            for (String entry : runtimeClasspath()) {
                plugin.addFile(new File(entry));
            }
            createAndShutDownClient(plugin);
        }

        // Then
        assertThat(server.requestedClasses)
                .filteredOn(name -> name.startsWith("io.opentelemetry."))
                .isSubsetOf(absentEverywhere);
    }

    private static String[] runtimeClasspath() throws IOException {
        try (InputStream in = FirestoreBundledLibrariesTest.class.getResourceAsStream("/runtime-classpath.txt")) {
            assertThat(in)
                    .as("runtime-classpath.txt, which maven-dependency-plugin writes")
                    .isNotNull();
            return new String(in.readAllBytes(), StandardCharsets.UTF_8).trim().split(File.pathSeparator);
        }
    }

    private static void createAndShutDownClient(ClassLoader plugin) throws Exception {
        Class<?> credentials = plugin.loadClass("com.google.auth.Credentials");
        Object noCredentials = plugin.loadClass("com.google.cloud.NoCredentials")
                .getMethod("getInstance")
                .invoke(null);
        Object builder = plugin.loadClass("com.google.cloud.firestore.FirestoreOptions")
                .getMethod("newBuilder")
                .invoke(null);
        builder.getClass().getMethod("setCredentials", credentials).invoke(builder, noCredentials);
        builder.getClass().getMethod("setProjectId", String.class).invoke(builder, "test-project");
        Object options = builder.getClass().getMethod("build").invoke(builder);
        Object client = options.getClass().getMethod("getService").invoke(options);
        plugin.loadClass("com.google.cloud.firestore.Firestore")
                .getMethod("shutdown")
                .invoke(client);
    }
}

package com.appsmith.server.migrations;

import com.appsmith.server.domains.Plugin;
import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import org.bson.Document;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.testcontainers.containers.GenericContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import org.testcontainers.utility.DockerImageName;

import java.util.ArrayList;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class DatabaseChangelog1Test {

    @Container
    static final GenericContainer<?> MONGO =
            new GenericContainer<>(DockerImageName.parse("mongo:7.0.34")).withExposedPorts(27017);

    private static MongoClient mongoClient;

    @BeforeAll
    static void connect() {
        mongoClient = MongoClients.create("mongodb://" + MONGO.getHost() + ":" + MONGO.getMappedPort(27017));
    }

    @AfterAll
    static void close() {
        if (mongoClient != null) {
            mongoClient.close();
        }
    }

    @ParameterizedTest
    @ValueSource(ints = {0, 1, 2, 3})
    void should_keepOnePluginPerPackage_whenBootstrapIsRetriedBeforeInitialIndexes(int insertedPlugins) {
        // Given
        MongoTemplate mongoTemplate = new MongoTemplate(mongoClient, "bootstrap_retry_" + insertedPlugins);
        var collection = mongoTemplate.getCollection(mongoTemplate.getCollectionName(Plugin.class));
        List<String> packageNames = List.of("postgres-plugin", "restapi-plugin", "mongo-plugin");
        List<Document> existingPlugins = new ArrayList<>();
        // An interrupted first boot can leave any prefix of the plugins without a unique index.
        for (String packageName : packageNames.subList(0, insertedPlugins)) {
            Document plugin = new Document("packageName", packageName).append("name", "Existing " + packageName);
            collection.insertOne(plugin);
            existingPlugins.add(plugin);
        }
        DatabaseChangelog1 migration = new DatabaseChangelog1();

        // When
        migration.initialPlugins(mongoTemplate);
        migration.initialPlugins(mongoTemplate);
        migration.addInitialIndexes(mongoTemplate);

        // Then
        assertThat(mongoTemplate.findAll(Plugin.class))
                .extracting(Plugin::getPackageName)
                .containsExactlyInAnyOrderElementsOf(packageNames);
        for (Document existingPlugin : existingPlugins) {
            assertThat(collection
                            .find(new Document("_id", existingPlugin.get("_id")))
                            .first())
                    .isEqualTo(existingPlugin);
        }
    }
}

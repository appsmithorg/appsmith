package com.appsmith.server.configurations;

import com.mongodb.reactivestreams.client.ClientSession;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoCollection;
import de.flapdoodle.embed.mongo.spring.autoconfigure.EmbeddedMongoAutoConfiguration;
import org.bson.Document;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.MongoReactiveAutoConfiguration;
import org.springframework.boot.test.context.TestConfiguration;
import org.springframework.context.annotation.Import;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.context.junit.jupiter.SpringJUnitConfig;
import reactor.core.publisher.Mono;

import java.time.Duration;
import java.util.Locale;

import static org.assertj.core.api.Assertions.assertThat;

@SpringJUnitConfig(EmbeddedMongoTest.MongoTestConfig.class)
@TestPropertySource(locations = "classpath:application-test.properties")
class EmbeddedMongoTest {

    private static final Duration TIMEOUT = Duration.ofSeconds(15);

    @Autowired
    private MongoClient mongoClient;

    @Value("${de.flapdoodle.mongodb.embedded.version}")
    private String configuredVersion;

    @Test
    void configuredVersion_runsNativelyWithReplicaSet() {
        Document buildInfo = Mono.from(mongoClient.getDatabase("admin").runCommand(new Document("buildInfo", 1)))
                .block(TIMEOUT);
        assertThat(buildInfo).isNotNull();
        assertThat(buildInfo.getString("version")).isEqualTo(configuredVersion);

        String architecture = System.getProperty("os.arch").toLowerCase(Locale.ROOT);
        String mongoArchitecture =
                buildInfo.get("buildEnvironment", Document.class).getString("target_arch");
        if (architecture.equals("aarch64") || architecture.equals("arm64")) {
            assertThat(mongoArchitecture).isIn("aarch64", "arm64");
        } else if (architecture.equals("amd64") || architecture.equals("x86_64")) {
            assertThat(mongoArchitecture).isIn("x86_64", "amd64");
        } else {
            assertThat(mongoArchitecture).isEqualTo(architecture);
        }

        Document hello = Mono.from(mongoClient.getDatabase("admin").runCommand(new Document("hello", 1)))
                .block(TIMEOUT);
        assertThat(hello).containsEntry("setName", "appsmith-replica-set").containsEntry("isWritablePrimary", true);
    }

    @Test
    void replicaSet_supportsTransactionCommitAndAbort() {
        MongoCollection<Document> collection =
                mongoClient.getDatabase("embedded_mongo_smoke").getCollection("transactions");
        Mono.from(collection.insertOne(new Document("_id", "existing"))).block(TIMEOUT);
        try (ClientSession session = Mono.from(mongoClient.startSession()).block(TIMEOUT)) {
            assertThat(session).isNotNull();
            assertThat(Mono.from(collection.countDocuments()).block(TIMEOUT)).isEqualTo(1);

            session.startTransaction();
            Mono.from(collection.insertOne(session, new Document("_id", "committed")))
                    .block(TIMEOUT);
            Mono.from(session.commitTransaction()).block(TIMEOUT);
            assertThat(Mono.from(collection.countDocuments()).block(TIMEOUT)).isEqualTo(2);

            session.startTransaction();
            Mono.from(collection.insertOne(session, new Document("_id", "aborted")))
                    .block(TIMEOUT);
            assertThat(Mono.from(collection.countDocuments(session)).block(TIMEOUT))
                    .isEqualTo(3);
            Mono.from(session.abortTransaction()).block(TIMEOUT);
            assertThat(Mono.from(collection.countDocuments()).block(TIMEOUT)).isEqualTo(2);
            assertThat(Mono.from(collection.find(new Document("_id", "aborted")).first())
                            .block(TIMEOUT))
                    .isNull();
        } finally {
            Mono.from(collection.drop()).block(TIMEOUT);
        }
    }

    @TestConfiguration(proxyBeanMethods = false)
    @Import(TransactionalConfig.class)
    @ImportAutoConfiguration({
        EmbeddedMongoAutoConfiguration.class,
        MongoAutoConfiguration.class,
        MongoReactiveAutoConfiguration.class
    })
    static class MongoTestConfig {}
}

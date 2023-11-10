package com.external.plugins;

import com.mongodb.DBRef;
import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import com.mongodb.reactivestreams.client.MongoCollection;
import org.bson.Document;
import org.bson.types.BSONTimestamp;
import org.bson.types.Decimal128;
import org.testcontainers.containers.MongoDBContainer;
import org.testcontainers.utility.DockerImageName;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.math.BigDecimal;
import java.sql.Date;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;

public class MongoTestDBContainerManager {
    public static final String MONGO_DOCKER_HUB_CONTAINER = "mongo:4.4";

    public static MongoDBContainer getMongoDBForTest() {
        MongoDBContainer mongoDBContainer = new MongoDBContainer(DockerImageName.parse(MONGO_DOCKER_HUB_CONTAINER));
        mongoDBContainer.start();
        initialSetup(mongoDBContainer);
        return mongoDBContainer;
    }

    private static void initialSetup(MongoDBContainer mongoDBContainer) {
        String uri = "mongodb://" + mongoDBContainer.getHost() + ":" + mongoDBContainer.getFirstMappedPort();
        try (MongoClient mongoClient = MongoClients.create(uri)) {

            Flux.from(mongoClient.getDatabase("test").listCollectionNames())
                    .collectList()
                    .flatMap(collectionNamesList -> {
                        if (collectionNamesList.isEmpty()) {
                            final MongoCollection<Document> usersCollection =
                                    mongoClient.getDatabase("test").getCollection("users");
                            Mono.from(usersCollection.insertMany(List.of(
                                            new Document(Map.of(
                                                    "name",
                                                    "Cierra Vega",
                                                    "gender",
                                                    "F",
                                                    "age",
                                                    20,
                                                    "luckyNumber",
                                                    987654321L,
                                                    "dob",
                                                    LocalDate.of(2018, 12, 31),
                                                    "netWorth",
                                                    new BigDecimal("123456.789012"),
                                                    "updatedByCommand",
                                                    false)),
                                            new Document(Map.of(
                                                    "name",
                                                    "Alden Cantrell",
                                                    "gender",
                                                    "M",
                                                    "age",
                                                    30,
                                                    "dob",
                                                    new Date(0),
                                                    "netWorth",
                                                    Decimal128.parse("123456.789012"),
                                                    "updatedByCommand",
                                                    false,
                                                    "aLong",
                                                    9_000_000_000_000_000_000L,
                                                    "ts",
                                                    new BSONTimestamp(1421006159, 4))),
                                            new Document(Map.of("name", "Kierra Gentry", "gender", "F", "age", 40)))))
                                    .block();

                            final MongoCollection<Document> addressCollection =
                                    mongoClient.getDatabase("test").getCollection("address");
                            Mono.from(addressCollection.insertMany(List.of(
                                            new Document(Map.of(
                                                    "user", new DBRef("test", "users", "1"),
                                                    "street", "First Street",
                                                    "city", "Line One",
                                                    "state", "UP")),
                                            new Document(Map.of(
                                                    "user", new DBRef("AAA", "BBB", "2000"),
                                                    "street", "Second Street",
                                                    "city", "Line Two",
                                                    "state", "UP")))))
                                    .block();

                            final MongoCollection<Document> teamCollection =
                                    mongoClient.getDatabase("test").getCollection("teams");
                            Mono.from(teamCollection.insertMany(List.of(
                                            new Document(Map.of(
                                                    "name", "Noisy Neighbours 2",
                                                    "goals_allowed", "20",
                                                    "goals_forwarded", "41",
                                                    "goal_difference", "+21",
                                                    "xGD", "-2.5",
                                                    "best_scoreline", "5-2")),
                                            new Document(Map.of(
                                                    "name", "Red Side of the city",
                                                    "goals_allowed", "35",
                                                    "goals_forwarded", "28",
                                                    "goal_difference", "-7",
                                                    "xGD", "+3.6",
                                                    "best_scoreline", "8-3")))))
                                    .block();
                        }
                        return Mono.empty();
                    })
                    .block();
        }
    }
}

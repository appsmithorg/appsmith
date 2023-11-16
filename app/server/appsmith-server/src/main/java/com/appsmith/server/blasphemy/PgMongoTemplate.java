package com.appsmith.server.blasphemy;

import com.mongodb.reactivestreams.client.MongoClient;
import org.springframework.data.mongodb.ReactiveMongoDatabaseFactory;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;

import java.util.function.Consumer;

public class PgMongoTemplate extends ReactiveMongoTemplate {

    public PgMongoTemplate(MongoClient mongoClient, String databaseName) {
        super(mongoClient, databaseName);
    }

    public PgMongoTemplate(ReactiveMongoDatabaseFactory mongoDatabaseFactory) {
        super(mongoDatabaseFactory);
    }

    public PgMongoTemplate(ReactiveMongoDatabaseFactory mongoDatabaseFactory, MongoConverter mongoConverter) {
        super(mongoDatabaseFactory, mongoConverter);
    }

    public PgMongoTemplate(
            ReactiveMongoDatabaseFactory mongoDatabaseFactory,
            MongoConverter mongoConverter,
            Consumer<Throwable> subscriptionExceptionHandler) {
        super(mongoDatabaseFactory, mongoConverter, subscriptionExceptionHandler);
    }
}

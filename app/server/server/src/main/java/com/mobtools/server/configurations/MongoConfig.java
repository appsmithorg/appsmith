package com.mobtools.server.configurations;

import com.mongodb.reactivestreams.client.MongoClient;
import com.mongodb.reactivestreams.client.MongoClients;
import org.springframework.context.annotation.Bean;
import org.springframework.data.mongodb.config.AbstractReactiveMongoConfiguration;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.repository.config.EnableReactiveMongoRepositories;

@EnableReactiveMongoRepositories
public class MongoConfig extends AbstractReactiveMongoConfiguration {

    @Override
    public MongoClient reactiveMongoClient() {
        return MongoClients.create();
    }

    @Bean
    public ReactiveMongoTemplate reactiveMongoTemplate() throws Exception {
        return new ReactiveMongoTemplate(reactiveMongoClient(), "mobtools");
    }

    @Override
    protected String getDatabaseName() {
        return "mobtools";
    }
}

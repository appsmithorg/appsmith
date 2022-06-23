package com.appsmith.server.configurations;

import com.mongodb.client.MongoClient;
import com.mongodb.client.MongoClients;
import de.flapdoodle.embed.mongo.MongodExecutable;
import de.flapdoodle.embed.mongo.MongodStarter;
import de.flapdoodle.embed.mongo.config.ImmutableMongoCmdOptions;
import de.flapdoodle.embed.mongo.config.ImmutableMongodConfig;
import de.flapdoodle.embed.mongo.config.MongodConfig;
import de.flapdoodle.embed.mongo.config.Storage;
import de.flapdoodle.embed.mongo.distribution.Version;
import org.bson.Document;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class EmbeddedMongoConfig {
//    @Bean
//    public ImmutableMongodConfig prepareMongodConfig() throws IOException {
//        ImmutableMongodConfig mongoConfigConfig = MongodConfig.builder()
//                .version(Version.Main.V4_2)
//                //.replication(new Storage("/tmp", "rs0", 5000))
//                .build();
//
////        MongodExecutable mongodExecutable = MongodStarter.getDefaultInstance().prepare(mongoConfig);
////        mongodExecutable.start();
//
//        // init replica set, aka rs.initiate()
////        MongoClient client = MongoClients.create("mongodb://localhost");
////        client.getDatabase("admin").runCommand(new Document("replSetInitiate", new Document()));
////        client.close();
//        return mongoConfigConfig;
//    }

    @Bean(destroyMethod = "stop")
    public MongodExecutable mongodExecutable1() throws IOException {
        Storage storage = new Storage(null, "rs0", 0);
        ImmutableMongodConfig mongodConfig = MongodConfig
                .builder()
                .version(Version.Main.PRODUCTION)
                .replication(storage)
                .cmdOptions(ImmutableMongoCmdOptions.builder().useNoJournal(false).build())
                .build();

        MongodStarter starter = MongodStarter.getDefaultInstance();

        MongodExecutable executable = starter.prepare(mongodConfig);
        executable.start();

        try (MongoClient client = MongoClients.create("mongodb://localhost:27018")) { //  + host + ":" + port
            client.getDatabase("admin").runCommand(new Document("replSetInitiate", new Document()));
        }

        return executable;
    }
}

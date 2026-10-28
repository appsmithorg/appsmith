package com.appsmith.server.configurations;

import de.flapdoodle.embed.mongo.commands.MongodArguments;
import de.flapdoodle.embed.mongo.config.Storage;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class TransactionalConfig {

    @Bean
    MongodArguments mongodArguments() {
        return MongodArguments.builder()
                .replication(Storage.of("appsmith-replica-set", 10))
                // On CI runners with MongoDB 6.0 and later, transaction commits and index builds on this
                // single-node replica set wait about 100 ms for a journal flush at the default interval.
                // A 1 ms interval removes most of that wait.
                .putArgs("--journalCommitInterval", "1")
                .build();
    }
}

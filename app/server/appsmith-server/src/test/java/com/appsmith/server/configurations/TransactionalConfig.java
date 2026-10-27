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
                // On MongoDB 6.0 and later, transaction commits and index builds on this single-node
                // replica set wait for the next journal flush. The default 100 ms flush interval makes
                // each of them take about 100 ms, which doubles the test run time.
                .putArgs("--journalCommitInterval", "1")
                .build();
    }
}

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
                .build();
    }
}

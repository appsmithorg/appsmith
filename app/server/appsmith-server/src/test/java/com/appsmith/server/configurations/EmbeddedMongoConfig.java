package com.appsmith.server.configurations;

import de.flapdoodle.embed.mongo.config.ImmutableMongodConfig;
import de.flapdoodle.embed.mongo.config.MongodConfig;
import de.flapdoodle.embed.mongo.distribution.Version;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.io.IOException;

@Configuration
public class EmbeddedMongoConfig {
    @Bean
    public ImmutableMongodConfig prepareMongodConfig() throws IOException {
        ImmutableMongodConfig mongoConfigConfig = MongodConfig.builder()
                .version(Version.Main.V4_2)
                .build();
        return mongoConfigConfig;
    }
}

package com.appsmith.server.configurations;

import java.io.IOException;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import de.flapdoodle.embed.mongo.config.ImmutableMongoCmdOptions;
import de.flapdoodle.embed.mongo.config.ImmutableMongodConfig;
import de.flapdoodle.embed.mongo.config.MongoCmdOptions;
import de.flapdoodle.embed.mongo.config.MongodConfig;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.process.runtime.Network;

@Configuration
public class EmbeddedMongoConfig {
    public static int mongodPort;
    public static String defaultHost = "localhost";
    static {
        try {
            mongodPort = Network.getFreeServerPort();
        } catch (IOException e) {
            e.printStackTrace();
        }
    }

    @Bean
    public ImmutableMongodConfig prepareMongodConfig() throws IOException {
        ImmutableMongoCmdOptions cmdOptions = MongoCmdOptions.builder()
                .build();

        ImmutableMongodConfig mongoConfigConfig = MongodConfig.builder()
                .version(Version.Main.V4_2)
                .net(new Net(mongodPort, Network.localhostIsIPv6()))
                .cmdOptions(cmdOptions)
                .build();
        return mongoConfigConfig;
    }
}

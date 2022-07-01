package com.appsmith.server.configurations;

import de.flapdoodle.embed.mongo.config.ImmutableMongodConfig;
import de.flapdoodle.embed.mongo.config.MongoCmdOptions;
import de.flapdoodle.embed.mongo.config.MongodConfig;
import de.flapdoodle.embed.mongo.config.Net;
import de.flapdoodle.embed.mongo.config.Storage;
import de.flapdoodle.embed.mongo.distribution.Version;
import de.flapdoodle.embed.process.runtime.Network;
import org.springframework.boot.autoconfigure.AutoConfigureBefore;
import org.springframework.boot.autoconfigure.condition.ConditionalOnMissingBean;
import org.springframework.boot.autoconfigure.mongo.MongoProperties;
import org.springframework.boot.autoconfigure.mongo.embedded.EmbeddedMongoAutoConfiguration;
import org.springframework.boot.autoconfigure.mongo.embedded.EmbeddedMongoProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.repository.MongoRepository;

import java.io.IOException;
import java.net.InetAddress;
import java.net.UnknownHostException;
import java.util.UUID;

/**
 * Overrides the default configuration to enable journaling.
 * Most of the code is copied from {@link EmbeddedMongoAutoConfiguration}
 * Ref doc: https://blog.devgenius.io/how-to-enable-replica-set-in-embbedded-mongo-with-spring-boot-ddeaa079c1c8
 *
 * @see EmbeddedMongoAutoConfiguration
 */
@Configuration
@AutoConfigureBefore(EmbeddedMongoAutoConfiguration.class)
@EnableConfigurationProperties({MongoProperties.class, EmbeddedMongoProperties.class})
public class EmbeddedMongoConfig {

    /**
     * Ref {@link EmbeddedMongoAutoConfiguration}
     */
    private static final byte[] IP4_LOOPBACK_ADDRESS = {127, 0, 0, 1};

    /**
     * Ref {@link EmbeddedMongoAutoConfiguration}
     */
    private static final byte[] IP6_LOOPBACK_ADDRESS = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1};

    private final MongoProperties properties;

    public EmbeddedMongoConfig(MongoProperties properties) {
        this.properties = properties;
    }

    /**
     * Overrides the default embedded mongo configuration to enable journaling.
     *
     * @return Mongod configuration which is used to set up the embedded mongo server as well as the mongo clients
     * ({@link MongoRepository}, {@link MongoTemplate}, etc.)
     */
    @Bean
    @ConditionalOnMissingBean
    public MongodConfig embeddedMongoConfiguration(EmbeddedMongoProperties embeddedProperties) throws IOException {
        ImmutableMongodConfig.Builder builder = MongodConfig.builder().version(Version.Main.V4_4);
        EmbeddedMongoProperties.Storage storage = embeddedProperties.getStorage();
        if (storage != null) {
            String databaseDir = storage.getDatabaseDir();
            String replSetName = storage.getReplSetName() == null ? "appsmith-replica-set" + UUID.randomUUID() : storage.getReplSetName();
            int oplogSize = (storage.getOplogSize() != null) ? (int) storage.getOplogSize().toMegabytes() : 0;
            builder.replication(new Storage(databaseDir, replSetName, oplogSize));

            // This line enables the required journaling.
            builder.cmdOptions(MongoCmdOptions.builder().useNoJournal(false).build());
        }
        Integer configuredPort = this.properties.getPort();
        if (configuredPort != null && configuredPort > 0) {
            builder.net(new Net(getHost().getHostAddress(), configuredPort, Network.localhostIsIPv6()));
        } else {
            builder.net(new Net(getHost().getHostAddress(), Network.getFreeServerPort(getHost()),
                    Network.localhostIsIPv6()));
        }
        return builder.build();
    }

    /**
     * Ref {@link EmbeddedMongoAutoConfiguration}
     */
    private InetAddress getHost() throws UnknownHostException {
        if (this.properties.getHost() == null) {
            return InetAddress.getByAddress(Network.localhostIsIPv6() ? IP6_LOOPBACK_ADDRESS : IP4_LOOPBACK_ADDRESS);
        }
        return InetAddress.getByName(this.properties.getHost());
    }
}
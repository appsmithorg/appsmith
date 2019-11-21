package com.appsmith.server.configurations;

import com.appsmith.server.dtos.InstallPluginRedisDTO;
import com.appsmith.server.services.PluginService;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.listener.ChannelTopic;
import org.springframework.data.redis.listener.ReactiveRedisMessageListenerContainer;
import reactor.core.publisher.Mono;

import java.util.concurrent.CancellationException;

@Configuration
@Slf4j
public class RedisListenerConfig {

    private final ObjectMapper objectMapper;
    private final PluginService pluginService;
    private final ChannelTopic topic;

    @Autowired
    public RedisListenerConfig(ObjectMapper objectMapper, PluginService pluginService, ChannelTopic topic) {
        this.objectMapper = objectMapper;
        this.pluginService = pluginService;
        this.topic = topic;
    }

    /**
     * This is the listener that will receive all the messages from the Redis channel topic configured in topic().
     * Currently the only topic we are listening to is for install plugin requests.
     *
     * @param factory
     * @return
     */
    @Bean
    public ReactiveRedisMessageListenerContainer container(ReactiveRedisConnectionFactory factory) {
        ReactiveRedisMessageListenerContainer container = new ReactiveRedisMessageListenerContainer(factory);
        container
                // The receive function can subscribe to multiple topics as well. Can also subscribe via regex pattern
                // to multiple channels
                .receive(topic)
                // Extract the message from the incoming object. By default it's String serialization. The receive() fxn
                // can also configure different serialization classes based on requirements
                .map(p -> p.getMessage())
                .map(msg -> {
                    try {
                        InstallPluginRedisDTO installPluginRedisDTO = objectMapper.readValue(msg, InstallPluginRedisDTO.class);
                        return installPluginRedisDTO;
                    } catch (Exception e) {
                        log.error("", e);
                        return Mono.error(e);
                    }
                })
                // Actual processing of the message.
                .map(redisPluginObj -> pluginService.redisInstallPlugin((InstallPluginRedisDTO) redisPluginObj))
                // Handle this error because it prevents the Redis connection from shutting down when the server is shut down
                // TODO: Verify if this is invoked in normal redis pubsub execution as well
                .doOnError(throwable -> {
                    if (!(throwable instanceof CancellationException)) {
                        // The Reactive RedisListener doesn't shut down properly. Hence, only printing errors for
                        // ones that are not of type CancellationException
                        log.error("Error occurred in RedisListenerConfig: ", throwable);
                    }
                })
                // Required to subscribe else this chain is never invoked
                .subscribe();
        return container;
    }

}

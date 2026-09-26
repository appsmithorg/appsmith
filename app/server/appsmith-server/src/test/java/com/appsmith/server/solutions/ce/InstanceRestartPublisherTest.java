package com.appsmith.server.solutions.ce;

import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ConfigService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

class InstanceRestartPublisherTest {

    private ConfigService configService;

    private ReactiveRedisConnectionFactory redis;

    private InstanceRestartPublisher publisher;

    @BeforeEach
    void setup() {
        configService = mock(ConfigService.class);
        redis = mock(ReactiveRedisConnectionFactory.class);
        publisher = new InstanceRestartPublisher(configService, redis);
    }

    @Test
    void publish_whenInstanceIdMissing_errorsWithoutUsingRedis() {
        when(configService.getInstanceId()).thenReturn(Mono.empty());

        StepVerifier.create(publisher.publish())
                .expectErrorSatisfies(error -> assertInternalServerError(error))
                .verify();

        verifyNoInteractions(redis);
    }

    @ParameterizedTest
    @ValueSource(strings = {"", " ", "\t"})
    void publish_whenInstanceIdBlank_errorsWithoutUsingRedis(String instanceId) {
        when(configService.getInstanceId()).thenReturn(Mono.just(instanceId));

        StepVerifier.create(publisher.publish())
                .expectErrorSatisfies(error -> assertInternalServerError(error))
                .verify();

        verifyNoInteractions(redis);
    }

    @Test
    void publish_whenRedisFails_errors() {
        LettuceClientConfiguration client = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofMillis(500))
                .build();
        LettuceConnectionFactory unreachable =
                new LettuceConnectionFactory(new RedisStandaloneConfiguration("127.0.0.1", 1), client);
        unreachable.afterPropertiesSet();
        try {
            InstanceRestartPublisher failingPublisher = new InstanceRestartPublisher(configService, unreachable);
            when(configService.getInstanceId()).thenReturn(Mono.just("instance-a"));

            StepVerifier.create(failingPublisher.publish())
                    .expectErrorSatisfies(error -> assertInternalServerError(error))
                    .verify(Duration.ofSeconds(5));
        } finally {
            unreachable.destroy();
        }
    }

    @Test
    void channel_isScopedByInstanceId() {
        assertThat(InstanceRestartChannel.forInstance("instance-a")).isEqualTo("instance-restart:instance-a");
        assertThat(InstanceRestartChannel.PAYLOAD).isEqualTo("restart");
    }

    private static void assertInternalServerError(Throwable error) {
        assertThat(error).isInstanceOf(AppsmithException.class);
        assertThat(((AppsmithException) error).getError()).isEqualTo(AppsmithError.INTERNAL_SERVER_ERROR);
    }
}

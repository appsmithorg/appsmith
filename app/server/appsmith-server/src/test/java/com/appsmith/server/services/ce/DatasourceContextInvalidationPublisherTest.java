package com.appsmith.server.services.ce;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.services.ConfigService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.Arguments;
import org.junit.jupiter.params.provider.MethodSource;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import org.springframework.data.redis.connection.RedisStandaloneConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceClientConfiguration;
import org.springframework.data.redis.connection.lettuce.LettuceConnectionFactory;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatasourceContextInvalidationPublisherTest {

    @Mock
    private ConfigService configService;

    @Mock
    private ReactiveRedisConnectionFactory connectionFactory;

    private DatasourceContextInvalidationPublisher publisher;

    @BeforeEach
    void setup() {
        publisher = new DatasourceContextInvalidationPublisher(configService, connectionFactory, new ObjectMapper());
    }

    @Test
    void should_scopeChannelByInstanceId() {
        // Given
        String instanceId = "instance-a";

        // When
        String channel = DatasourceContextInvalidationChannel.forInstance(instanceId);

        // Then
        assertThat(channel).isEqualTo("datasource-context-invalidation:instance-a");
    }

    @Test
    void should_completeEmptyWithoutUsingRedis_when_instanceIdMissing() {
        // Given
        when(configService.getInstanceId()).thenReturn(Mono.empty());

        // When
        Mono<Long> result = publisher.publish(storage("ds-1", "env-1", "plugin-1"));

        // Then
        StepVerifier.create(result).verifyComplete();
        verifyNoInteractions(connectionFactory);
    }

    @ParameterizedTest(name = "{0}")
    @MethodSource("storagesMissingAnId")
    void should_completeEmptyWithoutUsingRedis_when_anIdIsBlank(String label, DatasourceStorage datasourceStorage) {
        // When
        Mono<Long> result = publisher.publish(datasourceStorage);

        // Then
        StepVerifier.create(result).verifyComplete();
        verifyNoInteractions(connectionFactory, configService);
    }

    static Stream<Arguments> storagesMissingAnId() {
        List<Arguments> cases = new ArrayList<>();
        for (String blank : new String[] {null, "", " "}) {
            String shown = blank == null ? "null" : "'" + blank + "'";
            cases.add(Arguments.of("datasourceId " + shown, storage(blank, "env-1", "plugin-1")));
            cases.add(Arguments.of("environmentId " + shown, storage("ds-1", blank, "plugin-1")));
            cases.add(Arguments.of("pluginId " + shown, storage("ds-1", "env-1", blank)));
        }
        return cases.stream();
    }

    @Test
    void should_putOnlyIdsOnTheWire_when_serializingMessage() throws Exception {
        // Given
        DatasourceStorage datasourceStorage = storage("ds-1", "env-1", "plugin-1");
        DatasourceConfiguration configuration = new DatasourceConfiguration();
        DBAuth auth = new DBAuth();
        auth.setUsername("app_user");
        auth.setPassword("do-not-broadcast");
        configuration.setAuthentication(auth);
        datasourceStorage.setDatasourceConfiguration(configuration);
        ObjectMapper objectMapper = new ObjectMapper();

        // When
        String payload = objectMapper.writeValueAsString(DatasourceContextInvalidationMessage.from(datasourceStorage));

        // Then
        JsonNode json = objectMapper.readTree(payload);
        List<String> fields = new ArrayList<>();
        json.fieldNames().forEachRemaining(fields::add);
        assertThat(fields).containsExactlyInAnyOrder("datasourceId", "environmentId", "pluginId");
        assertThat(payload).doesNotContain("do-not-broadcast").doesNotContain("app_user");
    }

    @Test
    void should_completeEmptyWithoutError_when_redisUnreachable() {
        // Given
        LettuceClientConfiguration client = LettuceClientConfiguration.builder()
                .commandTimeout(Duration.ofMillis(500))
                .build();
        LettuceConnectionFactory unreachable =
                new LettuceConnectionFactory(new RedisStandaloneConfiguration("127.0.0.1", 1), client);
        unreachable.afterPropertiesSet();
        try {
            DatasourceContextInvalidationPublisher failingPublisher =
                    new DatasourceContextInvalidationPublisher(configService, unreachable, new ObjectMapper());
            when(configService.getInstanceId()).thenReturn(Mono.just("instance-a"));

            // When
            Mono<Long> result = failingPublisher.publish(storage("ds-1", "env-1", "plugin-1"));

            // Then
            StepVerifier.create(result).expectComplete().verify(Duration.ofSeconds(5));
        } finally {
            unreachable.destroy();
        }
    }

    private static DatasourceStorage storage(String datasourceId, String environmentId, String pluginId) {
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(environmentId);
        datasourceStorage.setPluginId(pluginId);
        return datasourceStorage;
    }
}

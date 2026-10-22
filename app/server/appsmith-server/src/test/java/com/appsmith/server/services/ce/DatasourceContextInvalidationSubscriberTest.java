package com.appsmith.server.services.ce;

import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.DatasourceContextService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.redis.connection.ReactiveRedisConnectionFactory;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DatasourceContextInvalidationSubscriberTest {

    private static final String VALID_PAYLOAD =
            "{\"datasourceId\":\"ds-1\",\"environmentId\":\"env-1\",\"pluginId\":\"plugin-1\"}";

    @Mock
    private ReactiveRedisConnectionFactory connectionFactory;

    @Mock
    private ConfigService configService;

    @Mock
    private DatasourceContextService datasourceContextService;

    private DatasourceContextInvalidationSubscriber subscriber;

    @BeforeEach
    void setup() {
        subscriber = new DatasourceContextInvalidationSubscriber(
                connectionFactory, configService, datasourceContextService, new ObjectMapper());
    }

    @Test
    void should_deleteDatasourceContextForMessageIds_when_payloadValid() {
        // Given
        when(datasourceContextService.deleteDatasourceContext(any())).thenReturn(Mono.empty());

        // When
        StepVerifier.create(subscriber.handleMessage(VALID_PAYLOAD)).verifyComplete();

        // Then
        ArgumentCaptor<DatasourceStorage> captor = ArgumentCaptor.forClass(DatasourceStorage.class);
        verify(datasourceContextService).deleteDatasourceContext(captor.capture());
        assertThat(captor.getValue().getDatasourceId()).isEqualTo("ds-1");
        assertThat(captor.getValue().getEnvironmentId()).isEqualTo("env-1");
        assertThat(captor.getValue().getPluginId()).isEqualTo("plugin-1");
    }

    @Test
    void should_deleteDatasourceContext_when_payloadHasUnknownFields() {
        // Given
        when(datasourceContextService.deleteDatasourceContext(any())).thenReturn(Mono.empty());
        String payload =
                "{\"datasourceId\":\"ds-1\",\"environmentId\":\"env-1\",\"pluginId\":\"plugin-1\",\"requestId\":\"later\"}";

        // When
        StepVerifier.create(subscriber.handleMessage(payload)).verifyComplete();

        // Then
        verify(datasourceContextService).deleteDatasourceContext(any());
    }

    @Test
    void should_skipDelete_when_payloadMalformed() {
        // Given
        String payload = "not-json";

        // When
        StepVerifier.create(subscriber.handleMessage(payload)).verifyComplete();

        // Then
        verifyNoInteractions(datasourceContextService);
    }

    @Test
    void should_skipDelete_when_payloadMissesDatasourceId() {
        // Given
        String payload = "{\"environmentId\":\"env-1\",\"pluginId\":\"plugin-1\"}";

        // When
        StepVerifier.create(subscriber.handleMessage(payload)).verifyComplete();

        // Then
        verifyNoInteractions(datasourceContextService);
    }

    @Test
    void should_complete_when_deleteFails() {
        // Given
        when(datasourceContextService.deleteDatasourceContext(any()))
                .thenReturn(Mono.error(new AppsmithException(AppsmithError.INTERNAL_SERVER_ERROR)));

        // When
        Mono<Void> result = subscriber.handleMessage(VALID_PAYLOAD);

        // Then
        StepVerifier.create(result).verifyComplete();
    }
}

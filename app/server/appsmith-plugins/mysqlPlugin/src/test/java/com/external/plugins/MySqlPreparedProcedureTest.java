package com.external.plugins;

import com.appsmith.external.configurations.connectionpool.ConnectionPoolConfig;
import com.appsmith.external.datatypes.ClientDataType;
import com.appsmith.external.dtos.ExecuteActionDTO;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.ConnectionContext;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Param;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.fasterxml.jackson.databind.JsonNode;
import io.micrometer.observation.ObservationRegistry;
import io.r2dbc.pool.ConnectionPool;
import io.r2dbc.spi.Result;
import org.junit.jupiter.api.AfterAll;
import org.junit.jupiter.api.BeforeAll;
import org.junit.jupiter.api.Test;
import org.testcontainers.containers.MariaDBContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.Arrays;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@Testcontainers
class MySqlPreparedProcedureTest {

    @Container
    static final MariaDBContainer<?> database = new MariaDBContainer<>("mariadb:11.4");

    private static final MySqlPlugin.MySqlPluginExecutor executor = new MySqlPlugin.MySqlPluginExecutor(
            new ConnectionPoolConfig() {
                @Override
                public Mono<Integer> getMaxConnectionPoolSize() {
                    return Mono.just(5);
                }

                @Override
                public Mono<Integer> getSocketTimeoutSeconds() {
                    return Mono.just(60);
                }
            },
            ObservationRegistry.NOOP);

    private static ConnectionContext<ConnectionPool> connectionContext;
    private static DatasourceConfiguration datasourceConfiguration;

    @BeforeAll
    static void setUp() {
        DBAuth authentication = new DBAuth();
        authentication.setAuthType(DBAuth.Type.USERNAME_PASSWORD);
        authentication.setUsername(database.getUsername());
        authentication.setPassword(database.getPassword());
        authentication.setDatabaseName(database.getDatabaseName());

        Endpoint endpoint = new Endpoint();
        endpoint.setHost(database.getHost());
        endpoint.setPort((long) database.getMappedPort(3306));

        datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setAuthentication(authentication);
        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setProperties(Arrays.asList(null, new Property("Connection method", "Standard")));
        Connection datasourceConnection = new Connection();
        SSLDetails ssl = new SSLDetails();
        ssl.setAuthType(SSLDetails.AuthType.DEFAULT);
        datasourceConnection.setSsl(ssl);
        datasourceConfiguration.setConnection(datasourceConnection);

        connectionContext = executor.datasourceCreate(datasourceConfiguration).block();
        Mono.usingWhen(
                        connectionContext.getConnection().create(),
                        connection -> Flux.from(connection
                                        .createStatement("CREATE PROCEDURE echo_value(IN input_value VARCHAR(255)) "
                                                + "SELECT input_value AS echoed")
                                        .execute())
                                .flatMap(Result::getRowsUpdated)
                                .then(),
                        io.r2dbc.spi.Connection::close)
                .block();
    }

    @AfterAll
    static void tearDown() {
        if (connectionContext != null) {
            connectionContext.getConnection().dispose();
        }
    }

    @Test
    void should_returnProcedureRowsAndBindValue_when_preparedCallHasFollowingSelect() {
        // Given
        String value = "x'); DROP TABLE users; --";
        ActionConfiguration action = new ActionConfiguration();
        action.setBody("CALL echo_value({{ value }}); SELECT 1+1;");
        action.setPluginSpecifiedTemplates(List.of(new Property("preparedStatement", true)));

        Param param = new Param();
        param.setKey("value");
        param.setValue(value);
        param.setClientDataType(ClientDataType.STRING);
        ExecuteActionDTO execution = new ExecuteActionDTO();
        execution.setParams(List.of(param));

        // When
        Mono<JsonNode> result = executor.executeParameterized(
                        connectionContext, execution, datasourceConfiguration, action)
                .map(response -> {
                    assertThat(response.getIsExecutionSuccess()).isTrue();
                    assertThat(response.getRequest().getProperties().get("preparedStatement"))
                            .isEqualTo(true);
                    return (JsonNode) response.getBody();
                });

        // Then
        StepVerifier.create(result)
                .assertNext(body -> {
                    assertThat(body.findValuesAsText("echoed")).contains(value);
                    assertThat(body.findValuesAsText("1+1")).contains("2");
                })
                .verifyComplete();
    }
}

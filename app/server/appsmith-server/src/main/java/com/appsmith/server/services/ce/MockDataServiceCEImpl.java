package com.appsmith.server.services.ce;

import com.appsmith.external.constants.AnalyticsEvents;
import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.CloudServicesResponseDTO;
import com.appsmith.server.dtos.MockDataCredentials;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSource;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.util.WebClientUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.apache.commons.lang.ObjectUtils.defaultIfNull;

@Slf4j
@RequiredArgsConstructor
public class MockDataServiceCEImpl implements MockDataServiceCE {

    private final CloudServicesConfig cloudServicesConfig;
    private final DatasourceService datasourceService;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;

    public MockDataDTO mockData = new MockDataDTO();

    private Instant cacheExpiryTime = null;

    @Override
    public Mono<MockDataDTO> getMockDataSet() {
        if (cacheExpiryTime != null && Instant.now().isBefore(cacheExpiryTime)) {
            return Mono.justOrEmpty(mockData);
        }

        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (!StringUtils.hasLength(baseUrl)) {
            return Mono.justOrEmpty(mockData);
        }

        return WebClientUtils.create(baseUrl + "/api/v1/mocks")
                .get()
                .retrieve()
                .onRawStatus(
                        status -> status < 200 || status >= 300,
                        response -> Mono.error(new AppsmithException(
                                AppsmithError.CLOUD_SERVICES_ERROR,
                                "Unable to connect to cloud-services with error status {0}",
                                response.statusCode())))
                .bodyToMono(new ParameterizedTypeReference<CloudServicesResponseDTO<MockDataDTO>>() {})
                .map(CloudServicesResponseDTO::data)
                .map(data -> {
                    mockData = data;
                    cacheExpiryTime = Instant.now().plusSeconds(2 * 60 * 60);
                    return data;
                })
                .doOnError(error -> log.error("Error fetching mock data sets config from cloud services", error));
    }

    @Override
    public Mono<Datasource> createMockDataSet(MockDataSource mockDataSource, String environmentId) {

        Mono<MockDataDTO> mockDataSet;
        if (cacheExpiryTime == null || !Instant.now().isBefore(cacheExpiryTime)) {
            mockDataSet = getMockDataSet();
        } else {
            mockDataSet = Mono.just(mockData);
        }
        return mockDataSet.flatMap(mockDataDTO -> {
            DatasourceConfiguration datasourceConfiguration;
            String name = mockDataSource.getName();
            if (mockDataSource.getPackageName().equals("mongo-plugin")) {
                datasourceConfiguration = getMongoDataSourceConfiguration(mockDataSource.getName(), mockDataDTO);
            } else {
                datasourceConfiguration = getPostgresDataSourceConfiguration(mockDataSource.getName(), mockDataDTO);
            }
            if (datasourceConfiguration.getAuthentication() == null) {
                return Mono.error(new AppsmithException(
                        AppsmithError.INVALID_PARAMETER,
                        " Couldn't find any mock datasource with the given name - " + mockDataSource.getName()));
            }
            Datasource datasource = new Datasource();
            datasource.setIsMock(true);
            datasource.setWorkspaceId(mockDataSource.getWorkspaceId());
            datasource.setPluginId(mockDataSource.getPluginId());
            datasource.setName(mockDataSource.getName());

            HashMap<String, DatasourceStorageDTO> storages = new HashMap<>();

            return datasourceService
                    .getTrueEnvironmentId(
                            mockDataSource.getWorkspaceId(), environmentId, mockDataSource.getPluginId(), null)
                    .flatMap(trueEnvironmentId -> {
                        storages.put(
                                trueEnvironmentId,
                                new DatasourceStorageDTO(null, trueEnvironmentId, datasourceConfiguration));
                        datasource.setDatasourceStorages(storages);

                        return addAnalyticsForMockDataCreation(name, mockDataSource.getWorkspaceId())
                                .then(createSuffixedDatasource(datasource, trueEnvironmentId));
                    });
        });
    }

    private DatasourceConfiguration getMongoDataSourceConfiguration(String name, MockDataDTO mockDataSet) {

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        DBAuth auth = new DBAuth();
        Property property = new Property();
        List<Property> listProperty = new ArrayList<>();
        SSLDetails sslDetails = new SSLDetails();

        Optional<MockDataCredentials> credentialsList = mockDataSet.getCredentials().stream()
                .filter(cred -> cred.getDbname().equalsIgnoreCase(name))
                .findFirst();
        if (Boolean.TRUE.equals(credentialsList.isEmpty())) {
            return datasourceConfiguration;
        }

        MockDataCredentials credentials = credentialsList.get();
        property.setKey("Use mongo connection string URI");
        property.setValue("Yes");
        listProperty.add(property);
        property = new Property();
        property.setKey("Connection string URI");
        property.setValue(credentials.getHost());
        listProperty.add(property);
        sslDetails.setAuthType(SSLDetails.AuthType.DEFAULT);

        connection.setSsl(sslDetails);
        connection.setMode(Connection.Mode.READ_WRITE);
        connection.setType(Connection.Type.DIRECT);

        auth.setAuthType(DBAuth.Type.SCRAM_SHA_1);
        auth.setDatabaseName(credentials.getDbname());
        auth.setPassword(credentials.getPassword());
        auth.setUsername(credentials.getUsername());

        datasourceConfiguration.setProperties(listProperty);
        datasourceConfiguration.setConnection(connection);
        datasourceConfiguration.setAuthentication(auth);
        return datasourceConfiguration;
    }

    private DatasourceConfiguration getPostgresDataSourceConfiguration(String name, MockDataDTO mockDataSet) {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        DBAuth auth = new DBAuth();
        SSLDetails sslDetails = new SSLDetails();
        Endpoint endpoint = new Endpoint();
        List<Endpoint> endpointList = new ArrayList<>();

        Optional<MockDataCredentials> credentialsList = mockDataSet.getCredentials().stream()
                .filter(cred -> cred.getDbname().equalsIgnoreCase(name))
                .findFirst();
        if (Boolean.TRUE.equals(credentialsList.isEmpty())) {
            return datasourceConfiguration;
        }

        MockDataCredentials credentials = credentialsList.get();
        sslDetails.setAuthType(SSLDetails.AuthType.DEFAULT);
        connection.setSsl(sslDetails);
        connection.setMode(Connection.Mode.READ_WRITE);
        endpoint.setHost(credentials.getHost());
        endpointList.add(endpoint);

        auth.setDatabaseName(credentials.getDbname());
        auth.setPassword(credentials.getPassword());
        auth.setUsername(credentials.getUsername());

        datasourceConfiguration.setConnection(connection);
        datasourceConfiguration.setAuthentication(auth);
        datasourceConfiguration.setEndpoints(endpointList);
        return datasourceConfiguration;
    }

    private Mono<Datasource> createSuffixedDatasource(Datasource datasource, String environmentId) {
        return createSuffixedDatasource(datasource, datasource.getName(), environmentId, 0);
    }

    /**
     * Tries to create the given datasource with the name, over and over again with an incremented suffix, but **only**
     * if the error is because of a name clash.
     *
     * @param datasource Datasource to try to create.
     * @param name       Name of the datasource, to which numbered suffixes will be appended.
     * @param suffix     Suffix used for appending, recursion artifact. Usually set to 0.
     * @return A Mono that yields the created datasource.
     */
    private Mono<Datasource> createSuffixedDatasource(
            Datasource datasource, String name, String environmentId, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        datasource.setName(actualName);
        String password = null;
        DatasourceStorageDTO datasourceStorageDTO =
                datasource.getDatasourceStorages().get(environmentId);
        if (datasourceStorageDTO.getDatasourceConfiguration().getAuthentication() instanceof DBAuth) {
            password =
                    ((DBAuth) datasourceStorageDTO.getDatasourceConfiguration().getAuthentication()).getPassword();
        }
        final String finalPassword = password;
        return datasourceService.create(datasource).onErrorResume(DuplicateKeyException.class, error -> {
            if (error.getMessage() != null
                    && error.getMessage().contains("workspace_datasource_deleted_compound_index")
                    && datasourceStorageDTO.getDatasourceConfiguration().getAuthentication() instanceof DBAuth) {
                ((DBAuth) datasourceStorageDTO.getDatasourceConfiguration().getAuthentication())
                        .setPassword(finalPassword);
                return createSuffixedDatasource(datasource, name, environmentId, 1 + suffix);
            }
            throw error;
        });
    }

    private Mono<User> addAnalyticsForMockDataCreation(String name, String workspaceId) {
        if (!analyticsService.isActive()) {
            return Mono.empty();
        }

        return sessionUserService.getCurrentUser().flatMap(user -> analyticsService
                .sendEvent(
                        AnalyticsEvents.CREATE.getEventName(),
                        user.getUsername(),
                        Map.of(
                                "MockDataSource",
                                defaultIfNull(name, ""),
                                "workspaceId",
                                defaultIfNull(workspaceId, "")))
                .thenReturn(user));
    }
}

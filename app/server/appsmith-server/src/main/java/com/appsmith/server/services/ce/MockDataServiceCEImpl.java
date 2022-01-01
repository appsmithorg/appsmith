package com.appsmith.server.services.ce;

import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.constants.AnalyticsEvents;
import com.appsmith.server.domains.User;
import com.appsmith.server.dtos.MockDataCredentials;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSource;
import com.appsmith.server.dtos.ResponseDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.SessionUserService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.apache.commons.lang.ObjectUtils.defaultIfNull;

@Slf4j
public class MockDataServiceCEImpl implements MockDataServiceCE {

    private final CloudServicesConfig cloudServicesConfig;
    private final DatasourceService datasourceService;
    private final AnalyticsService analyticsService;
    private final SessionUserService sessionUserService;

    public MockDataDTO mockData = new MockDataDTO();

    private Instant cacheExpiryTime = null;

    @Autowired
    public MockDataServiceCEImpl(CloudServicesConfig cloudServicesConfig,
                                 DatasourceService datasourceService,
                                 AnalyticsService analyticsService,
                                 SessionUserService sessionUserService) {
        this.cloudServicesConfig = cloudServicesConfig;
        this.datasourceService = datasourceService;
        this.analyticsService = analyticsService;
        this.sessionUserService = sessionUserService;
    }

    @Override
    public Mono<MockDataDTO> getMockDataSet() {
        if (cacheExpiryTime != null && Instant.now().isBefore(cacheExpiryTime)) {
            return Mono.justOrEmpty(mockData);
        }

        final String baseUrl = cloudServicesConfig.getBaseUrl();
        if (StringUtils.isEmpty(baseUrl)) {
            return Mono.justOrEmpty(mockData);
        }

        return WebClient
                .create(baseUrl + "/api/v1/mocks")
                .get()
                .exchange()
                .flatMap(response -> {
                    if (response.statusCode().is2xxSuccessful()) {
                        return response.bodyToMono(new ParameterizedTypeReference<ResponseDTO<MockDataDTO>>() {
                        });
                    } else {
                        return Mono.error(new AppsmithException(
                                AppsmithError.CLOUD_SERVICES_ERROR,
                                "Unable to connect to cloud-services with error status {}", response.statusCode()));
                    }
                })
                .map(ResponseDTO::getData)
                .map(config -> {
                    mockData = config;
                    cacheExpiryTime = Instant.now().plusSeconds(2 * 60 * 60);
                    return config;
                })
                .doOnError(error -> log.error("Error fetching mock data sets config from cloud services", error));

    }

    @Override
    public Mono<Datasource> createMockDataSet(MockDataSource mockDataSource) {

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
            if( datasourceConfiguration.getAuthentication() == null) {
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER,
                        " Couldn't find any mock datasource with the given name - " + mockDataSource.getName()));
            }
            Datasource datasource = new Datasource();
            datasource.setOrganizationId(mockDataSource.getOrganizationId());
            datasource.setPluginId(mockDataSource.getPluginId());
            datasource.setName(mockDataSource.getName());
            datasource.setDatasourceConfiguration(datasourceConfiguration);
            return addAnalyticsForMockDataCreation(name, mockDataSource.getOrganizationId())
                    .then(createSuffixedDatasource(datasource));
        });

    }

    private DatasourceConfiguration getMongoDataSourceConfiguration(String name, MockDataDTO mockDataSet) {

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        DBAuth auth = new DBAuth();
        Property property = new Property();
        List<Property> listProperty = new ArrayList<>();
        SSLDetails sslDetails = new SSLDetails();

        Optional<MockDataCredentials> credentialsList = mockDataSet.getCredentials().stream().filter(cred -> cred.getDbname().equalsIgnoreCase(name)).findFirst();
        if(Boolean.TRUE.equals(credentialsList.isEmpty())) {
            return datasourceConfiguration;
        }

        MockDataCredentials credentials = credentialsList.get();
        property.setKey("Use Mongo Connection String URI");
        property.setValue("Yes");
        listProperty.add(property);
        property = new Property();
        property.setKey("Connection String URI");
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

        Optional<MockDataCredentials> credentialsList = mockDataSet.getCredentials().stream().filter(cred -> cred.getDbname().equalsIgnoreCase(name)).findFirst();
        if(Boolean.TRUE.equals(credentialsList.isEmpty())) {
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

    private Mono<Datasource> createSuffixedDatasource(Datasource datasource) {
        return createSuffixedDatasource(datasource, datasource.getName(), 0);
    }

    /**
     * Tries to create the given datasource with the name, over and over again with an incremented suffix, but **only**
     * if the error is because of a name clash.
     * @param datasource Datasource to try create.
     * @param name Name of the datasource, to which numbered suffixes will be appended.
     * @param suffix Suffix used for appending, recursion artifact. Usually set to 0.
     * @return A Mono that yields the created datasource.
     */
    private Mono<Datasource> createSuffixedDatasource(Datasource datasource, String name, int suffix) {
        final String actualName = name + (suffix == 0 ? "" : " (" + suffix + ")");
        datasource.setName(actualName);
        String password = null;
        if( datasource.getDatasourceConfiguration().getAuthentication() instanceof DBAuth) {
            password = ((DBAuth) datasource.getDatasourceConfiguration().getAuthentication()).getPassword();
        }
        final String finalPassword = password;
        return datasourceService.create(datasource)
                .onErrorResume(DuplicateKeyException.class, error -> {
                    if (error.getMessage() != null
                            && error.getMessage().contains("organization_datasource_deleted_compound_index")
                            && datasource.getDatasourceConfiguration().getAuthentication() instanceof DBAuth) {
                        ((DBAuth) datasource.getDatasourceConfiguration().getAuthentication()).setPassword(finalPassword);
                        return createSuffixedDatasource(datasource, name, 1 + suffix);
                    }
                    throw error;
                });
    }

    private Mono<User> addAnalyticsForMockDataCreation(String name, String orgId) {
        if (!analyticsService.isActive()) {
            return Mono.empty();
        }

        return sessionUserService.getCurrentUser()
                .map(user -> {
                    analyticsService.sendEvent(
                            AnalyticsEvents.CREATE.getEventName(),
                            user.getUsername(),
                            Map.of(
                                    "MockDataSource", defaultIfNull(name, ""),
                                    "orgId", defaultIfNull(orgId, "")
                            )
                    );
                    return user;
                });
    }

}

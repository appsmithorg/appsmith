package com.appsmith.server.services;

import com.appsmith.external.models.Connection;
import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.Property;
import com.appsmith.external.models.SSLDetails;
import com.appsmith.server.configurations.CloudServicesConfig;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.dtos.MockDataCredentials;
import com.appsmith.server.dtos.MockDataDTO;
import com.appsmith.server.dtos.MockDataSource;
import com.appsmith.server.dtos.ResponseDTO;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.reactive.function.client.WebClient;
import reactor.core.publisher.Mono;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.stream.Collectors;

@Slf4j
@Service
public class MockDataServiceImpl implements MockDataService {

    private final CloudServicesConfig cloudServicesConfig;
    private final DatasourceService datasourceService;

    public MockDataDTO mockData = new MockDataDTO();

    private Instant cacheExpiryTime = null;

    @Autowired
    public MockDataServiceImpl(CloudServicesConfig cloudServicesConfig, DatasourceService datasourceService) {
        this.cloudServicesConfig = cloudServicesConfig;
        this.datasourceService = datasourceService;
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

        return  WebClient
                .create( baseUrl + "/api/v1/mocks")
                .get()
                .exchange()
                .flatMap(response -> response.bodyToMono(new ParameterizedTypeReference<ResponseDTO<MockDataDTO>>() {}))
                .map(result -> result.getData())
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
            if (mockDataSource.getPluginName().equals("mongo-plugin")) {
                datasourceConfiguration = getMongoDataSourceConfiguration(mockDataSource.getName(), mockDataDTO);
            } else {
                datasourceConfiguration = getPostgresDataSourceConfiguration(mockDataSource.getName(), mockDataDTO);
            }
            Datasource datasource = new Datasource();
            datasource.setOrganizationId(mockDataSource.getOrganizationId());
            datasource.setPluginId(mockDataSource.getPluginId());
            datasource.setName(mockDataSource.getName().toUpperCase(Locale.ROOT)+" - Mock");
            datasource.setDatasourceConfiguration(datasourceConfiguration);
            return datasourceService.create(datasource);
        });

    }

    private DatasourceConfiguration getMongoDataSourceConfiguration(String name, MockDataDTO mockDataSet) {

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Connection connection = new Connection();
        DBAuth auth = new DBAuth();
        Property property = new Property();
        List<Property> listProperty = new ArrayList<>();
        SSLDetails sslDetails = new SSLDetails();

        MockDataCredentials credentials = mockDataSet.getCredentials().stream().filter(cred -> cred.getDbname().equals(name)).collect(Collectors.toList()).get(0);

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

        MockDataCredentials credentials = mockDataSet.getCredentials().stream().filter( cred -> cred.getDbname().equals(name)).collect(Collectors.toList()).get(0);

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

}

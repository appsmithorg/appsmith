package com.appsmith.server.services.ee;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.AppsmithDomain;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.Property;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.repositories.CustomDatasourceRepository;
import com.appsmith.server.services.DatasourceStorageService;
import com.appsmith.server.services.VariableReplacementService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
@DirtiesContext
public class DatasourceStorageServiceTest {

    @Autowired
    DatasourceStorageService datasourceStorageService;

    @MockBean
    VariableReplacementService variableReplacementService;

    @MockBean
    CustomDatasourceRepository customDatasourceRepository;

    @Test
    public void testServerSideVariableReplacement() {
        String testHeaderKey = "test-header";
        Property testHeader = new Property(testHeaderKey, "<<variable>>");
        DatasourceConfiguration testConfigurations = new DatasourceConfiguration();
        testConfigurations.setHeaders(List.of(testHeader));
        Datasource testDatasource = new Datasource();
        testDatasource.setId("testDatasourceId");
        testDatasource.setDatasourceConfiguration(testConfigurations);

        ActionDTO testActionDTO = new ActionDTO();
        testActionDTO.setDatasource(testDatasource);
        String renderedValue = "Server Rendered Value";
        Property renderedHeader = new Property(testHeaderKey, renderedValue);
        DatasourceConfiguration renderedConfiguration = new DatasourceConfiguration();
        renderedConfiguration.setHeaders(List.of(renderedHeader));

        Mockito.when(variableReplacementService.replaceValue(Mockito.any())).thenReturn(Mono.just(renderedValue));
        Mockito.when(variableReplacementService.replaceAll(Mockito.any(AppsmithDomain.class)))
                .thenReturn(Mono.just(renderedConfiguration));
        Mockito.when(customDatasourceRepository.findById(Mockito.anyString(), Mockito.any(AclPermission.class)))
                .thenReturn(Mono.just(testDatasource));

        Mono<DatasourceStorage> renderedDatasourceStorageMono = datasourceStorageService
                .findByDatasourceAndEnvironmentIdForExecution(testDatasource, null);

        StepVerifier.create(renderedDatasourceStorageMono)
                .assertNext(datasourceStorage -> {
                    assertThat(datasourceStorage).isNotNull();
                    assertThat(datasourceStorage.getDatasourceConfiguration()).isNotNull();
                    assertThat(datasourceStorage.getDatasourceConfiguration().getHeaders()).isNotEmpty();
                    assertThat(datasourceStorage.getDatasourceConfiguration().getHeaders().get(0).getKey()).isEqualTo(testHeaderKey);
                    assertThat(datasourceStorage.getDatasourceConfiguration().getHeaders().get(0).getValue()).isEqualTo(renderedValue);
                })
                .verifyComplete();
    }
}

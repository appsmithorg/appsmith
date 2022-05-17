package com.appsmith.server.repositories;

import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.helpers.PolicyUtils;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;

@RunWith(SpringRunner.class)
@SpringBootTest
public class CustomDatasourceRepositoryTest {

    @Autowired
    private DatasourceRepository datasourceRepository;

    @Autowired
    private PolicyUtils policyUtils;

    private Datasource createDatasource(String name, String organizationId) {
        Datasource datasource = new Datasource();
        datasource.setPluginId("test-plugin-id");
        datasource.setOrganizationId(organizationId);
        datasource.setName(name);
        Map<String, Policy> policyMap = policyUtils.generatePolicyFromPermission(Set.of(AclPermission.READ_DATASOURCES), "api_user");
        datasource.setPolicies(Set.copyOf(policyMap.values()));
        return datasource;
    }

    @Test
    @WithUserDetails("api_user")
    public void findAllByOrganizationId_WhenDatasourceExists_SortedByName() {
        String organizationId = UUID.randomUUID().toString();
        List<Datasource> datasourceList = List.of(
                createDatasource("B Datasource", organizationId),
                createDatasource("A Datasource", organizationId),
                createDatasource("C Datasource", organizationId)
        );
        Mono<List<Datasource>> listMono = datasourceRepository.saveAll(datasourceList)
                .thenMany(datasourceRepository.findAllByOrganizationId(organizationId, AclPermission.READ_DATASOURCES))
                .collectList();

        StepVerifier.create(listMono).assertNext(datasources -> {
            assertThat(datasources.size()).isEqualTo(3);
            assertThat(datasources.get(0).getName()).isEqualTo("A Datasource");
            assertThat(datasources.get(1).getName()).isEqualTo("B Datasource");
            assertThat(datasources.get(2).getName()).isEqualTo("C Datasource");
        }).verifyComplete();
    }
}
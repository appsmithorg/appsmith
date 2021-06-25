package com.appsmith.server.solutions;

import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.DatasourceStructure.Column;
import com.appsmith.external.models.DatasourceStructure.Key;
import com.appsmith.external.models.DatasourceStructure.Table;
import com.appsmith.external.models.DatasourceStructure.TableType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Datasource;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.domains.Organization;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.dtos.CRUDPageResourceDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.repositories.PluginRepository;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.OrganizationService;
import lombok.extern.slf4j.Slf4j;
import org.junit.Before;
import org.junit.Test;
import org.junit.runner.RunWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.annotation.DirtiesContext;
import org.springframework.test.context.junit4.SpringRunner;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.ArrayList;
import java.util.List;
import java.util.Set;

import static org.assertj.core.api.Assertions.assertThat;

@Slf4j
@RunWith(SpringRunner.class)
@SpringBootTest
@DirtiesContext
public class CreateDBTablePageSolutionTests {

    @Autowired
    CreateDBTablePageSolution solution;

    @Autowired
    OrganizationService organizationService;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    PluginRepository pluginRepository;

    @MockBean
    private PluginExecutorHelper pluginExecutorHelper;

    CRUDPageResourceDTO resource = new CRUDPageResourceDTO();

    Datasource testDatasource = new Datasource();

    Organization testOrg;

    Application testApp;

    private Plugin installedPlugin;

    @Before
    @WithUserDetails(value = "api_user")
    public void setup() {

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));
        installedPlugin = pluginRepository.findByPackageName("installed-plugin").block();

        Organization organization = new Organization();
        organization.setName("Create-DB-Table-Page-Org");
        testOrg = organizationService.create(organization).block();

        Application testApplication = new Application();
        testApplication.setName("DB-Table-Page-Test-Application");
        testApplication.setOrganizationId(testOrg.getId());
        testApp = applicationPageService.createApplication(testApplication, testOrg.getId()).block();

        DatasourceStructure structure = new DatasourceStructure();
        List<Key> keys = List.of(new DatasourceStructure.PrimaryKey("pKey", List.of("id")));
        List<Column> columns = List.of(
            new Column("testId", "type1", null),
            new Column("testField1", "type2", null),
            new Column("testField2", "type3", null)
        );
        List<Table> tables = List.of(new Table(TableType.TABLE, "", "sampleTable", columns, keys, new ArrayList<>()));
        structure.setTables(tables);
        testDatasource.setPluginId(installedPlugin.getId());
        testDatasource.setOrganizationId(testOrg.getId());
        testDatasource.setName("CRUD-Page-Table-DS");
        testDatasource.setStructure(structure);
        datasourceService.create(testDatasource).block();

        resource.setTableName(testDatasource.getStructure().getTables().get(0).getName());
        resource.setDatasourceId(testDatasource.getId());
        resource.setColumnNames(Set.of("id", "field1", "field2", "field3"));

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidApplicationIdTest() {
        
        Mono<PageDTO> resultMono = solution.createPageFromDBTable(testApp.getPages().get(0).getId(), resource);

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(FieldName.APPLICATION_ID)))
            .verify();

    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithInvalidRequestBodyTest() {
        Mono<PageDTO> resultMono = solution.createPageFromDBTable(testApp.getPages().get(0).getId(), new CRUDPageResourceDTO());

        StepVerifier
            .create(resultMono)
            .expectErrorMatches(throwable -> throwable instanceof AppsmithException &&
                throwable.getMessage().equals(AppsmithError.INVALID_PARAMETER.getMessage(", tableName and datasourceId must be present")))
            .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithNullPageId() {

        resource.setApplicationId(testApp.getId());
        Mono<PageDTO> resultMono = solution.createPageFromDBTable(null, resource);

        StepVerifier
            .create(resultMono)
            .assertNext(page -> {
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).containsIgnoringCase("Admin Page:");
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                assertThat(layout.getId()).isNotNull();
                assertThat(layout.getWidgetNames()).isNotEmpty();
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();
            })
            .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void createPageWithValidPageId() {

        resource.setApplicationId(testApp.getId());
        PageDTO newPage = new PageDTO();
        newPage.setApplicationId(testApp.getId());
        newPage.setName("crud-admin-page");

        Mono<PageDTO> resultMono = applicationPageService.createPage(newPage)
            .flatMap(savedPage -> solution.createPageFromDBTable(savedPage.getId(), resource));

        StepVerifier
            .create(resultMono)
            .assertNext(page -> {
                Layout layout = page.getLayouts().get(0);
                assertThat(page.getName()).isEqualTo(newPage.getName());
                assertThat(page.getLayouts()).isNotEmpty();
                assertThat(layout.getDsl()).isNotEmpty();
                assertThat(layout.getLayoutOnLoadActions()).hasSize(1);
                assertThat(layout.getId()).isNotNull();
                assertThat(layout.getWidgetNames()).isNotEmpty();
                assertThat(layout.getActionsUsedInDynamicBindings()).isNotEmpty();
            })
            .verifyComplete();
    }
}

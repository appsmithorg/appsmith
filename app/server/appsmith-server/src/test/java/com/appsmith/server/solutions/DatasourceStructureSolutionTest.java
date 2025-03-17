package com.appsmith.server.solutions;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceStorageStructure;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.models.OAuth2;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.applications.base.ApplicationService;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceStructureService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.dao.DuplicateKeyException;
import org.springframework.security.test.context.support.WithUserDetails;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.List;

import static com.appsmith.external.models.DatasourceStructure.TableType.TABLE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doReturn;

@SpringBootTest
@Slf4j
public class DatasourceStructureSolutionTest {

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    UserService userService;

    @Autowired
    PluginService pluginService;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    @MockBean
    PluginExecutor pluginExecutor;

    @SpyBean
    DatasourceService datasourceService;

    @SpyBean
    DatasourceStorageService datasourceStorageService;

    @Autowired
    DatasourcePermission datasourcePermission;

    @SpyBean
    DatasourceStructureService datasourceStructureService;

    @SpyBean
    DatasourceContextService datasourceContextService;

    @SpyBean
    DatasourceStructureSolution datasourceStructureSolution;

    @Autowired
    EnvironmentPermission environmentPermission;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    ApplicationPermission applicationPermission;

    String workspaceId;

    String defaultEnvironmentId;

    String datasourceId;

    @BeforeEach
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("DatasourceServiceTest");

        Workspace workspace =
                workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
        workspaceId = workspace.getId();
        defaultEnvironmentId = workspaceService
                .getDefaultEnvironmentId(workspaceId, environmentPermission.getExecutePermission())
                .block();

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = createDatasourceObject("sampleDS", workspaceId, "postgres-plugin");
        datasource.getDatasourceStorages().put(defaultEnvironmentId, generateSampleDatasourceStorageDTO());
        Datasource createdDatasource = datasourceService.create(datasource).block();
        datasourceId = createdDatasource.getId();
    }

    @AfterEach
    public void cleanup() {
        List<Application> deletedApplications = applicationPermission
                .getDeletePermission()
                .flatMapMany(permission -> applicationService.findByWorkspaceId(workspaceId, permission))
                .flatMap(remainingApplication -> applicationPageService.deleteApplication(remainingApplication.getId()))
                .collectList()
                .block();
        Workspace deletedWorkspace = workspaceService.archiveById(workspaceId).block();
    }

    private Datasource createDatasourceObject(String name, String workspaceId, String pluginName) {
        Datasource datasource = new Datasource();
        datasource.setName(name);
        datasource.setWorkspaceId(workspaceId);
        Plugin plugin = pluginService.findByPackageName(pluginName).block();
        datasource.setPluginName(pluginName);
        datasource.setPluginId(plugin.getId());
        return datasource;
    }

    private DatasourceStorageDTO generateSampleDatasourceStorageDTO() {
        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        Endpoint endpoint = new Endpoint("https://sample.endpoint", 5432L);
        DBAuth dbAuth = new DBAuth();
        dbAuth.setPassword("password");
        dbAuth.setUsername("username");
        dbAuth.setDatabaseName("databaseName");

        datasourceConfiguration.setEndpoints(List.of(endpoint));
        datasourceConfiguration.setAuthentication(dbAuth);

        DatasourceStorageDTO datasourceStorageDTO = new DatasourceStorageDTO();
        datasourceStorageDTO.setEnvironmentId(defaultEnvironmentId);
        datasourceStorageDTO.setDatasourceConfiguration(datasourceConfiguration);
        return datasourceStorageDTO;
    }

    private DatasourceStructure generateDatasourceStructureObject() {
        DatasourceStructure.Column[] table1Columns = {
            new DatasourceStructure.Column("_id1", "ObjectId", null, true),
            new DatasourceStructure.Column("age1", "Integer", null, false),
            new DatasourceStructure.Column("dob1", "Date", null, false),
            new DatasourceStructure.Column("gender1", "String", null, false),
            new DatasourceStructure.Column("luckyNumber1", "Long", null, false),
            new DatasourceStructure.Column("name1", "String", null, false),
            new DatasourceStructure.Column("netWorth1", "BigDecimal", null, false),
            new DatasourceStructure.Column("updatedByCommand1", "Object", null, false),
        };

        DatasourceStructure.Table table1 =
                new DatasourceStructure.Table(TABLE, null, "Table1", List.of(table1Columns), null, null);

        DatasourceStructure.Column[] table2Columns = {
            new DatasourceStructure.Column("_id2", "ObjectId", null, true),
            new DatasourceStructure.Column("age2", "Integer", null, false),
            new DatasourceStructure.Column("dob2", "Date", null, false),
            new DatasourceStructure.Column("gender2", "String", null, false),
            new DatasourceStructure.Column("luckyNumber2", "Long", null, false),
            new DatasourceStructure.Column("name2", "String", null, false),
            new DatasourceStructure.Column("netWorth2", "BigDecimal", null, false),
            new DatasourceStructure.Column("updatedByCommand2", "Object", null, false),
        };

        DatasourceStructure.Table table2 =
                new DatasourceStructure.Table(TABLE, null, "Table2", List.of(table2Columns), null, null);

        return new DatasourceStructure(List.of(table1, table2));
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyGenerateNewStructureWhenNotPresent() {
        doReturn(Mono.just(generateDatasourceStructureObject()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        Mono<DatasourceStructure> datasourceStructureMono =
                datasourceStructureSolution.getStructure(datasourceId, Boolean.FALSE, defaultEnvironmentId);

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    assertThat(datasourceStructure.getTables()).hasSize(2);
                    assertThat(datasourceStructure.getTables().get(0).getName()).isEqualTo("Table1");
                    assertThat(datasourceStructure.getTables().get(1).getName()).isEqualTo("Table2");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUseCachedStructureWhenStructurePresent() {
        doReturn(Mono.just(generateDatasourceStructureObject()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        datasourceStructureSolution
                .getStructure(datasourceId, Boolean.TRUE, defaultEnvironmentId)
                .block();

        doReturn(Mono.just(new DatasourceStructure()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        Mono<DatasourceStructure> datasourceStructureMono =
                datasourceStructureSolution.getStructure(datasourceId, Boolean.FALSE, defaultEnvironmentId);

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    assertThat(datasourceStructure.getTables()).hasSize(2);
                    assertThat(datasourceStructure.getTables().get(0).getName()).isEqualTo("Table1");
                    assertThat(datasourceStructure.getTables().get(1).getName()).isEqualTo("Table2");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUseNewStructureWhenIgnoreCacheSetTrue() {
        doReturn(Mono.just(new DatasourceStructure()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        datasourceStructureSolution
                .getStructure(datasourceId, Boolean.TRUE, defaultEnvironmentId)
                .block();

        doReturn(Mono.just(generateDatasourceStructureObject()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        Mono<DatasourceStructure> datasourceStructureMono =
                datasourceStructureSolution.getStructure(datasourceId, Boolean.TRUE, defaultEnvironmentId);

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    assertThat(datasourceStructure.getTables()).hasSize(2);
                    assertThat(datasourceStructure.getTables().get(0).getName()).isEqualTo("Table1");
                    assertThat(datasourceStructure.getTables().get(1).getName()).isEqualTo("Table2");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyDatasourceStorageStructureGettingSaved() {
        doReturn(Mono.just(generateDatasourceStructureObject()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        datasourceStructureSolution
                .getStructure(datasourceId, Boolean.TRUE, defaultEnvironmentId)
                .block();

        Mono<DatasourceStorageStructure> datasourceStorageStructureMono =
                datasourceStructureService.getByDatasourceIdAndEnvironmentId(datasourceId, defaultEnvironmentId);

        StepVerifier.create(datasourceStorageStructureMono)
                .assertNext(datasourceStorageStructure -> {
                    assertThat(datasourceStorageStructure.getDatasourceId()).isEqualTo(datasourceId);
                    assertThat(datasourceStorageStructure.getEnvironmentId()).isEqualTo(defaultEnvironmentId);
                    assertThat(datasourceStorageStructure.getStructure()).isNotNull();
                    DatasourceStructure datasourceStructure = datasourceStorageStructure.getStructure();
                    assertThat(datasourceStructure.getTables()).hasSize(2);
                    assertThat(datasourceStructure.getTables().get(0).getName()).isEqualTo("Table1");
                    assertThat(datasourceStructure.getTables().get(1).getName()).isEqualTo("Table2");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyCaseWhereNoEnvironmentProvided() {
        doReturn(Mono.just(generateDatasourceStructureObject()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        Mono<DatasourceStructure> datasourceStructureMono =
                datasourceStructureSolution.getStructure(datasourceId, Boolean.FALSE, null);

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    assertThat(datasourceStructure.getTables()).hasSize(2);
                    assertThat(datasourceStructure.getTables().get(0).getName()).isEqualTo("Table1");
                    assertThat(datasourceStructure.getTables().get(1).getName()).isEqualTo("Table2");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyUseCachedStructureWhenStructurePresentWithNoEnvironment() {
        doReturn(Mono.just(generateDatasourceStructureObject()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        // Null defaults to default environment
        datasourceStructureSolution
                .getStructure(datasourceId, Boolean.TRUE, null)
                .block();

        doReturn(Mono.just(new DatasourceStructure()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        // Null defaults to default environment
        // will work as expected
        Mono<DatasourceStructure> datasourceStructureMono =
                datasourceStructureSolution.getStructure(datasourceId, Boolean.FALSE, null);

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    assertThat(datasourceStructure.getTables()).hasSize(2);
                    assertThat(datasourceStructure.getTables().get(0).getName()).isEqualTo("Table1");
                    assertThat(datasourceStructure.getTables().get(1).getName()).isEqualTo("Table2");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyEmptyStructureForPluginsWithNoGetStructureImplementation() {
        OAuth2 oAuth2 = new OAuth2();
        oAuth2.setGrantType(OAuth2.Type.CLIENT_CREDENTIALS);
        oAuth2.setAccessTokenUrl("https://mock.code/ouath2/token");
        oAuth2.setClientId("clientId");
        oAuth2.setClientSecret("clientSecret");

        DatasourceConfiguration datasourceConfiguration = new DatasourceConfiguration();
        datasourceConfiguration.setUrl("https://mock.codes");
        datasourceConfiguration.setAuthentication(oAuth2);

        DatasourceStorageDTO datasourceStorageDTO = new DatasourceStorageDTO();
        datasourceStorageDTO.setEnvironmentId(defaultEnvironmentId);
        datasourceStorageDTO.setDatasourceConfiguration(datasourceConfiguration);

        Datasource datasource = createDatasourceObject("restapi", workspaceId, "restapi-plugin");
        datasource.getDatasourceStorages().put(defaultEnvironmentId, datasourceStorageDTO);

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource savedDatasource = datasourceService.create(datasource).block();
        Mono<DatasourceStructure> datasourceStructureMono =
                datasourceStructureSolution.getStructure(savedDatasource.getId(), Boolean.FALSE, null);

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    assertThat(datasourceStructure.getTables()).isNull();
                    assertThat(datasourceStructure.getError()).isNull();
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyDatasourceStorageStructureEntriesWithTwoEnvironmentId() {
        doReturn(Mono.just(generateDatasourceStructureObject()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        // creating an entry with environmentId as randomId and then
        datasourceStructureService
                .saveStructure(datasourceId, "randomId", generateDatasourceStructureObject())
                .block();

        datasourceStructureSolution
                .getStructure(datasourceId, Boolean.FALSE, defaultEnvironmentId)
                .block();

        Mono<DatasourceStorageStructure> datasourceStorageStructureMono =
                datasourceStructureService.getByDatasourceIdAndEnvironmentId(datasourceId, defaultEnvironmentId);

        StepVerifier.create(datasourceStorageStructureMono)
                .assertNext(datasourceStorageStructure -> {
                    assertThat(datasourceStorageStructure.getDatasourceId()).isEqualTo(datasourceId);
                    assertThat(datasourceStorageStructure.getEnvironmentId()).isEqualTo(defaultEnvironmentId);
                })
                .verifyComplete();

        Mono<DatasourceStorageStructure> datasourceStorageStructureMonoWithRandomEnvironmentId =
                datasourceStructureService.getByDatasourceIdAndEnvironmentId(datasourceId, "randomId");

        StepVerifier.create(datasourceStorageStructureMonoWithRandomEnvironmentId)
                .assertNext(datasourceStorageStructure -> {
                    assertThat(datasourceStorageStructure.getDatasourceId()).isEqualTo(datasourceId);
                    assertThat(datasourceStorageStructure.getEnvironmentId()).isEqualTo("randomId");
                })
                .verifyComplete();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyDuplicateKeyErrorOnSave() {
        doReturn(Mono.just(generateDatasourceStructureObject()))
                .when(datasourceContextService)
                .retryOnce(any(), any());

        datasourceStructureSolution
                .getStructure(datasourceId, Boolean.FALSE, defaultEnvironmentId)
                .block();

        DatasourceStorageStructure datasourceStorageStructure = new DatasourceStorageStructure();
        datasourceStorageStructure.setDatasourceId(datasourceId);
        datasourceStorageStructure.setEnvironmentId(defaultEnvironmentId);
        datasourceStorageStructure.setStructure(new DatasourceStructure());

        Mono<DatasourceStorageStructure> datasourceStorageStructureMono =
                datasourceStructureService.save(datasourceStorageStructure);

        StepVerifier.create(datasourceStorageStructureMono).verifyErrorSatisfies(error -> {
            assertThat(error).isInstanceOf(DuplicateKeyException.class);
        });
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void verifyEmptyDatasourceStructureObjectIfDatasourceIsInvalid() {
        DatasourceStorage datasourceStorage = new DatasourceStorage();
        datasourceStorage.setDatasourceId(datasourceId);
        datasourceStorage.setEnvironmentId(defaultEnvironmentId);
        datasourceStorage.setDatasourceConfiguration(new DatasourceConfiguration());
        datasourceStorage.setInvalids(new HashSet<>());
        datasourceStorage.getInvalids().add("random invalid");

        doReturn(Mono.just(datasourceStorage))
                .when(datasourceStorageService)
                .findByDatasourceAndEnvironmentId(any(), any());

        Mono<DatasourceStructure> datasourceStructureMono =
                datasourceStructureSolution.getStructure(datasourceId, Boolean.FALSE, defaultEnvironmentId);

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    assertThat(datasourceStructure.getTables()).isNull();
                    assertThat(datasourceStructure.getError()).isNull();
                })
                .verifyComplete();
    }
}

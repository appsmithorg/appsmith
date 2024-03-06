package com.appsmith.server.solutions.ee.datasources.environments;

import com.appsmith.external.models.DBAuth;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DatasourceStorage;
import com.appsmith.external.models.DatasourceStorageDTO;
import com.appsmith.external.models.DatasourceStructure;
import com.appsmith.external.models.Endpoint;
import com.appsmith.external.plugins.PluginExecutor;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.datasources.base.DatasourceService;
import com.appsmith.server.datasourcestorages.base.DatasourceStorageService;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.plugins.base.PluginService;
import com.appsmith.server.services.DatasourceContextService;
import com.appsmith.server.services.DatasourceStructureService;
import com.appsmith.server.services.EnvironmentService;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.DatasourceStructureSolution;
import lombok.extern.slf4j.Slf4j;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.mockito.stubbing.Answer;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.List;

import static com.appsmith.external.models.DatasourceStructure.TableType.TABLE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doReturn;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
public class DatasourceStructureOOSPluginsTest {

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
    EnvironmentService environmentService;

    @SpyBean
    FeatureFlagService featureFlagService;

    String workspaceId;

    String defaultEnvironmentId;
    String stagingEnvironmentId;

    String datasourceId;

    @BeforeEach
    @WithUserDetails(value = "api_user")
    public void setup() {
        User apiUser = userService.findByEmail("api_user").block();
        Workspace toCreate = new Workspace();
        toCreate.setName("DatasourceServiceTest");

        if (!StringUtils.hasLength(workspaceId)) {
            Workspace workspace =
                    workspaceService.create(toCreate, apiUser, Boolean.FALSE).block();
            workspaceId = workspace.getId();
            defaultEnvironmentId = workspaceService
                    .getDefaultEnvironmentId(workspaceId, AclPermission.EXECUTE_ENVIRONMENTS)
                    .block();

            stagingEnvironmentId = environmentService
                    .findByWorkspaceId(workspaceId)
                    .filter(environment -> !Boolean.TRUE.equals(environment.getIsDefault()))
                    .blockFirst()
                    .getId();
        }

        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any()))
                .thenReturn(Mono.just(new MockPluginExecutor()));

        Datasource datasource = createDatasourceObject("sampleDS", workspaceId, "google-sheets-plugin");
        datasource.getDatasourceStorages().put(defaultEnvironmentId, generateSampleDatasourceStorageDTO());
        Datasource createdDatasource = datasourceService.create(datasource).block();
        datasourceId = createdDatasource.getId();
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
    public void verifyGenerateNewStructureForOOSStaging_generatedStructureFromDefaultEnvironment() {
        doAnswer((Answer<Object>) invocationOnMock -> {
                    DatasourceStorage argument = invocationOnMock.getArgument(0, DatasourceStorage.class);
                    assert argument.getId() != null;
                    if (argument.getEnvironmentId().equals(defaultEnvironmentId)) {
                        return Mono.just(generateDatasourceStructureObject());
                    } else {
                        return Mono.error(new RuntimeException("Failed test, unexpected environment"));
                    }
                })
                .when(datasourceContextService)
                .retryOnce(any(), any());

        doReturn(Mono.just(Boolean.TRUE))
                .when(featureFlagService)
                .check(Mockito.eq(FeatureFlagEnum.release_datasource_environments_enabled));

        Mono<DatasourceStructure> datasourceStructureMono =
                datasourceStructureSolution.getStructure(datasourceId, Boolean.FALSE, stagingEnvironmentId);

        StepVerifier.create(datasourceStructureMono)
                .assertNext(datasourceStructure -> {
                    assertThat(datasourceStructure.getTables()).hasSize(2);
                    assertThat(datasourceStructure.getTables().get(0).getName()).isEqualTo("Table1");
                    assertThat(datasourceStructure.getTables().get(1).getName()).isEqualTo("Table2");
                })
                .verifyComplete();
    }
}

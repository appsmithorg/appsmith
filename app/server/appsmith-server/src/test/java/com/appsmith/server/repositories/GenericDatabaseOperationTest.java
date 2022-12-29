package com.appsmith.server.repositories;

import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.Datasource;
import com.appsmith.external.models.DatasourceConfiguration;
import com.appsmith.external.models.DefaultResources;
import com.appsmith.external.models.JSValue;
import com.appsmith.external.models.PluginType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.ActionCollection;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitApplicationMetadata;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.NewPage;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.Plugin;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ActionCollectionDTO;
import com.appsmith.server.dtos.ApplicationJson;
import com.appsmith.server.dtos.GitConnectDTO;
import com.appsmith.server.dtos.PageDTO;
import com.appsmith.server.helpers.MockPluginExecutor;
import com.appsmith.server.helpers.PluginExecutorHelper;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.services.ActionCollectionService;
import com.appsmith.server.services.ApplicationPageService;
import com.appsmith.server.services.ApplicationService;
import com.appsmith.server.services.DatasourceService;
import com.appsmith.server.services.LayoutActionService;
import com.appsmith.server.services.LayoutCollectionService;
import com.appsmith.server.services.NewActionService;
import com.appsmith.server.services.NewPageService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ImportExportApplicationService;
import com.appsmith.server.solutions.roles.RoleConfigurationSolution;
import com.appsmith.server.solutions.roles.constants.RoleTab;
import com.appsmith.server.solutions.roles.dtos.RoleViewDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleConfigDTO;
import com.appsmith.server.solutions.roles.dtos.UpdateRoleEntityDTO;
import com.google.gson.Gson;

import org.apache.commons.lang.StringUtils;
import org.eclipse.jgit.api.errors.GitAPIException;
import org.jetbrains.annotations.NotNull;
import org.jetbrains.annotations.Nullable;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.data.mongodb.core.ReactiveMongoOperations;
import org.springframework.data.mongodb.core.query.Criteria;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.io.IOException;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest
@ExtendWith(SpringExtension.class)
public class GenericDatabaseOperationTest {

    @Autowired
    UserRepository userRepository;

    @Autowired
    UserUtils userUtils;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    GenericDatabaseOperation genericDatabaseOperation;

    @Autowired
    ApplicationPageService applicationPageService;

    @Autowired
    ApplicationService applicationService;

    @Autowired
    LayoutCollectionService layoutCollectionService;

    @Autowired
    LayoutActionService layoutActionService;

    @Autowired
    NewPageService newPageService;

    @Autowired
    NewActionService newActionService;

    @Autowired
    ActionCollectionService actionCollectionService;

    @Autowired
    PluginRepository pluginRepository;

    @Autowired
    DatasourceService datasourceService;

    @Autowired
    PermissionGroupService permissionGroupService;

    @Autowired
    RoleConfigurationSolution roleConfigurationSolution;

    @Autowired
    ImportExportApplicationService importExportApplicationService;

    @Autowired
    ApplicationRepository applicationRepository;

    @Autowired
    NewPageRepository newPageRepository;

    @Autowired
    NewActionRepository newActionRepository;

    @Autowired
    ActionCollectionRepository actionCollectionRepository;

    @Autowired
    ReactiveMongoOperations reactiveMongoOperations;

    @MockBean
    PluginExecutorHelper pluginExecutorHelper;

    User api_user = null;

    String superAdminPermissionGroupId = null;

    ActionDTO defaultAction = null;

    ActionCollectionDTO defaultActionCollectionDTO = null;

    private String applicationJsonMaster = "{\"clientSchemaVersion\":1,\"serverSchemaVersion\":6,\"exportedApplication\":{\"isPublic\":false,\"pages\":[{\"id\":\"Page1\",\"isDefault\":true}],\"publishedPages\":[{\"id\":\"Page1\",\"isDefault\":true}],\"viewMode\":false,\"appIsExample\":false,\"unreadCommentThreads\":0,\"color\":\"#C7F3F0\",\"icon\":\"laptop\",\"gitApplicationMetadata\":{\"branchName\":\"master\",\"defaultBranchName\":\"master\",\"remoteUrl\":\"git@github.com:sidhantgoel/testcaserepo.git\",\"browserSupportedRemoteUrl\":\"https://github.com/sidhantgoel/testcaserepo\",\"isRepoPrivate\":false,\"repoName\":\"testcaserepo\",\"defaultApplicationId\":\"DEFAULT_APPLICATION_ID\",\"gitAuth\":{\"privateKey\":\"-----BEGIN EC PRIVATE KEY-----\\nMHcCAQEEIChaG6hb2tfmo0x+dg0QBjn5/RKDafG7REqacjki08u7oAoGCCqGSM49\\nAwEHoUQDQgAEBOmvoEKU4GU686b9c7xq9i+Yn0kT3+hx7Xo0IlfnmPtaHwMtCFUh\\nF1MjO5OSUnrf+wwwfTd1PEBX81t/459JVg\\u003d\\u003d\\n-----END EC PRIVATE KEY-----\\n\",\"publicKey\":\"ecdsa-sha2-nistp256 AAAAE2VjZHNhLXNoYTItbmlzdHAyNTYAAAAIbmlzdHAyNTYAAABBBATpr6BClOBlOvOm/XO8avYvmJ9JE9/oce16NCJX55j7Wh8DLQhVIRdTIzuTklJ63/sMMH03dTxAV/Nbf+OfSVY\\u003d appsmith\\n\",\"generatedAt\":{\"seconds\":1670786627,\"nanos\":171000000},\"isRegeneratedKey\":false},\"lastCommittedAt\":{\"seconds\":1670786658,\"nanos\":367781000}},\"evaluationVersion\":2,\"applicationVersion\":2,\"isManualUpdate\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"datasourceList\":[],\"pageList\":[{\"unpublishedPage\":{\"name\":\"Page1\",\"slug\":\"page1\",\"layouts\":[{\"viewMode\":false,\"dsl\":{\"widgetName\":\"MainContainer\",\"backgroundColor\":\"none\",\"rightColumn\":4896.0,\"snapColumns\":64.0,\"detachFromLayout\":true,\"widgetId\":\"0\",\"topRow\":0.0,\"bottomRow\":5000.0,\"containerStyle\":\"none\",\"snapRows\":125.0,\"parentRowSpace\":1.0,\"type\":\"CANVAS_WIDGET\",\"canExtend\":true,\"version\":70.0,\"minHeight\":1292.0,\"dynamicTriggerPathList\":[],\"parentColumnSpace\":1.0,\"dynamicBindingPathList\":[],\"leftColumn\":0.0,\"children\":[]},\"layoutOnLoadActions\":[],\"layoutOnLoadActionErrors\":[],\"validOnPageLoadActions\":true,\"id\":\"Page1\",\"deleted\":false,\"policies\":[],\"userPermissions\":[]}],\"userPermissions\":[],\"policies\":[]},\"publishedPage\":{\"name\":\"Page1\",\"slug\":\"page1\",\"layouts\":[{\"viewMode\":false,\"dsl\":{\"widgetName\":\"MainContainer\",\"backgroundColor\":\"none\",\"rightColumn\":4896.0,\"snapColumns\":64.0,\"detachFromLayout\":true,\"widgetId\":\"0\",\"topRow\":0.0,\"bottomRow\":5000.0,\"containerStyle\":\"none\",\"snapRows\":125.0,\"parentRowSpace\":1.0,\"type\":\"CANVAS_WIDGET\",\"canExtend\":true,\"version\":70.0,\"minHeight\":1292.0,\"dynamicTriggerPathList\":[],\"parentColumnSpace\":1.0,\"dynamicBindingPathList\":[],\"leftColumn\":0.0,\"children\":[]},\"layoutOnLoadActions\":[],\"layoutOnLoadActionErrors\":[],\"validOnPageLoadActions\":true,\"id\":\"Page1\",\"deleted\":false,\"policies\":[],\"userPermissions\":[]}],\"userPermissions\":[],\"policies\":[]},\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962a5aac9b5b7e51de4d6d_63962a5aac9b5b7e51de4d70\"}],\"actionList\":[{\"pluginType\":\"JS\",\"pluginId\":\"js-plugin\",\"unpublishedAction\":{\"name\":\"action1\",\"fullyQualifiedName\":\"actionCollection1.action1\",\"datasource\":{\"name\":\"UNUSED_DATASOURCE\",\"pluginId\":\"js-plugin\",\"messages\":[],\"isAutoGenerated\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"pageId\":\"Page1\",\"collectionId\":\"Page1_actionCollection1\",\"actionConfiguration\":{\"timeoutInMillisecond\":10000,\"paginationType\":\"NONE\",\"encodeParamsToggle\":true,\"body\":\"() \\u003d\\u003e {\\n  console.log(\\\"this is action1\\\");\\n  return 0;\\n}\",\"selfReferencingDataPaths\":[],\"jsArguments\":[],\"isAsync\":false},\"executeOnLoad\":false,\"clientSideExecution\":true,\"dynamicBindingPathList\":[{\"key\":\"body\"}],\"isValid\":true,\"invalids\":[],\"messages\":[],\"jsonPathKeys\":[\"() \\u003d\\u003e {\\n  console.log(\\\"this is action1\\\");\\n  return 0;\\n}\"],\"userSetOnLoad\":false,\"confirmBeforeExecute\":false,\"policies\":[],\"userPermissions\":[]},\"publishedAction\":{\"name\":\"action1\",\"fullyQualifiedName\":\"actionCollection1.action1\",\"datasource\":{\"name\":\"UNUSED_DATASOURCE\",\"pluginId\":\"js-plugin\",\"messages\":[],\"isAutoGenerated\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"pageId\":\"Page1\",\"collectionId\":\"Page1_actionCollection1\",\"actionConfiguration\":{\"timeoutInMillisecond\":10000,\"paginationType\":\"NONE\",\"encodeParamsToggle\":true,\"body\":\"() \\u003d\\u003e {\\n  console.log(\\\"this is action1\\\");\\n  return 0;\\n}\",\"selfReferencingDataPaths\":[],\"jsArguments\":[],\"isAsync\":false},\"executeOnLoad\":false,\"clientSideExecution\":true,\"dynamicBindingPathList\":[{\"key\":\"body\"}],\"isValid\":true,\"invalids\":[],\"messages\":[],\"jsonPathKeys\":[\"() \\u003d\\u003e {\\n  console.log(\\\"this is action1\\\");\\n  return 0;\\n}\"],\"userSetOnLoad\":false,\"confirmBeforeExecute\":false,\"policies\":[],\"userPermissions\":[]},\"id\":\"Page1_actionCollection1.action1\",\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962a5aac9b5b7e51de4d6d_63962a6cac9b5b7e51de4d77\"}],\"actionCollectionList\":[{\"unpublishedCollection\":{\"name\":\"actionCollection1\",\"pageId\":\"Page1\",\"pluginId\":\"js-plugin\",\"pluginType\":\"JS\",\"defaultToBranchedActionIdsMap\":{},\"actionIds\":[],\"defaultToBranchedArchivedActionIdsMap\":{},\"archivedActionIds\":[],\"actions\":[],\"archivedActions\":[],\"body\":\"export default {\\n\\tmyVar1: [],\\n\\tmyVar2: {},\\n\\taction1: () \\u003d\\u003e {\\n\\t\\t//write code here\\n\\t\\tconsole.log(\\\"this is action1\\\");\\n\\t\\treturn 0;\\n\\t}\\n}\",\"variables\":[{\"name\":\"myVar1\",\"value\":\"[]\"},{\"name\":\"myVar2\",\"value\":\"{}\"}],\"userPermissions\":[]},\"publishedCollection\":{\"name\":\"actionCollection1\",\"pageId\":\"Page1\",\"pluginId\":\"js-plugin\",\"pluginType\":\"JS\",\"defaultToBranchedActionIdsMap\":{},\"actionIds\":[],\"defaultToBranchedArchivedActionIdsMap\":{},\"archivedActionIds\":[],\"actions\":[],\"archivedActions\":[],\"body\":\"export default {\\n\\tmyVar1: [],\\n\\tmyVar2: {},\\n\\taction1: () \\u003d\\u003e {\\n\\t\\t//write code here\\n\\t\\tconsole.log(\\\"this is action1\\\");\\n\\t\\treturn 0;\\n\\t}\\n}\",\"variables\":[{\"name\":\"myVar1\",\"value\":\"[]\"},{\"name\":\"myVar2\",\"value\":\"{}\"}],\"userPermissions\":[]},\"id\":\"Page1_actionCollection1\",\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962a5aac9b5b7e51de4d6d_63962a6cac9b5b7e51de4d7d\"}],\"editModeTheme\":{\"name\":\"Default\",\"displayName\":\"Modern\",\"isSystemTheme\":true,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"publishedTheme\":{\"name\":\"Default\",\"displayName\":\"Modern\",\"isSystemTheme\":true,\"deleted\":false,\"policies\":[],\"userPermissions\":[]}}";
    private String applicationJsonFeature1 = "{\"clientSchemaVersion\":1,\"serverSchemaVersion\":6,\"exportedApplication\":{\"isPublic\":false,\"pages\":[{\"id\":\"Page1\",\"isDefault\":true},{\"id\":\"Page2\",\"isDefault\":false}],\"publishedPages\":[{\"id\":\"Page1\",\"isDefault\":true},{\"id\":\"Page2\",\"isDefault\":false}],\"viewMode\":false,\"appIsExample\":false,\"unreadCommentThreads\":0,\"color\":\"#C7F3F0\",\"icon\":\"laptop\",\"evaluationVersion\":2,\"applicationVersion\":2,\"isManualUpdate\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"datasourceList\":[],\"pageList\":[{\"unpublishedPage\":{\"name\":\"Page1\",\"slug\":\"page1\",\"layouts\":[{\"viewMode\":false,\"dsl\":{\"widgetName\":\"MainContainer\",\"backgroundColor\":\"none\",\"rightColumn\":4896.0,\"snapColumns\":64.0,\"detachFromLayout\":true,\"widgetId\":\"0\",\"topRow\":0.0,\"bottomRow\":5000.0,\"containerStyle\":\"none\",\"snapRows\":125.0,\"parentRowSpace\":1.0,\"type\":\"CANVAS_WIDGET\",\"canExtend\":true,\"version\":70.0,\"minHeight\":1292.0,\"dynamicTriggerPathList\":[],\"parentColumnSpace\":1.0,\"dynamicBindingPathList\":[],\"leftColumn\":0.0,\"children\":[]},\"layoutOnLoadActions\":[],\"layoutOnLoadActionErrors\":[],\"validOnPageLoadActions\":true,\"id\":\"Page1\",\"deleted\":false,\"policies\":[],\"userPermissions\":[]}],\"userPermissions\":[],\"policies\":[]},\"publishedPage\":{\"name\":\"Page1\",\"slug\":\"page1\",\"layouts\":[{\"viewMode\":false,\"dsl\":{\"widgetName\":\"MainContainer\",\"backgroundColor\":\"none\",\"rightColumn\":4896.0,\"snapColumns\":64.0,\"detachFromLayout\":true,\"widgetId\":\"0\",\"topRow\":0.0,\"bottomRow\":5000.0,\"containerStyle\":\"none\",\"snapRows\":125.0,\"parentRowSpace\":1.0,\"type\":\"CANVAS_WIDGET\",\"canExtend\":true,\"version\":70.0,\"minHeight\":1292.0,\"dynamicTriggerPathList\":[],\"parentColumnSpace\":1.0,\"dynamicBindingPathList\":[],\"leftColumn\":0.0,\"children\":[]},\"layoutOnLoadActions\":[],\"layoutOnLoadActionErrors\":[],\"validOnPageLoadActions\":true,\"id\":\"Page1\",\"deleted\":false,\"policies\":[],\"userPermissions\":[]}],\"userPermissions\":[],\"policies\":[]},\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962a5aac9b5b7e51de4d6d_63962a5aac9b5b7e51de4d70\"},{\"unpublishedPage\":{\"name\":\"Page2\",\"slug\":\"page2\",\"layouts\":[{\"viewMode\":false,\"dsl\":{\"widgetName\":\"MainContainer\",\"backgroundColor\":\"none\",\"rightColumn\":1224.0,\"snapColumns\":64.0,\"detachFromLayout\":true,\"widgetId\":\"0\",\"topRow\":0.0,\"bottomRow\":590.0,\"containerStyle\":\"none\",\"snapRows\":59.0,\"parentRowSpace\":1.0,\"type\":\"CANVAS_WIDGET\",\"canExtend\":true,\"version\":70.0,\"minHeight\":600.0,\"parentColumnSpace\":1.0,\"dynamicBindingPathList\":[],\"leftColumn\":0.0,\"children\":[]},\"layoutOnLoadActions\":[],\"layoutOnLoadActionErrors\":[],\"validOnPageLoadActions\":true,\"id\":\"Page2\",\"deleted\":false,\"policies\":[],\"userPermissions\":[]}],\"userPermissions\":[],\"policies\":[]},\"publishedPage\":{\"name\":\"Page2\",\"slug\":\"page2\",\"layouts\":[{\"viewMode\":false,\"dsl\":{\"widgetName\":\"MainContainer\",\"backgroundColor\":\"none\",\"rightColumn\":1224.0,\"snapColumns\":64.0,\"detachFromLayout\":true,\"widgetId\":\"0\",\"topRow\":0.0,\"bottomRow\":590.0,\"containerStyle\":\"none\",\"snapRows\":59.0,\"parentRowSpace\":1.0,\"type\":\"CANVAS_WIDGET\",\"canExtend\":true,\"version\":70.0,\"minHeight\":600.0,\"parentColumnSpace\":1.0,\"dynamicBindingPathList\":[],\"leftColumn\":0.0,\"children\":[]},\"layoutOnLoadActions\":[],\"layoutOnLoadActionErrors\":[],\"validOnPageLoadActions\":true,\"id\":\"Page2\",\"deleted\":false,\"policies\":[],\"userPermissions\":[]}],\"userPermissions\":[],\"policies\":[]},\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962b83ac9b5b7e51de4d92_63962b99ac9b5b7e51de4da1\"}],\"actionList\":[{\"pluginType\":\"JS\",\"pluginId\":\"js-plugin\",\"unpublishedAction\":{\"name\":\"action2\",\"fullyQualifiedName\":\"actionCollection2.action2\",\"datasource\":{\"name\":\"UNUSED_DATASOURCE\",\"pluginId\":\"js-plugin\",\"messages\":[],\"isAutoGenerated\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"pageId\":\"Page1\",\"collectionId\":\"Page1_actionCollection2\",\"actionConfiguration\":{\"timeoutInMillisecond\":10000,\"paginationType\":\"NONE\",\"encodeParamsToggle\":true,\"body\":\"() \\u003d\\u003e {\\n  console.log(\\\"this is action2\\\");\\n  return 0;\\n}\",\"selfReferencingDataPaths\":[],\"jsArguments\":[],\"isAsync\":false},\"executeOnLoad\":false,\"clientSideExecution\":true,\"dynamicBindingPathList\":[{\"key\":\"body\"}],\"isValid\":true,\"invalids\":[],\"messages\":[],\"jsonPathKeys\":[\"() \\u003d\\u003e {\\n  console.log(\\\"this is action2\\\");\\n  return 0;\\n}\"],\"userSetOnLoad\":false,\"confirmBeforeExecute\":false,\"policies\":[],\"userPermissions\":[]},\"publishedAction\":{\"name\":\"action2\",\"fullyQualifiedName\":\"actionCollection2.action2\",\"datasource\":{\"name\":\"UNUSED_DATASOURCE\",\"pluginId\":\"js-plugin\",\"messages\":[],\"isAutoGenerated\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"pageId\":\"Page1\",\"collectionId\":\"Page1_actionCollection2\",\"actionConfiguration\":{\"timeoutInMillisecond\":10000,\"paginationType\":\"NONE\",\"encodeParamsToggle\":true,\"body\":\"() \\u003d\\u003e {\\n  console.log(\\\"this is action2\\\");\\n  return 0;\\n}\",\"selfReferencingDataPaths\":[],\"jsArguments\":[],\"isAsync\":false},\"executeOnLoad\":false,\"clientSideExecution\":true,\"dynamicBindingPathList\":[{\"key\":\"body\"}],\"isValid\":true,\"invalids\":[],\"messages\":[],\"jsonPathKeys\":[\"() \\u003d\\u003e {\\n  console.log(\\\"this is action2\\\");\\n  return 0;\\n}\"],\"userSetOnLoad\":false,\"confirmBeforeExecute\":false,\"policies\":[],\"userPermissions\":[]},\"id\":\"Page1_actionCollection2.action2\",\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962b83ac9b5b7e51de4d92_63962bb1ac9b5b7e51de4da7\"},{\"pluginType\":\"JS\",\"pluginId\":\"js-plugin\",\"unpublishedAction\":{\"name\":\"action3\",\"fullyQualifiedName\":\"actionCollection3.action3\",\"datasource\":{\"name\":\"UNUSED_DATASOURCE\",\"pluginId\":\"js-plugin\",\"messages\":[],\"isAutoGenerated\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"pageId\":\"Page2\",\"collectionId\":\"Page2_actionCollection3\",\"actionConfiguration\":{\"timeoutInMillisecond\":10000,\"paginationType\":\"NONE\",\"encodeParamsToggle\":true,\"body\":\"() \\u003d\\u003e {\\n  console.log(\\\"This is action3\\\");\\n  return 0;\\n}\",\"selfReferencingDataPaths\":[],\"jsArguments\":[],\"isAsync\":false},\"executeOnLoad\":false,\"clientSideExecution\":true,\"dynamicBindingPathList\":[{\"key\":\"body\"}],\"isValid\":true,\"invalids\":[],\"messages\":[],\"jsonPathKeys\":[\"() \\u003d\\u003e {\\n  console.log(\\\"This is action3\\\");\\n  return 0;\\n}\"],\"userSetOnLoad\":false,\"confirmBeforeExecute\":false,\"policies\":[],\"userPermissions\":[]},\"publishedAction\":{\"name\":\"action3\",\"fullyQualifiedName\":\"actionCollection3.action3\",\"datasource\":{\"name\":\"UNUSED_DATASOURCE\",\"pluginId\":\"js-plugin\",\"messages\":[],\"isAutoGenerated\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"pageId\":\"Page2\",\"collectionId\":\"Page2_actionCollection3\",\"actionConfiguration\":{\"timeoutInMillisecond\":10000,\"paginationType\":\"NONE\",\"encodeParamsToggle\":true,\"body\":\"() \\u003d\\u003e {\\n  console.log(\\\"This is action3\\\");\\n  return 0;\\n}\",\"selfReferencingDataPaths\":[],\"jsArguments\":[],\"isAsync\":false},\"executeOnLoad\":false,\"clientSideExecution\":true,\"dynamicBindingPathList\":[{\"key\":\"body\"}],\"isValid\":true,\"invalids\":[],\"messages\":[],\"jsonPathKeys\":[\"() \\u003d\\u003e {\\n  console.log(\\\"This is action3\\\");\\n  return 0;\\n}\"],\"userSetOnLoad\":false,\"confirmBeforeExecute\":false,\"policies\":[],\"userPermissions\":[]},\"id\":\"Page2_actionCollection3.action3\",\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962b83ac9b5b7e51de4d92_63962c4aac9b5b7e51de4dc9\"},{\"pluginType\":\"JS\",\"pluginId\":\"js-plugin\",\"unpublishedAction\":{\"name\":\"action1\",\"fullyQualifiedName\":\"actionCollection1.action1\",\"datasource\":{\"name\":\"UNUSED_DATASOURCE\",\"pluginId\":\"js-plugin\",\"messages\":[],\"isAutoGenerated\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"pageId\":\"Page1\",\"collectionId\":\"Page1_actionCollection1\",\"actionConfiguration\":{\"timeoutInMillisecond\":10000,\"paginationType\":\"NONE\",\"encodeParamsToggle\":true,\"body\":\"() \\u003d\\u003e {\\n  console.log(\\\"this is action1\\\");\\n  return 0;\\n}\",\"selfReferencingDataPaths\":[],\"jsArguments\":[],\"isAsync\":false},\"executeOnLoad\":false,\"clientSideExecution\":true,\"dynamicBindingPathList\":[{\"key\":\"body\"}],\"isValid\":true,\"invalids\":[],\"messages\":[],\"jsonPathKeys\":[\"() \\u003d\\u003e {\\n  console.log(\\\"this is action1\\\");\\n  return 0;\\n}\"],\"userSetOnLoad\":false,\"confirmBeforeExecute\":false,\"policies\":[],\"userPermissions\":[]},\"publishedAction\":{\"name\":\"action1\",\"fullyQualifiedName\":\"actionCollection1.action1\",\"datasource\":{\"name\":\"UNUSED_DATASOURCE\",\"pluginId\":\"js-plugin\",\"messages\":[],\"isAutoGenerated\":false,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"pageId\":\"Page1\",\"collectionId\":\"Page1_actionCollection1\",\"actionConfiguration\":{\"timeoutInMillisecond\":10000,\"paginationType\":\"NONE\",\"encodeParamsToggle\":true,\"body\":\"() \\u003d\\u003e {\\n  console.log(\\\"this is action1\\\");\\n  return 0;\\n}\",\"selfReferencingDataPaths\":[],\"jsArguments\":[],\"isAsync\":false},\"executeOnLoad\":false,\"clientSideExecution\":true,\"dynamicBindingPathList\":[{\"key\":\"body\"}],\"isValid\":true,\"invalids\":[],\"messages\":[],\"jsonPathKeys\":[\"() \\u003d\\u003e {\\n  console.log(\\\"this is action1\\\");\\n  return 0;\\n}\"],\"userSetOnLoad\":false,\"confirmBeforeExecute\":false,\"policies\":[],\"userPermissions\":[]},\"id\":\"Page1_actionCollection1.action1\",\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962a5aac9b5b7e51de4d6d_63962a6cac9b5b7e51de4d77\"}],\"actionCollectionList\":[{\"unpublishedCollection\":{\"name\":\"actionCollection3\",\"pageId\":\"Page2\",\"pluginId\":\"js-plugin\",\"pluginType\":\"JS\",\"defaultToBranchedActionIdsMap\":{},\"actionIds\":[],\"defaultToBranchedArchivedActionIdsMap\":{},\"archivedActionIds\":[],\"actions\":[],\"archivedActions\":[],\"body\":\"export default {\\n\\tmyVar1: [],\\n\\tmyVar2: {},\\n\\taction3: () \\u003d\\u003e {\\n\\t\\tconsole.log(\\\"This is action3\\\");\\n\\t\\treturn 0;\\n\\t}\\n}\",\"variables\":[{\"name\":\"myVar1\",\"value\":\"[]\"},{\"name\":\"myVar2\",\"value\":\"{}\"}],\"userPermissions\":[]},\"publishedCollection\":{\"name\":\"actionCollection3\",\"pageId\":\"Page2\",\"pluginId\":\"js-plugin\",\"pluginType\":\"JS\",\"defaultToBranchedActionIdsMap\":{},\"actionIds\":[],\"defaultToBranchedArchivedActionIdsMap\":{},\"archivedActionIds\":[],\"actions\":[],\"archivedActions\":[],\"body\":\"export default {\\n\\tmyVar1: [],\\n\\tmyVar2: {},\\n\\taction3: () \\u003d\\u003e {\\n\\t\\tconsole.log(\\\"This is action3\\\");\\n\\t\\treturn 0;\\n\\t}\\n}\",\"variables\":[{\"name\":\"myVar1\",\"value\":\"[]\"},{\"name\":\"myVar2\",\"value\":\"{}\"}],\"userPermissions\":[]},\"id\":\"Page2_actionCollection3\",\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962b83ac9b5b7e51de4d92_63962c4aac9b5b7e51de4dcf\"},{\"unpublishedCollection\":{\"name\":\"actionCollection2\",\"pageId\":\"Page1\",\"pluginId\":\"js-plugin\",\"pluginType\":\"JS\",\"defaultToBranchedActionIdsMap\":{},\"actionIds\":[],\"defaultToBranchedArchivedActionIdsMap\":{},\"archivedActionIds\":[],\"actions\":[],\"archivedActions\":[],\"body\":\"export default {\\n\\tmyVar1: [],\\n\\tmyVar2: {},\\n\\taction2: () \\u003d\\u003e {\\n\\t\\tconsole.log(\\\"this is action2\\\");\\n\\t\\treturn 0;\\n\\t}\\n}\",\"variables\":[{\"name\":\"myVar1\",\"value\":\"[]\"},{\"name\":\"myVar2\",\"value\":\"{}\"}],\"userPermissions\":[]},\"publishedCollection\":{\"name\":\"actionCollection2\",\"pageId\":\"Page1\",\"pluginId\":\"js-plugin\",\"pluginType\":\"JS\",\"defaultToBranchedActionIdsMap\":{},\"actionIds\":[],\"defaultToBranchedArchivedActionIdsMap\":{},\"archivedActionIds\":[],\"actions\":[],\"archivedActions\":[],\"body\":\"export default {\\n\\tmyVar1: [],\\n\\tmyVar2: {},\\n\\taction2: () \\u003d\\u003e {\\n\\t\\tconsole.log(\\\"this is action2\\\");\\n\\t\\treturn 0;\\n\\t}\\n}\",\"variables\":[{\"name\":\"myVar1\",\"value\":\"[]\"},{\"name\":\"myVar2\",\"value\":\"{}\"}],\"userPermissions\":[]},\"id\":\"Page1_actionCollection2\",\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962b83ac9b5b7e51de4d92_63962bb1ac9b5b7e51de4dad\"},{\"unpublishedCollection\":{\"name\":\"actionCollection1\",\"pageId\":\"Page1\",\"pluginId\":\"js-plugin\",\"pluginType\":\"JS\",\"defaultToBranchedActionIdsMap\":{},\"actionIds\":[],\"defaultToBranchedArchivedActionIdsMap\":{},\"archivedActionIds\":[],\"actions\":[],\"archivedActions\":[],\"body\":\"export default {\\n\\tmyVar1: [],\\n\\tmyVar2: {},\\n\\taction1: () \\u003d\\u003e {\\n\\t\\t//write code here\\n\\t\\tconsole.log(\\\"this is action1\\\");\\n\\t\\treturn 0;\\n\\t}\\n}\",\"variables\":[{\"name\":\"myVar1\",\"value\":\"[]\"},{\"name\":\"myVar2\",\"value\":\"{}\"}],\"userPermissions\":[]},\"publishedCollection\":{\"name\":\"actionCollection1\",\"pageId\":\"Page1\",\"pluginId\":\"js-plugin\",\"pluginType\":\"JS\",\"defaultToBranchedActionIdsMap\":{},\"actionIds\":[],\"defaultToBranchedArchivedActionIdsMap\":{},\"archivedActionIds\":[],\"actions\":[],\"archivedActions\":[],\"body\":\"export default {\\n\\tmyVar1: [],\\n\\tmyVar2: {},\\n\\taction1: () \\u003d\\u003e {\\n\\t\\t//write code here\\n\\t\\tconsole.log(\\\"this is action1\\\");\\n\\t\\treturn 0;\\n\\t}\\n}\",\"variables\":[{\"name\":\"myVar1\",\"value\":\"[]\"},{\"name\":\"myVar2\",\"value\":\"{}\"}],\"userPermissions\":[]},\"id\":\"Page1_actionCollection1\",\"deleted\":false,\"policies\":[],\"userPermissions\":[],\"gitSyncId\":\"63962a5aac9b5b7e51de4d6d_63962a6cac9b5b7e51de4d7d\"}],\"editModeTheme\":{\"name\":\"Default\",\"displayName\":\"Modern\",\"isSystemTheme\":true,\"deleted\":false,\"policies\":[],\"userPermissions\":[]},\"publishedTheme\":{\"name\":\"Default\",\"displayName\":\"Modern\",\"isSystemTheme\":true,\"deleted\":false,\"policies\":[],\"userPermissions\":[]}}";
    
    private Workspace workspace;
    private String importedApplicationMasterBranchId, importedApplicationFeature1BranchId, mergedApplicationToMasterId;

    @BeforeEach
    public void setup() {
        if (api_user == null) {
            api_user = userRepository.findByEmail("api_user").block();

            createWorkspace();
            importApplicationInMasterBranch();
            importApplicationInFeature1Branch();
            createApplicationAndMergeFeatureToMaster();
        }

        // Make api_user instance administrator before starting the test
        userUtils.makeSuperUser(List.of(api_user)).block();
    }

    void createWorkspace() {
        workspace = new Workspace();
        workspace.setName("testWorkspace");
        workspace = workspaceService.create(workspace).block();
    }

    void importApplicationInMasterBranch() {
        // Create dummy application
        Application application = new Application();
        application.setName("importedApplication");
        application.setWorkspaceId(workspace.getId());
        application.setGitApplicationMetadata(new GitApplicationMetadata());
        application = applicationPageService
                .createOrUpdateSuffixedApplication(application, application.getName(), 0).block();

        ApplicationJson applicationJson = new Gson().fromJson(
                applicationJsonMaster.replace("DEFAULT_APPLICATION_ID", application.getId()),
                ApplicationJson.class);

        // Import application in master branch
        importedApplicationMasterBranchId = importExportApplicationService.importApplicationInWorkspace(workspace.getId(), applicationJson, application.getId(), "master").block().getId();

        /*
         * Structure
         * =========
         * Application +-> Page1 +-> actionCollection1
         *                       |-> action1
         * 
         * Summary
         * =======
         * Page1 exists in master and feature1
         * actionCollection1 and action1, childs of page1, exists in master and feature1
         */
    }

    void importApplicationInFeature1Branch() {
        // Create dummy application
        Application srcApplication = applicationService.findById(importedApplicationMasterBranchId).block();
        GitApplicationMetadata srcBranchGitData = srcApplication.getGitApplicationMetadata();
        srcBranchGitData.setBranchName("feature1");
        srcBranchGitData.setDefaultApplicationId(importedApplicationMasterBranchId);
        // Save a new application in DB and update from the parent branch application
        srcBranchGitData.setGitAuth(null);
        srcBranchGitData.setIsRepoPrivate(null);
        srcBranchGitData.setLastCommittedAt(Instant.now());
        srcApplication.setId(null);
        srcApplication.setPages(null);
        srcApplication.setPublishedPages(null);
        srcApplication.setGitApplicationMetadata(srcBranchGitData);
        srcApplication = applicationService.save(srcApplication).block();

        ApplicationJson applicationJson = new Gson().fromJson(
                applicationJsonFeature1,
                ApplicationJson.class);

        // Import application in feature1 branch
        importedApplicationFeature1BranchId = importExportApplicationService.importApplicationInWorkspace(workspace.getId(), applicationJson, srcApplication.getId(), "feature1").block().getId();

        /*
         * Structure
         * =========
         * Application +-> Page1 +-> actionCollection1
         *             |         |-> action1
         *             |         |
         *             |         |-> actionCollection2
         *             |         |-> action2
         *             |
         *             |-> Page2 +-> actionCollection3
         *                       |-> action3
         * 
         * Summary
         * =======
         * Page1 exists in master and feature1
         * actionCollection2 and action2, childs of page1, exists only in feature1
         * Page2 exists only in feature1
         * actionCollection3 and action3, childs of page2, exists only in feature1
         */
    }

    void createApplicationAndMergeFeatureToMaster() {
        //Import in master branch
        Application application = new Application();
        application.setName("mergedApplication");
        application.setWorkspaceId(workspace.getId());
        application.setGitApplicationMetadata(new GitApplicationMetadata());
        application = applicationPageService
                .createOrUpdateSuffixedApplication(application, application.getName(), 0).block();

        ApplicationJson applicationJson = new Gson().fromJson(
                applicationJsonMaster.replace("DEFAULT_APPLICATION_ID", application.getId()),
                ApplicationJson.class);

        // Import application in master branch
        application = importExportApplicationService.importApplicationInWorkspace(workspace.getId(), applicationJson, application.getId(), "master").block();

        //Import in feature branch
        Application srcApplication = applicationService.findById(application.getId()).block();
        GitApplicationMetadata srcBranchGitData = srcApplication.getGitApplicationMetadata();
        srcBranchGitData.setBranchName("feature1");
        srcBranchGitData.setDefaultApplicationId(application.getId());
        // Save a new application in DB and update from the parent branch application
        srcBranchGitData.setGitAuth(null);
        srcBranchGitData.setIsRepoPrivate(null);
        srcBranchGitData.setLastCommittedAt(Instant.now());
        srcApplication.setId(null);
        srcApplication.setPages(null);
        srcApplication.setPublishedPages(null);
        srcApplication.setGitApplicationMetadata(srcBranchGitData);
        srcApplication = applicationService.save(srcApplication).block();

        applicationJson = new Gson().fromJson(
                applicationJsonFeature1,
                ApplicationJson.class);

        // Import application in feature1 branch
        importExportApplicationService.importApplicationInWorkspace(workspace.getId(), applicationJson, srcApplication.getId(), "feature1").block();

        // Import again in master branch to simulate merge
        applicationJson = new Gson().fromJson(
                applicationJsonFeature1,
                ApplicationJson.class);

        mergedApplicationToMasterId =
                importExportApplicationService.importApplicationInWorkspace(workspace.getId(), applicationJson, application.getId(), "master").block().getId();
    }

    /**
     * Case 1 : Test the removal of permission in updatePolicies
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdateRolesRemoval() {

        Workspace workspace = new Workspace();
        workspace.setName("testUpdateRolesRemoval workspace");
        Workspace createdWorkspace = workspaceService.create(workspace).block();

        String toRemove = createdWorkspace.getDefaultPermissionGroups().stream().findFirst().get();

        genericDatabaseOperation.updatePolicies(createdWorkspace.getId(),
                        toRemove,
                        List.of(),
                        List.of(AclPermission.READ_WORKSPACES),
                        Workspace.class)
                .block();

        Workspace postUpdate = workspaceService.findById(createdWorkspace.getId(), AclPermission.MANAGE_WORKSPACES).block();
        postUpdate.getPolicies().stream().filter(policy -> policy.getPermission().equals(AclPermission.MANAGE_WORKSPACES)).findFirst().ifPresent(policy -> {
            Set<String> permissionGroups = policy.getPermissionGroups();
            assertThat(permissionGroups).doesNotContain(toRemove);
        });
    }

    /**
     * Case 2 : Apply permission on one of each type of resources in master
     * and see if it is propogated to corresponding resources in feature1 branch
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdatePermissionOnEachResourceTypeInMasterBranch_thenItIsAppliedAcrossBranches() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnEachResourceTypeInMasterBranch_thenItIsAppliedAcrossBranches");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        Application masterBranchApplication = applicationRepository.findById(importedApplicationMasterBranchId).block();
        List<NewPage> pageList = newPageRepository.findByApplicationId(masterBranchApplication.getId()).collectList().block();
        List<NewAction> actionList = pageList.stream().flatMap(page -> newActionRepository.findByPageId(page.getId()).collectList().block().stream()).collect(Collectors.toList());
        List<ActionCollection> actionCollectionList = pageList.stream().flatMap(page -> actionCollectionRepository.findByPageId(page.getId()).collectList().block().stream()).collect(Collectors.toList());

        NewPage firstPage = pageList.get(0);
        NewAction firstAction = actionList.get(0);
        ActionCollection firstActionCollection = actionCollectionList.get(0);

        // Apply manage permission to first page, action and actionCollection, in master branch application
        genericDatabaseOperation.updatePolicies(masterBranchApplication.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_APPLICATIONS), List.of(), Application.class).block();
        genericDatabaseOperation.updatePolicies(firstPage.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_PAGES), List.of(), NewPage.class).block();
        genericDatabaseOperation.updatePolicies(firstAction.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_ACTIONS), List.of(), NewAction.class).block();
        genericDatabaseOperation.updatePolicies(firstActionCollection.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_ACTIONS), List.of(), ActionCollection.class).block();

        // Get mono for Application, Page, Action and ActionCollection in master branch
        // to see if the changes are reflected in master branch
        Mono<Application> masterBranchApplicationMono = applicationRepository.findById(importedApplicationMasterBranchId);
        Mono<NewPage> masterBranchPageMono = newPageRepository.findById(firstPage.getId());
        Mono<NewAction> masterBranchActionMono = newActionRepository.findById(firstAction.getId());
        Mono<ActionCollection> masterBranchActionCollectionMono = actionCollectionRepository.findById(firstActionCollection.getId());

        StepVerifier
                .create(Flux.zip(masterBranchApplicationMono, masterBranchPageMono, masterBranchActionMono, masterBranchActionCollectionMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    NewPage page = tuple.getT2();
                    NewAction action = tuple.getT3();
                    ActionCollection actionCollection = tuple.getT4();

                    assertThat(application.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_APPLICATIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });

                    assertThat(page.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_PAGES.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });

                    assertThat(action.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });

                    assertThat(actionCollection.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Get mono for Application, Page, Action and ActionCollection in feature1 branch
        // to see if the changes are reflected in feature1 branch
        Mono<Application> feature1BranchApplicationMono = applicationRepository.findById(importedApplicationFeature1BranchId);
        Mono<NewPage> feature1BranchPageMono = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId).and("defaultResources.pageId").is(firstPage.getId()))
                .one();
        Mono<NewAction> feature1BranchActionMono = reactiveMongoOperations.query(NewAction.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId).and("defaultResources.actionId").is(firstAction.getId()))
                .one();
        Mono<ActionCollection> feature1BranchActionCollectionMono = reactiveMongoOperations.query(ActionCollection.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId).and("defaultResources.collectionId").is(firstActionCollection.getId()))
                .one();

        StepVerifier
        .create(Flux.zip(feature1BranchApplicationMono, feature1BranchPageMono, feature1BranchActionMono, feature1BranchActionCollectionMono))
                .assertNext(tuple -> {
                    Application application = tuple.getT1();
                    NewPage page = tuple.getT2();
                    NewAction action = tuple.getT3();
                    ActionCollection actionCollection = tuple.getT4();

                    assertThat(application.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_APPLICATIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });

                    assertThat(page.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_PAGES.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });

                    assertThat(action.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });

                    assertThat(actionCollection.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();
    }

    /**
     * Case 3 : Feature branch has Page2 which does not exists in master
     * so it should inherit permission from Application in accross branches
     * when Application permission is updates
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdatePermissionOnApplicationInDefaultBranch_thenItIsInheritedByChildsThatExistsOnlyInNonDefaultBranch() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnApplicationInDefaultBranch_thenItIsInheritedByChildsThatExistsOnlyInNonDefaultBranch");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        Application masterBranchApplication = applicationRepository.findById(importedApplicationMasterBranchId).block();

        // Apply manage permission to application in master branch
        genericDatabaseOperation.updatePolicies(masterBranchApplication.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_APPLICATIONS), List.of(), Application.class).block();

        // Get mono for Application in master branch
        Mono<Application> masterBranchApplicationMono = applicationRepository.findById(importedApplicationMasterBranchId);

        // Get mono for Application in feature1 branch
        Mono<Application> feature1BranchApplicationMono = applicationRepository.findById(importedApplicationFeature1BranchId);

        // Get mono for Page2 in feature1 branch
        Mono<NewPage> page2InFeature1Mono = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page2")).next();

        // Get mono for action3 in feature1 branch
        Mono<NewAction> action3InFeature1Mono = reactiveMongoOperations.query(NewAction.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(action -> action.getPublishedAction().getName().equals("action3")).next();

        // Get mono for actionCollection3 in feature1 branch
        Mono<ActionCollection> actionCollection3InFeature1Mono = reactiveMongoOperations.query(ActionCollection.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(actionCollection -> actionCollection.getPublishedCollection().getName().equals("actionCollection3")).next();

        // Verify if change is reflection in Application in master branch
        StepVerifier.create(masterBranchApplicationMono)
                .assertNext(application -> {
                    assertThat(application.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_APPLICATIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if change is reflection in Application in feature1 branch
        StepVerifier.create(feature1BranchApplicationMono)
                .assertNext(application -> {
                    assertThat(application.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_APPLICATIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if permission is inherited to Page2 in feature1 branch
        StepVerifier.create(page2InFeature1Mono)
                .assertNext(page -> {
                    assertThat(page.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_PAGES.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if permission is inherited to action3 in feature1 branch
        StepVerifier.create(action3InFeature1Mono)
                .assertNext(action -> {
                    assertThat(action.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if permission is inherited to actionCollection3 in feature1 branch
        StepVerifier.create(actionCollection3InFeature1Mono)
                .assertNext(actionCollection -> {
                    assertThat(actionCollection.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();
    }

    /**
     * Case 4 : Feature and master branches has Page1
     * so it should not inherit permission from Application across branches
     * when Application permission is updates
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdatePermissionOnApplicationInDefaultBranch_thenItIsNotInheritedByChildsAcrossBranches() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnApplicationInDefaultBranch_thenItIsNotInheritedByChildsThatExistsInDefaultBranch");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        Application masterBranchApplication = applicationRepository.findById(importedApplicationMasterBranchId).block();

        // Apply manage permission to application in master branch
        genericDatabaseOperation.updatePolicies(masterBranchApplication.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_APPLICATIONS), List.of(), Application.class).block();

        // Get mono for Page1 in feature1 branch
        Mono<NewPage> page1InFeature1Mono = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page1")).next();

        // Get mono for Page1 in master branch
        Mono<NewPage> page1InMasterMono = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationMasterBranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page1")).next();

        // Verify if change is not inherited to Page1 in feature1 branch
        StepVerifier.create(page1InFeature1Mono)
                .assertNext(application -> {
                    assertThat(application.getPolicies()).noneMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_PAGES.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if change is not inherited to Page1 in master branch
        StepVerifier.create(page1InMasterMono)
                .assertNext(application -> {
                    assertThat(application.getPolicies()).noneMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_PAGES.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();
    }

    /**
     * Case 5 : Feature branch has actionCollection2 and action2 which does not exists in master
     * as child of Page1 which exists in both branches so action2 and actionCollection2 should inherit
     * permission from Page1 in master branch when Page1 permission is updated
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdatePermissionOnPageInDefaultBranch_thenItIsInheritedByChildsThatExistsOnlyInNonDefaultBranch() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnApplicationInDefaultBranch_thenItIsInheritedByChildsThatExistsOnlyInNonDefaultBranch");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        // Get Page1 in master branch
        NewPage page1InMaster = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationMasterBranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page1")).next().block();

        // Get resource of feature branch Page 2
        NewPage page2FeatureBranch = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page2")).next().block();

        // Apply manage permission to application in master branch
        genericDatabaseOperation.updatePolicies(page1InMaster.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_PAGES), List.of(), NewPage.class).block();

        // Get mono for Page1 in master branch
        Mono<NewPage> page1InMasterMono = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationMasterBranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page1")).next();

        Mono<NewPage> page2InFeatureMono = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page2")).next();

        // Get mono for Page1 in feature1 branch
        Mono<NewPage> page1InFeature1Mono = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page1")).next();

        // Get mono for action2 in feature1 branch
        Mono<NewAction> action2InFeature1Mono = reactiveMongoOperations.query(NewAction.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(action -> action.getUnpublishedAction().getName().equals("action2")).next();

        // Get mono for actionCollection2 in feature1 branch
        Mono<ActionCollection> actionCollection2InFeature1Mono = reactiveMongoOperations.query(ActionCollection.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(actionCollection -> actionCollection.getUnpublishedCollection().getName().equals("actionCollection2")).next();

        // Verify if change is reflection in Page1 in master branch
        StepVerifier.create(page1InMasterMono)
                .assertNext(page -> {
                    assertThat(page.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_PAGES.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if change is reflection in Application in feature1 branch
        StepVerifier.create(page1InFeature1Mono)
                .assertNext(page -> {
                    assertThat(page.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_PAGES.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if permission is inherited to action3 in feature1 branch
        StepVerifier.create(action2InFeature1Mono)
                .assertNext(action -> {
                    assertThat(action.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if permission is inherited to actionCollection3 in feature1 branch
        StepVerifier.create(actionCollection2InFeature1Mono)
                .assertNext(actionCollection -> {
                    assertThat(actionCollection.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify the permission is not affected in page 2
        StepVerifier.create(page2InFeatureMono)
                .assertNext(newPage -> {
                    assertThat(newPage.getPolicies()).isEqualTo(page2FeatureBranch.getPolicies());
                })
                .verifyComplete();
    }

    /**
     * Case 6 : Master branch has actionCollection1 and action1 which exists in both branches
     * as child of Page1 which exists in both branches so action1 and actionCollection1 should not inherit
     * permission from Page1 in master branch when Page1 permission is updated
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testUpdatePermissionOnPageInDefaultBranch_thenItIsNotIngeritedByChildsThatExistsAcrossBranches() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testUpdatePermissionOnApplicationInDefaultBranch_thenItIsInheritedByChildsThatExistsOnlyInNonDefaultBranch");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        // Get Page1 in master branch
        NewPage page1InMaster = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(importedApplicationMasterBranchId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page1")).next().block();

        // Apply manage permission to application in master branch
        genericDatabaseOperation.updatePolicies(page1InMaster.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_PAGES), List.of(), NewPage.class).block();

        // Get mono for action1 in feature1 branch
        Mono<NewAction> action1InFeature1Mono = reactiveMongoOperations.query(NewAction.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(action -> action.getUnpublishedAction().getName().equals("action1")).next();

        // Get mono for actionCollection1 in feature1 branch
        Mono<ActionCollection> actionCollection1InFeature1Mono = reactiveMongoOperations.query(ActionCollection.class)
                .matching(Criteria.where("applicationId").is(importedApplicationFeature1BranchId))
                .all()
                .filter(actionCollection -> actionCollection.getUnpublishedCollection().getName().equals("actionCollection1")).next();

        // Verify if change is not inherited to action1 in feature1 branch
        StepVerifier.create(action1InFeature1Mono)
                .assertNext(page -> {
                    assertThat(page.getPolicies()).noneMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();

        // Verify if change is not inherited to actionCollection1 in feature1 branch
        StepVerifier.create(actionCollection1InFeature1Mono)
                .assertNext(page -> {
                    assertThat(page.getPolicies()).noneMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_ACTIONS.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();
    }

    /**
     * Case 6 : Create a page in feature branch, merge feature branch into master
     * Check if the permissions are getting updated on the 
     */
    @Test
    @WithUserDetails(value = "api_user")
    public void testCanEditPermissions_afterResourceMergedToMaster() {
        Mockito.when(pluginExecutorHelper.getPluginExecutor(Mockito.any())).thenReturn(Mono.just(new MockPluginExecutor()));

        PermissionGroup permissionGroup = new PermissionGroup();
        permissionGroup.setName("New role for testCanEditPermissions_afterResourceMergedToMaster");
        PermissionGroup createdPermissionGroup = permissionGroupService.create(permissionGroup).block();

        // Get Page2 in master branch
        NewPage page2InMaster = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(mergedApplicationToMasterId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page2")).next().block();

        // Apply manage permission to application in master branch
        genericDatabaseOperation.updatePolicies(page2InMaster.getId(), createdPermissionGroup.getId(), List.of(AclPermission.MANAGE_PAGES), List.of(), NewPage.class).block();

        // Get Page2 in master branch
        Mono<NewPage> page2InMasterMono = reactiveMongoOperations.query(NewPage.class)
                .matching(Criteria.where("applicationId").is(mergedApplicationToMasterId))
                .all()
                .filter(page -> page.getPublishedPage().getName().equals("Page2")).next();

        // Verify if change is applied on Page2 in master branch
        StepVerifier.create(page2InMasterMono)
                .assertNext(page -> {
                    assertThat(page.getPolicies()).anyMatch(policy -> {
                        return policy.getPermission().equals(AclPermission.MANAGE_PAGES.getValue())
                                && policy.getPermissionGroups().contains(createdPermissionGroup.getId());
                    });
                })
                .verifyComplete();
    }
}

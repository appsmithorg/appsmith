package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.domains.Workspace;
import com.appsmith.server.dtos.ApprovalRequestCreationDTO;
import com.appsmith.server.dtos.ApprovalRequestResolutionDTO;
import com.appsmith.server.dtos.InviteUsersDTO;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.UserGroupDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.CachedFeatures;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.UserUtils;
import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.repositories.PermissionGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.services.FeatureFlagService;
import com.appsmith.server.services.UserGroupService;
import com.appsmith.server.services.UserService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.UserAndAccessManagementService;
import com.appsmith.server.workflows.helper.WorkflowProxyHelper;
import com.appsmith.server.workflows.interact.InteractApprovalRequestService;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mockito;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.mock.mockito.SpyBean;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextImpl;
import org.springframework.security.test.context.support.WithUserDetails;
import org.springframework.test.context.junit.jupiter.SpringExtension;
import org.springframework.util.LinkedMultiValueMap;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.test.StepVerifier;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.Set;

import static com.appsmith.server.acl.AclPermission.READ_APPROVAL_REQUESTS;
import static com.appsmith.server.acl.AclPermission.RESOLVE_APPROVAL_REQUESTS;
import static com.appsmith.server.constants.ApprovalRequestStatus.PENDING;
import static com.appsmith.server.constants.FieldName.APPROVAL_REQUEST_ROLE_PREFIX;
import static com.appsmith.server.constants.FieldName.WORKFLOW;
import static com.appsmith.server.constants.QueryParams.RESOLUTION;
import static com.appsmith.server.constants.QueryParams.RESOLVED_BY;
import static com.appsmith.server.constants.QueryParams.STATUS;
import static com.appsmith.server.constants.ce.FieldNameCE.ADMINISTRATOR;
import static com.appsmith.server.constants.ce.FieldNameCE.DEVELOPER;
import static com.appsmith.server.constants.ce.FieldNameCE.VIEWER;
import static java.lang.Boolean.TRUE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;

@ExtendWith(SpringExtension.class)
@SpringBootTest
@Slf4j
class CrudApprovalRequestServiceTest {

    @SpyBean
    FeatureFlagService featureFlagService;

    @Autowired
    CrudApprovalRequestService crudApprovalRequestService;

    @Autowired
    InteractApprovalRequestService interactApprovalRequestService;

    @Autowired
    WorkspaceService workspaceService;

    @Autowired
    CrudWorkflowService workflowService;

    @Autowired
    UserService userService;

    @Autowired
    UserGroupService userGroupService;

    @Autowired
    UserUtils userUtils;

    @Autowired
    UserRepository userRepository;

    @Autowired
    PermissionGroupRepository permissionGroupRepository;

    @Autowired
    ApprovalRequestRepository approvalRequestRepository;

    @Autowired
    UserAndAccessManagementService userAndAccessManagementService;

    @SpyBean
    private WorkflowProxyHelper workflowProxyHelper;

    Workspace workspace = null;
    Workflow workflow = null;
    PermissionGroup workspaceAdminRole = null;
    PermissionGroup workspaceDevRole = null;
    PermissionGroup workspaceViewRole = null;

    private <I> Mono<I> runAs(Mono<I> input, User user, String password) {
        log.info("Running as user: {}", user.getEmail());
        return input.contextWrite((ctx) -> {
            SecurityContext securityContext = new SecurityContextImpl(
                    new UsernamePasswordAuthenticationToken(user, password, user.getAuthorities()));
            return ctx.put(SecurityContext.class, Mono.just(securityContext));
        });
    }

    @BeforeEach
    void setUp() {
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.release_workflows_enabled)))
                .thenReturn(Mono.just(TRUE));
        Mockito.when(featureFlagService.check(eq(FeatureFlagEnum.license_gac_enabled)))
                .thenReturn(Mono.just(TRUE));
        CachedFeatures cachedFeatures = new CachedFeatures();
        cachedFeatures.setFeatures(Map.of(
                FeatureFlagEnum.license_gac_enabled.name(),
                TRUE,
                FeatureFlagEnum.release_workflows_enabled.name(),
                TRUE));
        Mockito.when(featureFlagService.getCachedTenantFeatureFlags()).thenReturn(cachedFeatures);

        Workspace workspace1 = new Workspace();
        workspace1.setName("CrudApprovalRequestServiceTest");
        workspace = workspaceService.create(workspace1).block();

        List<PermissionGroup> workspaceRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(workspace.getId(), Workspace.class.getSimpleName())
                .collectList()
                .block();

        workspaceAdminRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(ADMINISTRATOR))
                .findFirst()
                .get();
        workspaceDevRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(DEVELOPER))
                .findFirst()
                .get();
        workspaceViewRole = workspaceRoles.stream()
                .filter(role -> role.getName().startsWith(VIEWER))
                .findFirst()
                .get();

        Workflow workflow1 = new Workflow();
        workflow1.setName("CrudApprovalRequestServiceTest");
        workflow = workflowService.createWorkflow(workflow1, workspace.getId()).block();

        User apiUser = userRepository.findByCaseInsensitiveEmail("api_user").block();
        userUtils.makeSuperUser(List.of(apiUser)).block();
    }

    @AfterEach
    void tearDown() {
        Workflow deletedCreatedWorkflow =
                workflowService.deleteWorkflow(workflow.getId()).block();
        Workspace deleteCreatedWorkspace =
                workspaceService.archiveById(workspace.getId()).block();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidCreateApprovalRequest_emptyWorkflowId() {
        String testName = "testInvalidCreateApprovalRequest_emptyWorkflowId";

        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        Mono<ApprovalRequest> approvalRequestMono =
                crudApprovalRequestService.createApprovalRequest(approvalRequestCreationDTO);

        StepVerifier.create(approvalRequestMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_CREATION.getMessage(
                                    "Workflow ID can't be empty."));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidCreateApprovalRequest_emptyRequestUsersAndGroups() {
        String testName = "testInvalidCreateApprovalRequest_emptyRequestUsersAndGroups";

        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        approvalRequestCreationDTO.setWorkflowId("random-workflow-id");
        Mono<ApprovalRequest> approvalRequestMono =
                crudApprovalRequestService.createApprovalRequest(approvalRequestCreationDTO);

        StepVerifier.create(approvalRequestMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_CREATION.getMessage(
                                    "Both users and groups can't be empty."));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidCreateApprovalRequest_emptyAllowedResolutions() {
        String testName = "testInvalidCreateApprovalRequest_emptyRequestUsersAndGroups";

        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        approvalRequestCreationDTO.setWorkflowId("random-workflow-id");
        approvalRequestCreationDTO.setRequestToUsers(Set.of("random"));
        Mono<ApprovalRequest> approvalRequestMono =
                crudApprovalRequestService.createApprovalRequest(approvalRequestCreationDTO);

        StepVerifier.create(approvalRequestMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_CREATION.getMessage(
                                    "Allowed resolutions can't be empty."));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidCreateApprovalRequest_emptyRunId() {
        String testName = "testInvalidCreateApprovalRequest_emptyRunId";

        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        approvalRequestCreationDTO.setWorkflowId("random-workflow-id");
        approvalRequestCreationDTO.setRequestToUsers(Set.of("random"));
        approvalRequestCreationDTO.setAllowedResolutions(Set.of("resolution1", "resolution2"));
        Mono<ApprovalRequest> approvalRequestMono =
                crudApprovalRequestService.createApprovalRequest(approvalRequestCreationDTO);

        StepVerifier.create(approvalRequestMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_CREATION.getMessage(
                                    "Run ID can't be empty."));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidCreateApprovalRequest_invalidWorkflowId() {
        String testName = "testInvalidCreateApprovalRequest_invalidWorkflowId";

        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        approvalRequestCreationDTO.setWorkflowId("random-workflow-id");
        approvalRequestCreationDTO.setRequestToUsers(Set.of("api_user"));
        Set<String> allowedResolutions = Set.of("resolution1, resolution2");
        approvalRequestCreationDTO.setAllowedResolutions(allowedResolutions);
        approvalRequestCreationDTO.setRunId("random-run-id");
        Mono<ApprovalRequest> approvalRequestMono =
                crudApprovalRequestService.createApprovalRequest(approvalRequestCreationDTO);

        StepVerifier.create(approvalRequestMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.ACL_NO_RESOURCE_FOUND.getMessage(WORKFLOW, "random-workflow-id"));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidCreateApprovalRequest_invalidGroupId() {
        String testName = "testInvalidCreateApprovalRequest_invalidGroupId";

        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        approvalRequestCreationDTO.setWorkflowId(workflow.getId());
        approvalRequestCreationDTO.setRequestToGroups(Set.of("random-group-id"));
        Set<String> allowedResolutions = Set.of("resolution1", "resolution2");
        approvalRequestCreationDTO.setAllowedResolutions(allowedResolutions);
        approvalRequestCreationDTO.setRunId("random-run-id");
        Mono<ApprovalRequest> approvalRequestMono =
                crudApprovalRequestService.createApprovalRequest(approvalRequestCreationDTO);

        StepVerifier.create(approvalRequestMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_CREATION.getMessage(
                                    "No user or group found from the provided input."));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testInvalidCreateApprovalRequest_nonExistentUsername() {
        String testName = "testInvalidCreateApprovalRequest_invalidGroupId";

        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        approvalRequestCreationDTO.setWorkflowId(workflow.getId());
        approvalRequestCreationDTO.setRequestToUsers(Set.of("random-username"));
        Set<String> allowedResolutions = Set.of("resolution1", "resolution2");
        approvalRequestCreationDTO.setAllowedResolutions(allowedResolutions);
        approvalRequestCreationDTO.setRunId("random-run-id");
        Mono<ApprovalRequest> approvalRequestMono =
                crudApprovalRequestService.createApprovalRequest(approvalRequestCreationDTO);

        StepVerifier.create(approvalRequestMono)
                .expectErrorMatches(throwable -> {
                    assertThat(throwable).isInstanceOf(AppsmithException.class);
                    assertThat(throwable.getMessage())
                            .contains(AppsmithError.INVALID_APPROVAL_REQUEST_CREATION.getMessage(
                                    "No user or group found from the provided input."));
                    return true;
                })
                .verify();
    }

    @Test
    @WithUserDetails(value = "api_user")
    public void testValidCreateApprovalRequest() {
        String testName = "testValidCreateApprovalRequest";

        UserGroup userGroup = new UserGroup();
        userGroup.setName(testName);
        UserGroupDTO createdUserGroupDTO =
                userGroupService.createGroup(userGroup).block();

        User user = new User();
        user.setEmail(testName);
        user.setPassword(testName);
        User createdUser = userService.create(user).block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;
        String approvalRequestRunId = "Run ID: " + testName;

        ApprovalRequest approvalRequest = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                createdUser,
                createdUserGroupDTO);

        assertThat(approvalRequest).isNotNull();
        assertThat(approvalRequest.getId()).isNotEmpty();
        assertThat(approvalRequest.getTitle()).isEqualTo(approvalRequestTitle);
        assertThat(approvalRequest.getDescription()).isEqualTo(approvalRequestMessage);
        assertThat(approvalRequest.getWorkflowId()).isEqualTo(workflow.getId());
        assertThat(approvalRequest.getResolutionStatus()).isEqualTo(PENDING);
        assertThat(approvalRequest.getAllowedResolutions()).containsExactlyInAnyOrderElementsOf(allowedResolutions);
        assertThat(approvalRequest.getRunId()).isEqualTo(approvalRequestRunId);

        List<PermissionGroup> approvalRequestRoles = permissionGroupRepository
                .findByDefaultDomainIdAndDefaultDomainType(
                        approvalRequest.getId(), ApprovalRequest.class.getSimpleName())
                .collectList()
                .block();
        assertThat(approvalRequestRoles).hasSize(1);
        PermissionGroup approvalRequestRole = approvalRequestRoles.get(0);
        assertThat(approvalRequestRole.getId()).isNotEmpty();
        assertThat(approvalRequestRole.getName())
                .isEqualTo(String.format(APPROVAL_REQUEST_ROLE_PREFIX, approvalRequest.getId()));
        assertThat(approvalRequestRole.getAssignedToUserIds()).containsOnly(createdUser.getId());
        assertThat(approvalRequestRole.getAssignedToGroupIds()).containsOnly(createdUserGroupDTO.getId());

        Set<Policy> expectedApprovalRequestPolicies = new HashSet<>();
        Policy readApprovalRequestPolicy = Policy.builder()
                .permission(READ_APPROVAL_REQUESTS.getValue())
                .permissionGroups(Set.of(approvalRequestRole.getId()))
                .build();
        Policy resolveApprovalRequestPolicy = Policy.builder()
                .permission(RESOLVE_APPROVAL_REQUESTS.getValue())
                .permissionGroups(Set.of(approvalRequestRole.getId()))
                .build();
        expectedApprovalRequestPolicies.add(readApprovalRequestPolicy);
        expectedApprovalRequestPolicies.add(resolveApprovalRequestPolicy);

        assertThat(approvalRequest.getPolicies()).isEqualTo(expectedApprovalRequestPolicies);
    }

    @Test
    @WithUserDetails("api_user")
    public void testGetAllApprovalRequests() {
        String testName = "testGetAllApprovalRequests";
        Mockito.doReturn(Mono.just(new JSONObject()))
                .when(workflowProxyHelper)
                .updateApprovalRequestResolutionOnProxy(any());

        User user1 = new User();
        user1.setEmail(testName + 1);
        user1.setPassword(testName);
        User createdUser1 = userService.create(user1).block();

        User user2 = new User();
        user2.setEmail(testName + 2);
        user2.setPassword(testName);
        User createdUser2 = userService.create(user2).block();

        UserGroup userGroup1 = new UserGroup();
        userGroup1.setName(testName);
        userGroup1.setUsers(Set.of(createdUser1.getId()));
        UserGroupDTO createdUserGroupDTO1 =
                userGroupService.createGroup(userGroup1).block();

        UserGroup userGroup2 = new UserGroup();
        userGroup2.setName(testName);
        userGroup2.setUsers(Set.of(createdUser2.getId()));
        UserGroupDTO createdUserGroupDTO2 =
                userGroupService.createGroup(userGroup2).block();

        UserGroup userGroup3 = new UserGroup();
        userGroup3.setName(testName);
        userGroup3.setUsers(Set.of(createdUser1.getId(), createdUser2.getId()));
        UserGroupDTO createdUserGroupDTO3 =
                userGroupService.createGroup(userGroup3).block();

        InviteUsersDTO inviteUsersDTO = new InviteUsersDTO();
        inviteUsersDTO.setGroups(Set.of(createdUserGroupDTO3.getId()));
        inviteUsersDTO.setPermissionGroupId(workspaceAdminRole.getId());

        userAndAccessManagementService.inviteUsers(inviteUsersDTO, "test").block();

        String resolution1 = "resolution1";
        String resolution2 = "resolution2";
        Set<String> allowedResolutions = Set.of(resolution1, resolution2);
        String approvalRequestTitle = "Title: " + testName;
        String approvalRequestMessage = "Message: " + testName;
        String approvalRequestRunId = "Run ID: " + testName;

        ApprovalRequest approvalRequestUser1Resolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                createdUser1,
                null);
        ApprovalRequest approvalRequestUser1Unresolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                createdUser1,
                null);
        ApprovalRequest approvalRequestUser2Resolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                createdUser2,
                null);
        ApprovalRequest approvalRequestUser2Unresolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                createdUser2,
                null);
        ApprovalRequest approvalRequestGroup1Resolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                null,
                createdUserGroupDTO1);
        ApprovalRequest approvalRequestGroup1Unresolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                null,
                createdUserGroupDTO1);
        ApprovalRequest approvalRequestGroup2Resolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                null,
                createdUserGroupDTO2);
        ApprovalRequest approvalRequestGroup2Unresolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                null,
                createdUserGroupDTO2);
        ApprovalRequest approvalRequestGroup3Resolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                null,
                createdUserGroupDTO3);
        ApprovalRequest approvalRequestGroup3Unresolved = createTestApprovalRequest(
                approvalRequestTitle,
                approvalRequestMessage,
                allowedResolutions,
                approvalRequestRunId,
                null,
                createdUserGroupDTO3);

        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser1_noFilters = runAs(
                        crudApprovalRequestService.getPaginatedApprovalRequests(new LinkedMultiValueMap<>()),
                        createdUser1,
                        testName)
                .block();
        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser2_noFilters = runAs(
                        crudApprovalRequestService.getPaginatedApprovalRequests(new LinkedMultiValueMap<>()),
                        createdUser2,
                        testName)
                .block();

        // Validations for User1
        assertThat(approvalRequestPageCreatedUser1_noFilters).isNotNull();
        assertThat(approvalRequestPageCreatedUser1_noFilters.getStartIndex()).isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser1_noFilters.getCount()).isEqualTo(6);
        assertThat(approvalRequestPageCreatedUser1_noFilters.getTotal()).isEqualTo(6);
        assertThat(approvalRequestPageCreatedUser1_noFilters.getContent()).hasSize(6);

        // Validations for User2
        assertThat(approvalRequestPageCreatedUser2_noFilters).isNotNull();
        assertThat(approvalRequestPageCreatedUser2_noFilters.getStartIndex()).isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser2_noFilters.getCount()).isEqualTo(6);
        assertThat(approvalRequestPageCreatedUser2_noFilters.getTotal()).isEqualTo(6);
        assertThat(approvalRequestPageCreatedUser2_noFilters.getContent()).hasSize(6);

        MultiValueMap<String, String> resolutionStatusResolvedFilter = new LinkedMultiValueMap<>();
        resolutionStatusResolvedFilter.add(STATUS, "RESOLVED");

        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_beforeResolution =
                runAs(
                                crudApprovalRequestService.getPaginatedApprovalRequests(resolutionStatusResolvedFilter),
                                createdUser1,
                                testName)
                        .block();
        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_beforeResolution =
                runAs(
                                crudApprovalRequestService.getPaginatedApprovalRequests(resolutionStatusResolvedFilter),
                                createdUser2,
                                testName)
                        .block();

        // Validations for User1
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_beforeResolution)
                .isNotNull();
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_beforeResolution.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_beforeResolution.getCount())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_beforeResolution.getTotal())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_beforeResolution.getContent())
                .hasSize(0);

        // Validations for User2
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_beforeResolution)
                .isNotNull();
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_beforeResolution.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_beforeResolution.getCount())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_beforeResolution.getTotal())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_beforeResolution.getContent())
                .hasSize(0);

        resolveApprovalRequestInviteUser(approvalRequestUser1Resolved, "", resolution1, createdUser1, testName)
                .block();
        resolveApprovalRequestInviteUser(approvalRequestUser2Resolved, "", resolution1, createdUser2, testName)
                .block();
        resolveApprovalRequestInviteUser(approvalRequestGroup1Resolved, "", resolution1, createdUser1, testName)
                .block();
        resolveApprovalRequestInviteUser(approvalRequestGroup2Resolved, "", resolution1, createdUser2, testName)
                .block();
        resolveApprovalRequestInviteUser(approvalRequestGroup3Resolved, "", resolution2, createdUser1, testName)
                .block();

        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_afterResolution =
                runAs(
                                crudApprovalRequestService.getPaginatedApprovalRequests(resolutionStatusResolvedFilter),
                                createdUser1,
                                testName)
                        .block();
        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_afterResolution =
                runAs(
                                crudApprovalRequestService.getPaginatedApprovalRequests(resolutionStatusResolvedFilter),
                                createdUser2,
                                testName)
                        .block();

        // Validations for User1
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_afterResolution)
                .isNotNull();
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_afterResolution.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_afterResolution.getCount())
                .isEqualTo(3);
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_afterResolution.getTotal())
                .isEqualTo(3);
        assertThat(approvalRequestPageCreatedUser1_resolutionStatusResolvedFilter_afterResolution.getContent())
                .hasSize(3);

        // Validations for User2
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_afterResolution)
                .isNotNull();
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_afterResolution.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_afterResolution.getCount())
                .isEqualTo(3);
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_afterResolution.getTotal())
                .isEqualTo(3);
        assertThat(approvalRequestPageCreatedUser2_resolutionStatusResolvedFilter_afterResolution.getContent())
                .hasSize(3);

        MultiValueMap<String, String> resolutionResolution1Filter = new LinkedMultiValueMap<>();
        resolutionResolution1Filter.add(RESOLUTION, "resolution1");

        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser1_resolutionResolution1Filter = runAs(
                        crudApprovalRequestService.getPaginatedApprovalRequests(resolutionResolution1Filter),
                        createdUser1,
                        testName)
                .block();
        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser2_resolutionResolution1Filter = runAs(
                        crudApprovalRequestService.getPaginatedApprovalRequests(resolutionResolution1Filter),
                        createdUser2,
                        testName)
                .block();

        // Validations for User1
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution1Filter).isNotNull();
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution1Filter.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution1Filter.getCount())
                .isEqualTo(2);
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution1Filter.getTotal())
                .isEqualTo(2);
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution1Filter.getContent())
                .hasSize(2);

        // Validations for User2
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution1Filter).isNotNull();
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution1Filter.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution1Filter.getCount())
                .isEqualTo(2);
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution1Filter.getTotal())
                .isEqualTo(2);
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution1Filter.getContent())
                .hasSize(2);

        MultiValueMap<String, String> resolutionResolution2Filter = new LinkedMultiValueMap<>();
        resolutionResolution2Filter.add(RESOLUTION, "resolution2");

        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser1_resolutionResolution2Filter = runAs(
                        crudApprovalRequestService.getPaginatedApprovalRequests(resolutionResolution2Filter),
                        createdUser1,
                        testName)
                .block();
        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser2_resolutionResolution2Filter = runAs(
                        crudApprovalRequestService.getPaginatedApprovalRequests(resolutionResolution2Filter),
                        createdUser2,
                        testName)
                .block();

        // Validations for User1
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution2Filter).isNotNull();
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution2Filter.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution2Filter.getCount())
                .isEqualTo(1);
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution2Filter.getTotal())
                .isEqualTo(1);
        assertThat(approvalRequestPageCreatedUser1_resolutionResolution2Filter.getContent())
                .hasSize(1);

        // Validations for User2
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution2Filter).isNotNull();
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution2Filter.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution2Filter.getCount())
                .isEqualTo(1);
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution2Filter.getTotal())
                .isEqualTo(1);
        assertThat(approvalRequestPageCreatedUser2_resolutionResolution2Filter.getContent())
                .hasSize(1);

        MultiValueMap<String, String> resolvedByCreatedUser1Filter = new LinkedMultiValueMap<>();
        resolvedByCreatedUser1Filter.add(RESOLVED_BY, createdUser1.getUsername());

        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser1_resolvedByCreatedUser1Filter = runAs(
                        crudApprovalRequestService.getPaginatedApprovalRequests(resolvedByCreatedUser1Filter),
                        createdUser1,
                        testName)
                .block();
        PagedDomain<ApprovalRequest> approvalRequestPageCreatedUser2_resolvedByCreatedUser1Filter = runAs(
                        crudApprovalRequestService.getPaginatedApprovalRequests(resolvedByCreatedUser1Filter),
                        createdUser2,
                        testName)
                .block();

        // Validations for User1
        assertThat(approvalRequestPageCreatedUser1_resolvedByCreatedUser1Filter).isNotNull();
        assertThat(approvalRequestPageCreatedUser1_resolvedByCreatedUser1Filter.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser1_resolvedByCreatedUser1Filter.getCount())
                .isEqualTo(3);
        assertThat(approvalRequestPageCreatedUser1_resolvedByCreatedUser1Filter.getTotal())
                .isEqualTo(3);
        assertThat(approvalRequestPageCreatedUser1_resolvedByCreatedUser1Filter.getContent())
                .hasSize(3);

        // Validations for User2
        assertThat(approvalRequestPageCreatedUser2_resolvedByCreatedUser1Filter).isNotNull();
        assertThat(approvalRequestPageCreatedUser2_resolvedByCreatedUser1Filter.getStartIndex())
                .isEqualTo(0);
        assertThat(approvalRequestPageCreatedUser2_resolvedByCreatedUser1Filter.getCount())
                .isEqualTo(1);
        assertThat(approvalRequestPageCreatedUser2_resolvedByCreatedUser1Filter.getTotal())
                .isEqualTo(1);
        assertThat(approvalRequestPageCreatedUser2_resolvedByCreatedUser1Filter.getContent())
                .hasSize(1);
    }

    private ApprovalRequest createTestApprovalRequest(
            String approvalRequestTitle,
            String approvalRequestMessage,
            Set<String> allowedResolutions,
            String approvalRequestRunId,
            User user,
            UserGroupDTO userGroupDTO) {
        ApprovalRequestCreationDTO approvalRequestCreationDTO = new ApprovalRequestCreationDTO();
        approvalRequestCreationDTO.setTitle(approvalRequestTitle);
        approvalRequestCreationDTO.setDescription(approvalRequestMessage);
        approvalRequestCreationDTO.setAllowedResolutions(allowedResolutions);
        approvalRequestCreationDTO.setWorkflowId(workflow.getId());
        approvalRequestCreationDTO.setRunId(approvalRequestRunId);
        if (Objects.nonNull(user)) {
            approvalRequestCreationDTO.setRequestToUsers(Set.of(user.getUsername()));
        }
        if (Objects.nonNull(userGroupDTO)) {
            approvalRequestCreationDTO.setRequestToGroups(Set.of(userGroupDTO.getId()));
        }

        return crudApprovalRequestService
                .createApprovalRequest(approvalRequestCreationDTO)
                .block();
    }

    private Mono<JSONObject> resolveApprovalRequestInviteUser(
            ApprovalRequest approvalRequest,
            String approvalRequestResolutionReason,
            String resolution,
            User user,
            String password) {
        ApprovalRequestResolutionDTO approvalRequestResolutionDTO = new ApprovalRequestResolutionDTO();
        approvalRequestResolutionDTO.setWorkflowId(workflow.getId());
        approvalRequestResolutionDTO.setRequestId(approvalRequest.getId());
        approvalRequestResolutionDTO.setResolution(resolution);
        approvalRequestResolutionDTO.setResolutionReason(approvalRequestResolutionReason);

        return runAs(
                interactApprovalRequestService.resolveApprovalRequest(approvalRequestResolutionDTO), user, password);
    }
}

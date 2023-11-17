package com.appsmith.server.workflows.crud;

import com.appsmith.external.models.Policy;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.domains.ApprovalRequest;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.domains.QApprovalRequest;
import com.appsmith.server.domains.User;
import com.appsmith.server.domains.UserGroup;
import com.appsmith.server.domains.Workflow;
import com.appsmith.server.dtos.ApprovalRequestCreationDTO;
import com.appsmith.server.dtos.PagedDomain;
import com.appsmith.server.dtos.Permission;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ObjectUtils;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.repositories.ApprovalRequestRepository;
import com.appsmith.server.repositories.UserGroupRepository;
import com.appsmith.server.repositories.UserRepository;
import com.appsmith.server.repositories.WorkflowRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.solutions.PolicySolution;
import io.jsonwebtoken.lang.Collections;
import jakarta.validation.Validator;
import org.apache.commons.lang3.StringUtils;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.util.MultiValueMap;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;
import reactor.util.function.Tuple2;

import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

import static com.appsmith.server.acl.AclPermission.EXECUTE_WORKFLOWS;
import static com.appsmith.server.acl.AclPermission.READ_APPROVAL_REQUESTS;
import static com.appsmith.server.acl.AclPermission.RESOLVE_APPROVAL_REQUESTS;
import static com.appsmith.server.constants.FieldName.APPROVAL_REQUEST_ROLE_PREFIX;
import static com.appsmith.server.constants.FieldName.ASCENDING;
import static com.appsmith.server.constants.FieldName.WORKFLOW;
import static com.appsmith.server.constants.QueryParams.SORT;
import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
public class CrudApprovalRequestServiceImpl extends CrudApprovalRequestServiceCECompatibleImpl
        implements CrudApprovalRequestService {

    private final PolicySolution policySolution;
    private final WorkflowRepository workflowRepository;
    private final UserGroupRepository userGroupRepository;
    private final UserRepository userRepository;
    private final PermissionGroupService permissionGroupService;
    private final SessionUserService sessionUserService;

    public CrudApprovalRequestServiceImpl(
            Scheduler scheduler,
            Validator validator,
            MongoConverter mongoConverter,
            ReactiveMongoTemplate reactiveMongoTemplate,
            ApprovalRequestRepository repository,
            AnalyticsService analyticsService,
            PolicySolution policySolution,
            WorkflowRepository workflowRepository,
            UserGroupRepository userGroupRepository,
            UserRepository userRepository,
            PermissionGroupService permissionGroupService,
            SessionUserService sessionUserService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.policySolution = policySolution;
        this.workflowRepository = workflowRepository;
        this.userGroupRepository = userGroupRepository;
        this.userRepository = userRepository;
        this.permissionGroupService = permissionGroupService;
        this.sessionUserService = sessionUserService;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<ApprovalRequest> createApprovalRequest(ApprovalRequestCreationDTO approvalRequestCreationDTO) {
        Mono<Tuple2<List<User>, List<UserGroup>>> requestToUsersAndGroupsFromDbMono = getUsersAndUserGroups(
                        approvalRequestCreationDTO)
                .flatMap(pair -> {
                    List<User> users = pair.getT1();
                    List<UserGroup> groups = pair.getT2();
                    if (Collections.isEmpty(users) && Collections.isEmpty(groups)) {
                        return Mono.error(new AppsmithException(
                                AppsmithError.INVALID_APPROVAL_REQUEST_CREATION,
                                "No user or group found from the provided input."));
                    }
                    return Mono.just(pair);
                });

        Mono<Workflow> workflowMono = workflowRepository
                .findById(approvalRequestCreationDTO.getWorkflowId(), EXECUTE_WORKFLOWS)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, WORKFLOW, approvalRequestCreationDTO.getWorkflowId())));

        Mono<ApprovalRequest> approvalRequestCreateMono =
                workflowMono.flatMap(workflow -> requestToUsersAndGroupsFromDbMono.flatMap(pair -> {
                    List<User> requestToUsers = pair.getT1();
                    List<UserGroup> requestToGroups = pair.getT2();
                    ApprovalRequest approvalRequest = createApprovalRequestFromDTO(approvalRequestCreationDTO);
                    return super.create(approvalRequest)
                            .flatMap(created ->
                                    addPoliciesToApprovalRequestAndSave(created, requestToUsers, requestToGroups));
                }));

        return validateApprovalCreationRequest(approvalRequestCreationDTO).then(approvalRequestCreateMono);
    }

    private Mono<ApprovalRequestCreationDTO> validateApprovalCreationRequest(
            ApprovalRequestCreationDTO approvalRequestCreationDTO) {
        if (ValidationUtils.isEmptyParam(approvalRequestCreationDTO.getWorkflowId())) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_APPROVAL_REQUEST_CREATION, "Workflow ID can't be empty."));
        }

        if (ValidationUtils.isEmptyParam(approvalRequestCreationDTO.getRequestToUsers())
                && ValidationUtils.isEmptyParam(approvalRequestCreationDTO.getRequestToGroups())) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_APPROVAL_REQUEST_CREATION, "Both users and groups can't be empty."));
        }

        if (ValidationUtils.isEmptyParam(approvalRequestCreationDTO.getAllowedResolutions())) {
            return Mono.error(new AppsmithException(
                    AppsmithError.INVALID_APPROVAL_REQUEST_CREATION, "Allowed resolutions can't be empty."));
        }

        if (ValidationUtils.isEmptyParam(approvalRequestCreationDTO.getRunId())) {
            return Mono.error(
                    new AppsmithException(AppsmithError.INVALID_APPROVAL_REQUEST_CREATION, "Run ID can't be empty."));
        }
        return Mono.just(approvalRequestCreationDTO);
    }

    private Mono<Tuple2<List<User>, List<UserGroup>>> getUsersAndUserGroups(
            ApprovalRequestCreationDTO approvalRequestCreationDTO) {
        Mono<List<User>> usersMono = Mono.just(List.of());
        Mono<List<UserGroup>> userGroupsMono = Mono.just(List.of());

        if (!ValidationUtils.isEmptyParam(approvalRequestCreationDTO.getRequestToUsers())) {
            Set<String> caseInsensitiveEmails = approvalRequestCreationDTO.getRequestToUsers().stream()
                    .map(String::toLowerCase)
                    .collect(Collectors.toSet());
            usersMono = userRepository.findAllByEmails(caseInsensitiveEmails).collectList();
        }

        if (!ValidationUtils.isEmptyParam(approvalRequestCreationDTO.getRequestToGroups())) {
            userGroupsMono = userGroupRepository
                    .findAllById(approvalRequestCreationDTO.getRequestToGroups())
                    .collectList();
        }
        return Mono.zip(usersMono, userGroupsMono);
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_workflows_enabled)
    public Mono<PagedDomain<ApprovalRequest>> getPaginatedApprovalRequests(MultiValueMap<String, String> filters) {
        return repository.getAllWithFilters(
                filters, Optional.of(READ_APPROVAL_REQUESTS), getSortForGetApprovalRequests(filters));
    }

    private ApprovalRequest createApprovalRequestFromDTO(ApprovalRequestCreationDTO approvalRequestCreationDTO) {
        ApprovalRequest approvalRequest = new ApprovalRequest();
        approvalRequest.setTitle(approvalRequestCreationDTO.getTitle());
        approvalRequest.setDescription(approvalRequestCreationDTO.getDescription());
        approvalRequest.setWorkflowId(approvalRequestCreationDTO.getWorkflowId());
        approvalRequest.setUserInfo(approvalRequestCreationDTO.getUserInfo());
        approvalRequest.setAllowedResolutions(approvalRequestCreationDTO.getAllowedResolutions());
        approvalRequest.setRunId(approvalRequestCreationDTO.getRunId());
        return approvalRequest;
    }

    Optional<Sort> getSortForGetApprovalRequests(MultiValueMap<String, String> filters) {
        Sort defaultSort = Sort.by(Sort.Direction.DESC, fieldName(QApprovalRequest.approvalRequest.createdAt));
        if (filters.containsKey(SORT) && StringUtils.isEmpty(filters.getFirst(SORT))) {
            String sortOrder = filters.getFirst(SORT);
            if (ASCENDING.equalsIgnoreCase(sortOrder)) {
                return Optional.of(Sort.by(Sort.Direction.ASC, fieldName(QApprovalRequest.approvalRequest.createdAt)));
            }
        }
        return Optional.of(defaultSort);
    }

    Mono<ApprovalRequest> addPoliciesToApprovalRequestAndSave(
            ApprovalRequest approvalRequest, List<User> users, List<UserGroup> groups) {
        PermissionGroup approvalRequestRole = new PermissionGroup();
        approvalRequestRole.setName(String.format(APPROVAL_REQUEST_ROLE_PREFIX, approvalRequest.getId()));
        approvalRequestRole.setDefaultDomainType(ApprovalRequest.class.getSimpleName());
        approvalRequestRole.setDefaultDomainId(approvalRequest.getId());
        Mono<PermissionGroup> approvalRequestRoleMono =
                permissionGroupService.save(approvalRequestRole).cache();
        Mono<ApprovalRequest> approvalRequestWithUpdatedPoliciesMono = approvalRequestRoleMono
                .flatMap(savedRole -> {
                    savedRole.setPermissions(
                            Set.of(new Permission(approvalRequest.getId(), RESOLVE_APPROVAL_REQUESTS)));
                    Map<String, Policy> resolutionPolicies = policySolution.generatePolicyFromPermissionGroupForObject(
                            savedRole, approvalRequest.getId());
                    ApprovalRequest approvalRequest1WithPolicies =
                            policySolution.addPoliciesToExistingObject(resolutionPolicies, approvalRequest);
                    Update updatePoliciesForApprovalRequest = new Update();
                    ObjectUtils.setIfNotEmpty(
                            updatePoliciesForApprovalRequest,
                            fieldName(QApprovalRequest.approvalRequest.policies),
                            approvalRequest1WithPolicies.getPolicies());
                    return repository.updateAndReturn(
                            approvalRequest.getId(), updatePoliciesForApprovalRequest, Optional.empty());
                })
                .cache();
        return approvalRequestRoleMono
                .flatMap(role -> permissionGroupService.bulkAssignUsersAndUserGroupsToPermissionGroupsWithoutPermission(
                        users, groups, List.of(role)))
                .then(approvalRequestWithUpdatedPoliciesMono);
    }
}

package com.appsmith.server.applications.base;

import com.appsmith.external.models.Policy;
import com.appsmith.server.domains.Application;
import com.appsmith.server.dtos.InviteUsersToApplicationDTO;
import com.appsmith.server.dtos.MemberInfoDTO;
import com.appsmith.server.dtos.PermissionGroupInfoDTO;
import com.appsmith.server.dtos.UpdateApplicationRoleDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ResponseUtils;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.AssetService;
import com.appsmith.server.services.ConfigService;
import com.appsmith.server.services.PermissionGroupService;
import com.appsmith.server.services.SessionUserService;
import com.appsmith.server.services.UserDataService;
import com.appsmith.server.services.WorkspaceService;
import com.appsmith.server.solutions.ApplicationPermission;
import com.appsmith.server.solutions.DatasourcePermission;
import com.appsmith.server.solutions.PolicySolution;
import com.appsmith.server.solutions.WorkspacePermission;
import jakarta.validation.Validator;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;

@Service
public class ApplicationServiceCECompatibleImpl extends ApplicationServiceCEImpl
        implements ApplicationServiceCECompatible {
    public ApplicationServiceCECompatibleImpl(
            Validator validator,
            ApplicationRepository repository,
            AnalyticsService analyticsService,
            PolicySolution policySolution,
            ConfigService configService,
            ResponseUtils responseUtils,
            PermissionGroupService permissionGroupService,
            NewActionRepository newActionRepository,
            AssetService assetService,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            SessionUserService sessionUserService,
            UserDataService userDataService,
            WorkspaceService workspaceService,
            WorkspacePermission workspacePermission) {
        super(
                validator,
                repository,
                analyticsService,
                policySolution,
                configService,
                responseUtils,
                permissionGroupService,
                newActionRepository,
                assetService,
                datasourcePermission,
                applicationPermission,
                sessionUserService,
                userDataService,
                workspaceService,
                workspacePermission);
    }

    @Override
    public Mono<List<PermissionGroupInfoDTO>> fetchAllDefaultRoles(String applicationId) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<MemberInfoDTO>> inviteToApplication(
            InviteUsersToApplicationDTO inviteToApplicationDTO, String originHeader) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<MemberInfoDTO> updateRoleForMember(
            String applicationId, UpdateApplicationRoleDTO updateApplicationRoleDTO) {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    @Override
    public Mono<List<PermissionGroupInfoDTO>> fetchAllDefaultRolesWithoutPermissions() {
        return Mono.error(new AppsmithException(AppsmithError.UNSUPPORTED_OPERATION));
    }

    protected void updateModuleInstancePolicies(
            Application application,
            Boolean addViewAccess,
            List<Mono<Void>> monoList,
            Map<String, Policy> pagePolicyMap) {}
}

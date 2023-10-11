package com.appsmith.server.helpers;

import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.PermissionGroup;
import com.appsmith.server.helpers.ce_compatible.ApplicationServiceHelperCECompatibleImpl;
import com.appsmith.server.services.PermissionGroupService;
import org.apache.commons.lang3.StringUtils;
import org.springframework.stereotype.Component;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Objects;
import java.util.Optional;

import static com.appsmith.server.constants.FieldName.APPLICATION_DEVELOPER;
import static com.appsmith.server.constants.FieldName.APPLICATION_VIEWER;
import static com.appsmith.server.helpers.TextUtils.generateDefaultRoleNameForResource;

@Component
public class ApplicationServiceHelperImpl extends ApplicationServiceHelperCECompatibleImpl
        implements ApplicationServiceHelper {

    private final PermissionGroupService permissionGroupService;

    public ApplicationServiceHelperImpl(PermissionGroupService permissionGroupService) {
        this.permissionGroupService = permissionGroupService;
    }

    /**
     * This method updates the names of default application roles without permission, when the associated application
     * name is updated. Now we should not put this method behind the feature flag, because we want the DB to be in the
     * sane state, when we go through an upgrade or downgrade.
     * @param updateResource
     * @param updatedApplicationMono
     * @return
     */
    @Override
    public Mono<Application> updateApplicationDefaultRolesWhenApplicationUpdated(
            Application updateResource, Mono<Application> updatedApplicationMono) {
        if (StringUtils.isEmpty(updateResource.getName())) {
            return updatedApplicationMono;
        }
        String newApplicationName = updateResource.getName();
        return updatedApplicationMono.flatMap(application1 -> {
            /*
             * Here we check if the application which has been updated is the application from default branch, or not.
             * If the application is from any other branch other than the default branch, we don't update
             * the names of default application role.
             */
            if (!isDefaultBranchApplication(application1)) {
                return Mono.just(application1);
            }
            Flux<PermissionGroup> defaultApplicationRoles =
                    permissionGroupService.getAllDefaultRolesForApplication(application1, Optional.empty());
            Flux<PermissionGroup> updateDefaultApplicationRoles = defaultApplicationRoles.flatMap(role -> {
                role.setName(generateNewDefaultName(role.getName(), newApplicationName));
                return permissionGroupService.save(role);
            });
            return updateDefaultApplicationRoles.then(Mono.just(application1));
        });
    }

    private boolean isDefaultBranchApplication(Application application) {
        return Objects.isNull(application.getGitApplicationMetadata())
                || application
                        .getGitApplicationMetadata()
                        .getDefaultApplicationId()
                        .equals(application.getId());
    }

    private String generateNewDefaultName(String oldName, String applicationName) {
        if (oldName.startsWith(APPLICATION_DEVELOPER)) {
            return generateDefaultRoleNameForResource(APPLICATION_DEVELOPER, applicationName);
        } else if (oldName.startsWith(APPLICATION_VIEWER)) {
            return generateDefaultRoleNameForResource(APPLICATION_VIEWER, applicationName);
        }
        // If this is not a default group i.e. does not start with the expected prefix, don't update it.
        return oldName;
    }
}

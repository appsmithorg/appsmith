package com.appsmith.server.applications.base;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.dtos.GitAuthDTO;
import com.appsmith.server.services.CrudService;
import com.mongodb.client.result.UpdateResult;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.codec.multipart.Part;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Map;
import java.util.Optional;

public interface ApplicationServiceCE extends CrudService<Application, String> {

    Mono<Application> findByIdAndBranchName(String id, List<String> projectionFieldNames, String branchName);

    Mono<Application> findById(String id);

    Mono<Application> findById(String id, AclPermission aclPermission);

    Mono<Application> findById(String id, Optional<AclPermission> aclPermission);

    Mono<Application> findByIdAndWorkspaceId(String id, String workspaceId, AclPermission permission);

    Flux<Application> findByWorkspaceId(String workspaceId, AclPermission permission);

    Flux<Application> findByWorkspaceIdAndDefaultApplicationsInRecentlyUsedOrder(String workspaceId);

    Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission);

    Mono<Application> findByName(String name, AclPermission permission);

    Mono<Application> save(Application application);

    Mono<Application> update(String defaultApplicationId, Application application, String branchName);

    Mono<UpdateResult> update(String defaultApplicationId, Map<String, Object> fieldNameValueMap, String branchName);

    Mono<Application> createDefaultApplication(Application object);

    Mono<Application> archive(Application application);

    Mono<Application> changeViewAccess(String id, ApplicationAccessDTO applicationAccessDTO);

    Mono<Application> changeViewAccess(
            String defaultApplicationId, String branchName, ApplicationAccessDTO applicationAccessDTO);

    Flux<Application> findAllApplicationsByWorkspaceId(String workspaceId);

    Mono<Application> getApplicationInViewMode(String applicationId);

    Mono<Application> getApplicationInViewMode(String defaultApplicationId, String branchName);

    Mono<Application> saveLastEditInformation(String applicationId);

    Mono<Application> setTransientFields(Application application);

    Mono<GitAuth> createOrUpdateSshKeyPair(String applicationId, String keyType);

    Mono<GitAuthDTO> getSshKey(String applicationId);

    Mono<Application> findByBranchNameAndDefaultApplicationId(
            String branchName, String defaultApplicationId, AclPermission aclPermission);

    Mono<String> findBranchedApplicationId(
            Optional<String> branchName, String defaultApplicationId, Optional<AclPermission> permission);

    Mono<Application> findByBranchNameAndDefaultApplicationId(
            String branchName,
            String defaultApplicationId,
            List<String> projectionFieldNames,
            AclPermission aclPermission);

    Mono<Application> findByBranchNameAndDefaultApplicationIdAndFieldName(
            String branchName, String defaultApplicationId, String fieldName, AclPermission aclPermission);

    Mono<String> findBranchedApplicationId(String branchName, String defaultApplicationId, AclPermission permission);

    Flux<Application> findAllApplicationsByDefaultApplicationId(String defaultApplicationId, AclPermission permission);

    Mono<Long> getGitConnectedApplicationsCountWithPrivateRepoByWorkspaceId(String workspaceId);

    Flux<Application> getGitConnectedApplicationsByWorkspaceId(String workspaceId);

    String getRandomAppCardColor();

    Mono<UpdateResult> setAppTheme(
            String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission);

    Mono<Application> getApplicationByDefaultApplicationIdAndDefaultBranch(String defaultApplicationId);

    Mono<Application> findByIdAndExportWithConfiguration(String applicationId, Boolean exportWithConfiguration);

    Mono<Application> saveAppNavigationLogo(String branchName, String applicationId, Part filePart);

    public Mono<Void> deleteAppNavigationLogo(String branchName, String applicationId);

    Mono<Boolean> isApplicationNameTaken(String applicationName, String workspaceId, AclPermission permission);

    Mono<Boolean> isApplicationConnectedToGit(String applicationId);

    Mono<Void> updateProtectedBranches(String applicationId, List<String> protectedBranches);

    Flux<Application> filterByEntityFields(
            List<String> searchableEntityFields,
            String searchString,
            Pageable pageable,
            Sort sort,
            AclPermission permission);
}

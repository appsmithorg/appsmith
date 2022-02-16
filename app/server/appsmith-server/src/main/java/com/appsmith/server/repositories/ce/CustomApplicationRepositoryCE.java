package com.appsmith.server.repositories.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.ApplicationPage;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.repositories.AppsmithRepository;
import com.mongodb.client.result.UpdateResult;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Set;

public interface CustomApplicationRepositoryCE extends AppsmithRepository<Application> {

    Mono<Application> findByIdAndOrganizationId(String id, String orgId, AclPermission permission);

    Mono<Application> findByName(String name, AclPermission permission);

    Flux<Application> findByOrganizationId(String orgId, AclPermission permission);

    Flux<Application> findByMultipleOrganizationIds(Set<String> orgIds, AclPermission permission);

    Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission);

    Mono<UpdateResult> addPageToApplication(String applicationId, String pageId, boolean isDefault, String defaultPageId);

    Mono<UpdateResult> setPages(String applicationId, List<ApplicationPage> pages);

    Mono<UpdateResult> setDefaultPage(String applicationId, String pageId);

    Mono<UpdateResult> setGitAuth(String applicationId, GitAuth gitAuth, AclPermission aclPermission);

    Mono<Application> getApplicationByGitBranchAndDefaultApplicationId(String defaultApplicationId, String branchName, AclPermission aclPermission);

    Flux<Application> getApplicationByGitDefaultApplicationId(String defaultApplicationId);

    Mono<List<String>> getAllApplicationId(String organizationId);

    Mono<UpdateResult> setAppTheme(String applicationId, String editModeThemeId, String publishedModeThemeId, AclPermission aclPermission);

    Mono<Long> countByOrganizationId(String organizationId);

    Mono<Long> getGitConnectedApplicationWithPrivateRepoCount(String organizationId);

    Flux<Application> getGitConnectedApplicationByOrganizationId(String organizationId);
}

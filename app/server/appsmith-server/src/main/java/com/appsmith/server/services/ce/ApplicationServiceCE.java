package com.appsmith.server.services.ce;

import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.GitAuth;
import com.appsmith.server.dtos.ApplicationAccessDTO;
import com.appsmith.server.services.CrudService;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

public interface ApplicationServiceCE extends CrudService<Application, String> {

    Mono<Application> findById(String id);

    Mono<Application> findById(String id, AclPermission aclPermission);

    Mono<Application> findByIdAndOrganizationId(String id, String organizationId, AclPermission permission);

    Flux<Application> findByOrganizationId(String organizationId, AclPermission permission);

    Flux<Application> findByClonedFromApplicationId(String applicationId, AclPermission permission);

    Mono<Application> findByName(String name, AclPermission permission);

    Mono<Application> save(Application application);

    Mono<Application> update(String defaultApplicationId, Application application, String branchName);

    Mono<Application> createDefault(Application object);

    Mono<Application> archive(Application application);

    Mono<Application> changeViewAccess(String id, ApplicationAccessDTO applicationAccessDTO);

    Mono<Application> changeViewAccess(String defaultApplicationId, String branchName, ApplicationAccessDTO applicationAccessDTO);

    Flux<Application> findAllApplicationsByOrganizationId(String organizationId);

    Mono<Application> getApplicationInViewMode(String applicationId);

    Mono<Application> getApplicationInViewMode(String defaultApplicationId, String branchName);

    Mono<Application> saveLastEditInformation(String applicationId);

    Mono<Application> setTransientFields(Application application);

    Mono<GitAuth> createOrUpdateSshKeyPair(String applicationId);

    Mono<GitAuth> getSshKey(String applicationId);

    Mono<Application> findByBranchNameAndDefaultApplicationId(String branchName,
                                                              String defaultApplicationId,
                                                              AclPermission aclPermission);

    Mono<String> findBranchedApplicationId(String branchName, String defaultApplicationId, AclPermission permission);

    Flux<Application> findAllApplicationsByDefaultApplicationId(String defaultApplicationId);

    Mono<Long> getGitConnectedApplicationsCountWithPrivateRepoByOrgId(String organizationId);

    Flux<Application> getGitConnectedApplicationsByOrganizationId(String organizationId);

    String getRandomAppCardColor();

}

package com.appsmith.server.solutions;

import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.EnvironmentRepository;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.repositories.NewActionRepository;
import com.appsmith.server.repositories.NewPageRepository;
import com.appsmith.server.repositories.ThemeRepository;
import com.appsmith.server.solutions.ce.PolicySolutionCEImpl;
import org.springframework.stereotype.Service;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.Map;

@Service
public class PolicySolutionImpl extends PolicySolutionCEImpl implements PolicySolution {

    private final EnvironmentRepository environmentRepository;
    private final ModuleInstanceRepository moduleInstanceRepository;

    public PolicySolutionImpl(
            PolicyGenerator policyGenerator,
            ApplicationRepository applicationRepository,
            DatasourceRepository datasourceRepository,
            NewPageRepository newPageRepository,
            NewActionRepository newActionRepository,
            ActionCollectionRepository actionCollectionRepository,
            ThemeRepository themeRepository,
            DatasourcePermission datasourcePermission,
            ApplicationPermission applicationPermission,
            PagePermission pagePermission,
            EnvironmentRepository environmentRepository,
            ModuleInstanceRepository moduleInstanceRepository) {
        super(
                policyGenerator,
                applicationRepository,
                datasourceRepository,
                newPageRepository,
                newActionRepository,
                actionCollectionRepository,
                themeRepository,
                datasourcePermission,
                applicationPermission,
                pagePermission);
        this.environmentRepository = environmentRepository;
        this.moduleInstanceRepository = moduleInstanceRepository;
    }

    @Override
    public Flux<Environment> updateDefaultEnvironmentPoliciesByWorkspaceId(
            String workspaceId, Map<String, Policy> environmentPolicyMap, Boolean addViewAccess) {

        return environmentRepository
                .findByWorkspaceId(workspaceId)
                .filter(environment -> Boolean.TRUE.equals(environment.getIsDefault()))
                .flatMap(environment -> {
                    Environment updatedEnvironment;
                    if (addViewAccess) {
                        updatedEnvironment = this.addPoliciesToExistingObject(environmentPolicyMap, environment);
                    } else {
                        updatedEnvironment = this.removePoliciesFromExistingObject(environmentPolicyMap, environment);
                    }

                    return Mono.just(updatedEnvironment);
                })
                .collectList()
                .flatMapMany(environments -> environmentRepository.saveAll(environments));
    }

    /**
     * Instead of fetching actions by pageId, fetch actions by applicationId and then update the action policies
     * using the new ActionPoliciesMap. This ensures the following :
     * 1. Instead of bulk updating actions page wise, we do bulk update of actions in one go for the entire application.
     * 2. If the action is associated with different pages (in published/unpublished page due to movement of action), fetching
     * actions by applicationId ensures that we update ALL the actions and don't have to do special handling for the same.
     *
     * @param applicationId
     * @param moduleInstancePoliciesMap
     * @param addPolicyToObject
     * @return
     */
    @Override
    public Flux<ModuleInstance> updateWithPagePermissionsToAllItsModuleInstances(
            String applicationId, Map<String, Policy> moduleInstancePoliciesMap, Boolean addPolicyToObject) {

        return moduleInstanceRepository
                .findByApplicationId(applicationId)
                .map(moduleInstance -> {
                    if (addPolicyToObject) {
                        return addPoliciesToExistingObject(moduleInstancePoliciesMap, moduleInstance);
                    } else {
                        return removePoliciesFromExistingObject(moduleInstancePoliciesMap, moduleInstance);
                    }
                })
                .collectList()
                .flatMapMany(moduleInstanceRepository::saveAll);
    }
}

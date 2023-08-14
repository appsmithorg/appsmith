package com.appsmith.server.solutions;

import com.appsmith.external.models.Environment;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.PolicyGenerator;
import com.appsmith.server.repositories.ActionCollectionRepository;
import com.appsmith.server.repositories.ApplicationRepository;
import com.appsmith.server.repositories.DatasourceRepository;
import com.appsmith.server.repositories.EnvironmentRepository;
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
            EnvironmentRepository environmentRepository) {
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
}

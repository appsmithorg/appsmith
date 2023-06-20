package com.appsmith.server.services.ce;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.ModuleDTO;
import com.appsmith.external.models.Policy;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.domains.Module;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.repositories.ModuleRepository;
import com.appsmith.server.services.AnalyticsService;
import com.appsmith.server.services.BaseService;
import com.appsmith.server.services.NewActionService;
import jakarta.validation.Validator;
import org.springframework.data.mongodb.core.ReactiveMongoTemplate;
import org.springframework.data.mongodb.core.convert.MongoConverter;
import reactor.core.publisher.Mono;
import reactor.core.scheduler.Scheduler;

import java.util.Set;

public class ModuleServiceCEImpl extends BaseService<ModuleRepository, Module, String> implements ModuleServiceCE {

    private final ModuleRepository moduleRepository;
    private final NewActionService newActionService;

    public ModuleServiceCEImpl(Scheduler scheduler, Validator validator, MongoConverter mongoConverter, ReactiveMongoTemplate reactiveMongoTemplate, ModuleRepository repository, AnalyticsService analyticsService, NewActionService newActionService) {
        super(scheduler, validator, mongoConverter, reactiveMongoTemplate, repository, analyticsService);
        this.moduleRepository = repository;
        this.newActionService = newActionService;
    }

    @Override
    public Mono<ModuleDTO> createModule(ModuleDTO moduleDTO) {
        Module module = new Module();

        ActionDTO actionDTO = new ActionDTO();
        actionDTO.setName(moduleDTO.getName());
        actionDTO.setActionConfiguration(moduleDTO.getActionConfiguration());
        actionDTO.setDatasource(moduleDTO.getDatasource());


        NewAction moduleAction = new NewAction();
        moduleAction.setPluginId(moduleDTO.getPluginId());
        moduleAction.setPluginType(moduleDTO.getPluginType());
        moduleAction.setWorkspaceId(moduleDTO.getWorkspaceId());
        moduleAction.setUnpublishedAction(actionDTO);

        Policy policy = new Policy();
        policy.setPermission(AclPermission.EXECUTE_ACTIONS.getValue());
        policy.setPermissionGroups(
                Set.of(
                        "642e731932cef56b966a9c99",
                        "642e731932cef56b966a9c98"
                )
        );

        moduleAction.setPolicies(Set.of(policy));


        module.setPackageId(moduleDTO.getPackageId());
        module.setWorkspaceId(moduleDTO.getWorkspaceId());


        return moduleRepository.save(module)
                .flatMap(savedModule -> {
                    moduleAction.setModuleId(savedModule.getId());
                    return Mono.just(moduleAction);
                }).flatMap(mAction -> {
                    return newActionService.save(mAction)
                            .flatMap(savedAction-> {
                                module.setPublicActionId(savedAction.getId());
                                moduleDTO.setId(module.getId());
                                moduleDTO.setPublicActionId(moduleAction.getId());
                                return moduleRepository.save(module).thenReturn(moduleDTO);
                            });
                });
    }
}
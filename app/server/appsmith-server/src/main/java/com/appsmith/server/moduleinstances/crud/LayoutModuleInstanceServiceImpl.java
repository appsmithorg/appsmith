package com.appsmith.server.moduleinstances.crud;

import com.appsmith.external.models.CreatorContextType;
import com.appsmith.server.acl.AclPermission;
import com.appsmith.server.annotations.FeatureFlagged;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.domains.QModuleInstance;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.featureflags.FeatureFlagEnum;
import com.appsmith.server.helpers.ObjectUtils;
import com.appsmith.server.moduleinstances.permissions.ModuleInstancePermission;
import com.appsmith.server.newpages.base.NewPageService;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import com.appsmith.server.solutions.PagePermission;
import org.springframework.data.mongodb.core.query.Update;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import reactor.core.publisher.Flux;
import reactor.core.publisher.Mono;

import java.util.List;
import java.util.Optional;

import static com.appsmith.server.repositories.ce.BaseAppsmithRepositoryCEImpl.fieldName;

@Service
public class LayoutModuleInstanceServiceImpl extends LayoutModuleInstanceCECompatibleServiceImpl
        implements LayoutModuleInstanceService {
    private final ModuleInstanceRepository repository;
    private final ModuleInstancePermission moduleInstancePermission;
    private final NewPageService newPageService;
    private final PagePermission pagePermission;

    public LayoutModuleInstanceServiceImpl(
            ModuleInstanceRepository repository,
            ModuleInstancePermission moduleInstancePermission,
            NewPageService newPageService,
            PagePermission pagePermission) {
        super(repository);
        this.repository = repository;
        this.moduleInstancePermission = moduleInstancePermission;
        this.newPageService = newPageService;
        this.pagePermission = pagePermission;
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<List<ModuleInstanceDTO>> getAllModuleInstancesByContextIdAndContextTypeAndViewMode(
            String contextId, CreatorContextType contextType, ResourceModes resourceMode, String branchName) {

        Mono<String> branchedContextIdMono = findBranchedContextId(contextType, contextId, branchName);

        return branchedContextIdMono.flatMap(branchedContextId -> {
            Flux<ModuleInstance> moduleInstanceFlux;

            if (ResourceModes.EDIT.equals(resourceMode)) {
                moduleInstanceFlux = repository.findAllUnpublishedByContextIdAndContextType(
                        branchedContextId, contextType, moduleInstancePermission.getEditPermission());
            } else {
                moduleInstanceFlux = repository.findAllPublishedByContextIdAndContextType(
                        branchedContextId, contextType, moduleInstancePermission.getExecutePermission());
            }

            return moduleInstanceFlux
                    .flatMap(repository::setUserPermissionsInObject)
                    .flatMap(moduleInstance -> generateModuleInstanceByViewMode(moduleInstance, resourceMode))
                    .collectList();
        });
    }

    private Mono<String> findBranchedContextId(CreatorContextType contextType, String contextId, String branchName) {
        switch (contextType) {
            case PAGE:
                return newPageService.findBranchedPageId(branchName, contextId, pagePermission.getReadPermission());
            case MODULE:
                // TODO: Fetch branched contextId based on the context type when Git is implemented in modules
                return Mono.just(contextId);
            default:
                return Mono.error(new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.CONTEXT_TYPE));
        }
    }

    @Override
    @FeatureFlagged(featureFlagName = FeatureFlagEnum.release_query_module_enabled)
    public Mono<ModuleInstanceDTO> updateUnpublishedModuleInstance(
            ModuleInstanceDTO moduleInstanceDTO, String moduleInstanceId, String branchName, boolean isRefactor) {
        Mono<ModuleInstance> moduleInstanceMono = repository
                .findByBranchNameAndDefaultModuleInstanceId(
                        branchName, moduleInstanceId, moduleInstancePermission.getEditPermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_INSTANCE_ID, moduleInstanceId)));

        return moduleInstanceMono.flatMap(moduleInstance -> {
            validateModuleInstanceDTO(moduleInstanceDTO);
            Update updateObj = prepareUpdatableFieldsForModuleInstance(moduleInstanceDTO, isRefactor);

            return repository
                    .updateAndReturn(
                            moduleInstanceId, updateObj, Optional.of(moduleInstancePermission.getEditPermission()))
                    .flatMap(repository::setUserPermissionsInObject)
                    .flatMap(updatedModuleInstance -> setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
                            updatedModuleInstance, updatedModuleInstance.getUnpublishedModuleInstance()));
        });
    }

    private Update prepareUpdatableFieldsForModuleInstance(ModuleInstanceDTO moduleInstanceDTO, boolean isRefactor) {
        Update updateObj = new Update();
        String inputsPath = fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance) + "."
                + fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.inputs);
        String dynamicBindingPathListPath = fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance) + "."
                + fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.dynamicBindingPathList);
        String jsonPathKeysPath = fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance) + "."
                + fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.jsonPathKeys);

        if (isRefactor) {
            String namePath = fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance) + "."
                    + fieldName(QModuleInstance.moduleInstance.unpublishedModuleInstance.name);
            ObjectUtils.setIfNotEmpty(updateObj, namePath, moduleInstanceDTO.getName());
        }

        ObjectUtils.setIfNotEmpty(updateObj, inputsPath, moduleInstanceDTO.getInputs());

        updateObj.set(dynamicBindingPathListPath, moduleInstanceDTO.getDynamicBindingPathList());

        updateObj.set(jsonPathKeysPath, getExtractedKeys(moduleInstanceDTO));
        return updateObj;
    }

    @Override
    public Mono<ModuleInstance> findByBranchNameAndDefaultModuleInstanceId(
            String branchName, String defaultModuleInstanceId, AclPermission permission) {
        if (!StringUtils.hasLength(branchName)) {
            return repository
                    .findById(defaultModuleInstanceId, permission)
                    .switchIfEmpty(Mono.error(new AppsmithException(
                            AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.MODULE_INSTANCE, defaultModuleInstanceId)));
        }
        return repository
                .findByBranchNameAndDefaultModuleInstanceId(branchName, defaultModuleInstanceId, permission)
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND,
                        FieldName.MODULE_INSTANCE,
                        defaultModuleInstanceId + "," + branchName)));
    }

    @Override
    public Flux<ModuleInstance> findAllUnpublishedComposedModuleInstancesByRootModuleInstanceId(
            String rootModuleInstanceId, AclPermission permission) {
        return repository.findAllByRootModuleInstanceId(rootModuleInstanceId, Optional.ofNullable(permission));
    }
}

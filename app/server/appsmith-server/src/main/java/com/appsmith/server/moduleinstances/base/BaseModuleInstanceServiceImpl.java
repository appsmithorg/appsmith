package com.appsmith.server.moduleinstances.base;

import com.appsmith.external.helpers.MustacheHelper;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.MustacheBindingToken;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.helpers.ValidationUtils;
import com.appsmith.server.repositories.ModuleInstanceRepository;
import reactor.core.publisher.Mono;

import java.util.HashSet;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

public abstract class BaseModuleInstanceServiceImpl implements BaseModuleInstanceService {

    private final ModuleInstanceRepository repository;

    public BaseModuleInstanceServiceImpl(ModuleInstanceRepository repository) {
        this.repository = repository;
    }

    @Override
    public Mono<ModuleInstanceDTO> setTransientFieldsFromModuleInstanceToModuleInstanceDTO(
            ModuleInstance moduleInstance, ModuleInstanceDTO moduleInstanceDTO) {
        moduleInstanceDTO.setId(moduleInstance.getId());
        moduleInstanceDTO.setType(moduleInstance.getType());
        moduleInstanceDTO.setModuleUUID(moduleInstance.getModuleUUID());
        moduleInstanceDTO.setSourceModuleId(moduleInstance.getSourceModuleId());
        moduleInstanceDTO.setContextType(moduleInstanceDTO.getContextType());
        if (moduleInstanceDTO.getContextType() == CreatorContextType.PAGE) {
            moduleInstanceDTO.setContextId(moduleInstanceDTO.getPageId());
            moduleInstanceDTO.setApplicationId(moduleInstance.getApplicationId());
        } else if (moduleInstanceDTO.getContextType() == CreatorContextType.MODULE) {
            moduleInstanceDTO.setContextId(moduleInstanceDTO.getModuleId());
        }
        moduleInstanceDTO.setUserPermissions(moduleInstance.getUserPermissions());

        return Mono.just(moduleInstanceDTO);
    }

    @Override
    public Mono<ModuleInstanceDTO> generateModuleInstanceByViewMode(
            ModuleInstance moduleInstance, ResourceModes resourceMode) {
        ModuleInstanceDTO moduleInstanceDTO;
        if (moduleInstance.getDeletedAt() != null) {
            return Mono.empty();
        }

        if (resourceMode.equals(ResourceModes.EDIT)) {
            moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        } else {
            moduleInstanceDTO = moduleInstance.getPublishedModuleInstance();
        }

        return setTransientFieldsFromModuleInstanceToModuleInstanceDTO(moduleInstance, moduleInstanceDTO);
    }

    @Override
    public void validateModuleInstanceDTO(ModuleInstanceDTO moduleInstanceDTO) {
        if (ValidationUtils.isEmptyParam(moduleInstanceDTO.getContextType())) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.CONTEXT_TYPE);
        }
        if (ValidationUtils.isEmptyParam(moduleInstanceDTO.getContextId())) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.CONTEXT_ID);
        }
        if (ValidationUtils.isEmptyParam(moduleInstanceDTO.getSourceModuleId())) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.MODULE_ID);
        }
        if (ValidationUtils.isEmptyParam(moduleInstanceDTO.getName())) {
            throw new AppsmithException(AppsmithError.INVALID_PARAMETER, FieldName.NAME);
        }
    }

    @Override
    public ModuleInstance extractAndSetJsonPathKeys(ModuleInstance moduleInstance) {
        ModuleInstanceDTO moduleInstanceDTO = moduleInstance.getUnpublishedModuleInstance();
        Set<String> moduleInstanceKeys = getExtractedKeys(moduleInstanceDTO);
        Set<String> keys = new HashSet<>() {
            {
                addAll(moduleInstanceKeys);
            }
        };
        moduleInstanceDTO.setJsonPathKeys(keys);

        return moduleInstance;
    }

    protected Set<String> getExtractedKeys(ModuleInstanceDTO moduleInstanceDTO) {
        if (moduleInstanceDTO == null) {
            return new HashSet<>();
        }

        Map<String, String> moduleInstanceInputs = moduleInstanceDTO.getInputs();
        if (moduleInstanceInputs == null) {
            return new HashSet<>();
        }

        Set<MustacheBindingToken> keys = MustacheHelper.extractMustacheKeysFromFields(moduleInstanceInputs);

        return keys.stream().map(MustacheBindingToken::getValue).collect(Collectors.toSet());
    }
}

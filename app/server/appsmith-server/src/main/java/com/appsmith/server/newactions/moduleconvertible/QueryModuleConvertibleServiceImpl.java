package com.appsmith.server.newactions.moduleconvertible;

import com.appsmith.external.helpers.AppsmithBeanUtils;
import com.appsmith.external.helpers.Reusable;
import com.appsmith.external.models.ActionConfiguration;
import com.appsmith.external.models.ActionDTO;
import com.appsmith.external.models.CreatorContextType;
import com.appsmith.external.models.ModuleInput;
import com.appsmith.external.models.ModuleInputForm;
import com.appsmith.external.models.ModuleType;
import com.appsmith.server.constants.FieldName;
import com.appsmith.server.constants.ResourceModes;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.dtos.CreateModuleInstanceResponseDTO;
import com.appsmith.server.dtos.ModuleActionDTO;
import com.appsmith.server.dtos.ModuleConvertibleMetaDTO;
import com.appsmith.server.dtos.ModuleDTO;
import com.appsmith.server.dtos.ModuleInstanceDTO;
import com.appsmith.server.dtos.PackageDTO;
import com.appsmith.server.exceptions.AppsmithError;
import com.appsmith.server.exceptions.AppsmithException;
import com.appsmith.server.moduleconvertible.ModuleConvertibleService;
import com.appsmith.server.moduleconvertible.helper.ModuleConvertibleHelper;
import com.appsmith.server.moduleinstances.crud.CrudModuleInstanceService;
import com.appsmith.server.modules.crud.CrudModuleService;
import com.appsmith.server.modules.helpers.ModuleUtils;
import com.appsmith.server.newactions.base.NewActionService;
import com.appsmith.server.packages.crud.CrudPackageService;
import com.appsmith.server.publish.packages.internal.PublishPackageService;
import com.appsmith.server.solutions.ActionPermission;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.reactive.TransactionalOperator;
import reactor.core.publisher.Mono;
import reactor.util.function.Tuple2;
import reactor.util.function.Tuples;

import java.util.ArrayList;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j
public class QueryModuleConvertibleServiceImpl extends QueryModuleConvertibleServiceCECompatibleImpl
        implements ModuleConvertibleService<NewAction, NewAction> {
    private final NewActionService newActionService;
    private final ActionPermission actionPermission;
    private final CrudModuleInstanceService crudModuleInstanceService;
    private final PublishPackageService publishPackageService;
    private final CrudPackageService crudPackageService;
    private final CrudModuleService crudModuleService;
    private final TransactionalOperator transactionalOperator;
    private final ModuleConvertibleHelper moduleConvertibleHelper;

    @Override
    public Mono<Void> convertToModule(ModuleConvertibleMetaDTO moduleConvertibleMetaDTO) {

        return moduleConvertibleMetaDTO
                .getSourcePackageMono()
                .zipWith(moduleConvertibleMetaDTO.getPublicEntityMono())
                .flatMap(tuple2 -> {
                    // Fetch the source package and source ActionDTO
                    PackageDTO sourcePackage = tuple2.getT1();
                    ActionDTO publicEntity = (ActionDTO) tuple2.getT2();
                    moduleConvertibleMetaDTO.setSourcePackage(sourcePackage);
                    moduleConvertibleMetaDTO.setOriginPackageId(sourcePackage.getId());

                    // Save the pageId before resetting
                    final String pageId = publicEntity.getPageId();
                    resetContextSpecificFieldsAndSetContextType(publicEntity);

                    Mono<List<ModuleDTO>> moduleNamesMono =
                            crudModuleService.getAllModuleDTOs(sourcePackage.getId(), ResourceModes.EDIT);

                    // Generate inputs for the module to be created
                    return moduleNamesMono
                            .flatMap(existingModuleDTOs -> {
                                // Create module request DTO
                                ModuleDTO moduleDTO =
                                        createModuleDTO(sourcePackage.getId(), publicEntity, existingModuleDTOs);
                                // Set the inputs form to the module
                                List<ModuleInputForm> inputForms = constructInputsForm(publicEntity);
                                moduleDTO.setInputsForm(inputForms);

                                // Delete the unpublished version of the source query
                                Mono<ActionDTO> deleteOriginalQueryMono = newActionService.deleteUnpublishedAction(
                                        moduleConvertibleMetaDTO.getPublicEntityId());

                                // Prepare module instance creation request for the newly created module
                                final ModuleInstanceDTO moduleInstanceReqDTO =
                                        createModuleInstanceRequestDTO(pageId, publicEntity);

                                // Create module instance and set module instance and associated entities in the metaDTO
                                Mono<CreateModuleInstanceResponseDTO> createModuleInstanceMono =
                                        getCreateModuleInstanceResponseDTOMono(
                                                moduleConvertibleMetaDTO, moduleInstanceReqDTO);

                                return crudModuleService
                                        .createModule(moduleDTO)
                                        .flatMap(createdModuleDTO -> publishPackageService
                                                .publishPackage(sourcePackage.getId())
                                                .flatMap(published -> {
                                                    // Need to fetch the updated source package after the
                                                    // publish-package event as the version number has been updated
                                                    return crudPackageService
                                                            .getPackageDetails(sourcePackage.getId())
                                                            .flatMap(packageDetailsDTO -> {
                                                                moduleConvertibleMetaDTO.setSourcePackage(
                                                                        packageDetailsDTO.getPackageData());
                                                                moduleConvertibleMetaDTO.setOriginModuleId(
                                                                        createdModuleDTO.getId());
                                                                // Fetch the newly created module after publishing the
                                                                // package
                                                                Mono<Tuple2<PackageDTO, ModuleDTO>>
                                                                        consumablePackageAndModuleMono =
                                                                                fetchConsumablePackageAndModuleMono(
                                                                                        moduleConvertibleMetaDTO,
                                                                                        moduleInstanceReqDTO);
                                                                return consumablePackageAndModuleMono;
                                                            });
                                                })
                                                .then(Mono.defer(() -> deleteOriginalQueryMono))
                                                .then(Mono.defer(() -> createModuleInstanceMono))
                                                .thenReturn(createdModuleDTO))
                                        .flatMap(toBeUpdatedModuleDTO -> {
                                            // Reset default values to empty after module instance is created
                                            toBeUpdatedModuleDTO.getInputsForm().forEach(moduleInputForm -> {
                                                moduleInputForm
                                                        .getChildren()
                                                        .forEach(moduleInput -> moduleInput.setDefaultValue(""));
                                            });
                                            return crudModuleService
                                                    .updateModule(toBeUpdatedModuleDTO, toBeUpdatedModuleDTO.getId())
                                                    .flatMap(updatedModuleDTO -> {
                                                        moduleConvertibleMetaDTO
                                                                .getModuleDTO()
                                                                .setInputsForm(updatedModuleDTO.getInputsForm());
                                                        return publishPackageService.publishPackage(
                                                                sourcePackage.getId());
                                                    });
                                        });
                            })
                            .then()
                            .as(transactionalOperator::transactional);
                });
    }

    private Mono<CreateModuleInstanceResponseDTO> getCreateModuleInstanceResponseDTOMono(
            ModuleConvertibleMetaDTO moduleConvertibleMetaDTO, ModuleInstanceDTO moduleInstanceReqDTO) {
        Mono<CreateModuleInstanceResponseDTO> createModuleInstanceMono = crudModuleInstanceService
                .createModuleInstance(moduleInstanceReqDTO, moduleConvertibleMetaDTO.getBranchName())
                .map(createModuleInstanceResponseDTO -> {
                    moduleConvertibleMetaDTO.setModuleInstanceData(createModuleInstanceResponseDTO);
                    return createModuleInstanceResponseDTO;
                });
        return createModuleInstanceMono;
    }

    private Mono<Tuple2<PackageDTO, ModuleDTO>> fetchConsumablePackageAndModuleMono(
            ModuleConvertibleMetaDTO moduleConvertibleMetaDTO, ModuleInstanceDTO moduleInstanceReqDTO) {

        Mono<PackageDTO> consumablePackageMono = crudPackageService.getConsumablePackageBySourcePackageIdAndVersion(
                moduleConvertibleMetaDTO.getSourcePackage().getId(),
                moduleConvertibleMetaDTO.getSourcePackage().getVersion());
        return consumablePackageMono.flatMap(consumablePackageDTO -> {
            return crudModuleService
                    .getConsumableModuleByPackageIdAndOriginModuleId(
                            consumablePackageDTO.getId(), moduleConvertibleMetaDTO.getOriginModuleId())
                    .flatMap(consumableModuleDTO -> {
                        moduleInstanceReqDTO.setSourceModuleId(consumableModuleDTO.getId());

                        moduleConvertibleMetaDTO.setPackageDTO(consumablePackageDTO);
                        moduleConvertibleMetaDTO.setModuleDTO(consumableModuleDTO);

                        return Mono.just(Tuples.of(consumablePackageDTO, consumableModuleDTO));
                    });
        });
    }

    @Override
    public Mono<Reusable> getPublicEntityCandidateMono(String publicEntityCandidateId) {
        Mono<Reusable> publicEntityCandidateMono = newActionService
                .findById(publicEntityCandidateId, actionPermission.getDeletePermission())
                .switchIfEmpty(Mono.error(new AppsmithException(
                        AppsmithError.ACL_NO_RESOURCE_FOUND, FieldName.ACTION_ID, publicEntityCandidateId)))
                .flatMap(newAction -> newActionService.generateActionByViewMode(newAction, false));
        return publicEntityCandidateMono.cache();
    }

    private ModuleDTO createModuleDTO(String packageId, ActionDTO publicEntity, List<ModuleDTO> existingModuleDTOs) {
        ModuleDTO moduleDTO = new ModuleDTO();
        moduleDTO.setType(ModuleType.QUERY_MODULE);
        moduleDTO.setPackageId(packageId);
        String newModuleName = publicEntity.getName()
                + "Module"; // Adding `Module` as a suffix to avoid unnecessary refactoring during module instance
        // creation which also results in having wrong jsonPathKeys
        List<String> existingModuleNames =
                existingModuleDTOs.stream().map(ModuleDTO::getName).toList();
        int iteration = 1;
        while (existingModuleNames.contains(newModuleName)) {
            newModuleName = newModuleName + iteration;
            iteration++;
        }
        moduleDTO.setName(newModuleName);
        ModuleActionDTO moduleActionDTO = new ModuleActionDTO();
        AppsmithBeanUtils.copyNestedNonNullProperties(publicEntity, moduleActionDTO);
        moduleDTO.setEntity(moduleActionDTO);
        return moduleDTO;
    }

    private ModuleInstanceDTO createModuleInstanceRequestDTO(String pageId, ActionDTO publicEntity) {
        ModuleInstanceDTO moduleInstanceReqDTO = new ModuleInstanceDTO();
        moduleInstanceReqDTO.setContextType(CreatorContextType.PAGE);
        moduleInstanceReqDTO.setContextId(pageId);
        moduleInstanceReqDTO.setName(publicEntity.getName());
        return moduleInstanceReqDTO;
    }

    private void resetContextSpecificFieldsAndSetContextType(ActionDTO publicEntity) {
        publicEntity.setId(null);
        publicEntity.setPageId(null);
        publicEntity.setApplicationId(null);
        publicEntity.setContextType(CreatorContextType.PAGE);
    }

    private List<ModuleInputForm> constructInputsForm(ActionDTO publicEntity) {
        List<ModuleInputForm> moduleInputForms = new ArrayList<>();
        ModuleInputForm moduleInputForm = new ModuleInputForm();
        moduleInputForm.setId(ModuleUtils.generateUniqueIdForInputField());
        moduleInputForm.setSectionName("");
        Tuple2 tuple2 = moduleConvertibleHelper.generateChildrenInputsForModule(
                publicEntity.getJsonPathKeys(), publicEntity.getActionConfiguration());

        moduleInputForm.setChildren((List<ModuleInput>) tuple2.getT1());
        moduleInputForms.add(moduleInputForm);
        publicEntity.setActionConfiguration((ActionConfiguration) tuple2.getT2());

        return moduleInputForms;
    }
}

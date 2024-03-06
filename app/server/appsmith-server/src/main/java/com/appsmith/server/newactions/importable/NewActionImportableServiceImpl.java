package com.appsmith.server.newactions.importable;

import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.domains.Application;
import com.appsmith.server.domains.NewAction;
import com.appsmith.server.domains.Package;
import com.appsmith.server.dtos.ImportingMetaDTO;
import com.appsmith.server.dtos.MappedImportableResourcesDTO;
import com.appsmith.server.imports.importable.ImportableService;
import com.appsmith.server.imports.importable.artifactbased.ArtifactBasedImportableService;
import com.appsmith.server.newactions.base.NewActionService;
import org.springframework.stereotype.Service;

import java.util.Map;
import java.util.stream.Collectors;

import static com.appsmith.server.constants.FieldName.PACKAGE;
import static com.appsmith.server.constants.ce.FieldNameCE.APPLICATION;
import static java.lang.Boolean.TRUE;

@Service
public class NewActionImportableServiceImpl extends NewActionImportableServiceCEImpl
        implements ImportableService<NewAction> {

    private final ArtifactBasedImportableService<NewAction, Package> packageImportableService;

    public NewActionImportableServiceImpl(
            NewActionService newActionService,
            ActionCollectionService actionCollectionService,
            ArtifactBasedImportableService<NewAction, Application> applicationImportableService,
            ArtifactBasedImportableService<NewAction, Package> packageImportableService) {
        super(newActionService, actionCollectionService, applicationImportableService);
        this.packageImportableService = packageImportableService;
    }

    @Override
    public ArtifactBasedImportableService<NewAction, ?> getArtifactBasedImportableService(
            ImportingMetaDTO importingMetaDTO) {
        return switch (importingMetaDTO.getArtifactType()) {
            case APPLICATION -> super.getArtifactBasedImportableService(importingMetaDTO);
            case PACKAGE -> packageImportableService;
            default -> null;
        };
    }

    @Override
    protected NewAction getExistingActionInCurrentBranchForImportedAction(
            MappedImportableResourcesDTO mappedImportableResourcesDTO,
            Map<String, NewAction> actionsInCurrentArtifact,
            NewAction newAction) {
        if (!Boolean.TRUE.equals(newAction.getIsPublic())) {
            return super.getExistingActionInCurrentBranchForImportedAction(
                    mappedImportableResourcesDTO, actionsInCurrentArtifact, newAction);
        }
        Map<String, NewAction> fQNToNewActionMap = actionsInCurrentArtifact.values().stream()
                .collect(Collectors.toMap(
                        existingAction -> existingAction.getUnpublishedAction().getValidName(),
                        newAction1 -> newAction1,
                        (u, v) -> u));

        return fQNToNewActionMap.get(newAction.getUnpublishedAction().getValidName());
    }

    @Override
    protected boolean existingArtifactContainsAction(
            Map<String, NewAction> actionsInCurrentArtifact, NewAction newAction) {
        return super.existingArtifactContainsAction(actionsInCurrentArtifact, newAction)
                || (Boolean.TRUE.equals(newAction.getIsPublic())
                        && actionsInCurrentArtifact.values().stream().anyMatch(newAction1 -> newAction
                                .getUnpublishedAction()
                                .getValidName()
                                .equals(newAction1.getUnpublishedAction().getValidName())));
    }

    @Override
    protected void populateDomainMappedReferences(
            MappedImportableResourcesDTO mappedImportableResourcesDTO, NewAction newAction) {
        super.populateDomainMappedReferences(mappedImportableResourcesDTO, newAction);
        if (TRUE.equals(newAction.getIsPublic())) {
            // This public action had not been created with module instance,
            // this would happen in the case of orphan module instances.
            // Go ahead and set the references to instance now
            Map<String, String> moduleInstanceRefToIdMap = mappedImportableResourcesDTO.getModuleInstanceRefToIdMap();
            newAction.setRootModuleInstanceId(moduleInstanceRefToIdMap.get(newAction.getRootModuleInstanceId()));
            newAction.setModuleInstanceId(moduleInstanceRefToIdMap.get(newAction.getModuleInstanceId()));
        }
    }

    @Override
    protected void updateImportableActionFromExistingAction(NewAction existingAction, NewAction actionToImport) {
        super.updateImportableActionFromExistingAction(existingAction, actionToImport);

        actionToImport.setModuleInstanceId(existingAction.getModuleInstanceId());
        actionToImport.setRootModuleInstanceId(existingAction.getRootModuleInstanceId());
    }
}

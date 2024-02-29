package com.appsmith.server.applications.git;

import com.appsmith.external.models.ApplicationGitReference;
import com.appsmith.server.actioncollections.base.ActionCollectionService;
import com.appsmith.server.helpers.ArtifactGitFileUtils;
import com.appsmith.server.newactions.base.NewActionService;
import org.springframework.stereotype.Component;

import java.util.HashSet;
import java.util.Set;

import static com.appsmith.server.constants.FieldName.MODULE_INSTANCE_LIST;
import static com.appsmith.server.constants.FieldName.SOURCE_MODULE_LIST;

@Component
public class ApplicationGitFileUtils extends ApplicationGitFileUtilsCE
        implements ArtifactGitFileUtils<ApplicationGitReference> {

    public ApplicationGitFileUtils(NewActionService newActionService, ActionCollectionService actionCollectionService) {
        super(newActionService, actionCollectionService);
    }

    @Override
    protected Set<String> getBlockedMetadataFields() {
        Set<String> blockedMetadataFields = super.getBlockedMetadataFields();

        Set<String> newBlockedMetaFields = new HashSet<>(blockedMetadataFields);

        newBlockedMetaFields.addAll(Set.of(MODULE_INSTANCE_LIST, SOURCE_MODULE_LIST));

        return newBlockedMetaFields;
    }
}

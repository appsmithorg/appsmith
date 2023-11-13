package com.appsmith.server.refactors.utils;

import com.appsmith.server.dtos.RefactorEntityNameDTO;
import org.springframework.util.StringUtils;

public class RefactoringUtils {

    public static void updateFQNUsingCollectionName(RefactorEntityNameDTO refactorEntityNameDTO) {
        String oldName = refactorEntityNameDTO.getOldName();
        final String oldFullyQualifiedName = StringUtils.hasLength(refactorEntityNameDTO.getCollectionName())
                ? refactorEntityNameDTO.getCollectionName() + "." + oldName
                : oldName;
        String newName = refactorEntityNameDTO.getNewName();
        final String newFullyQualifiedName = StringUtils.hasLength(refactorEntityNameDTO.getCollectionName())
                ? refactorEntityNameDTO.getCollectionName() + "." + newName
                : newName;

        refactorEntityNameDTO.setOldFullyQualifiedName(oldFullyQualifiedName);
        refactorEntityNameDTO.setNewFullyQualifiedName(newFullyQualifiedName);
    }
}

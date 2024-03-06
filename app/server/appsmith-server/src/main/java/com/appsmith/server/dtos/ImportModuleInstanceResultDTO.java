package com.appsmith.server.dtos;

import com.appsmith.server.domains.ModuleInstance;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.List;

@Getter
public class ImportModuleInstanceResultDTO {
    private final List<String> importedModuleInstanceIds;

    @Setter
    private Collection<ModuleInstance> existingModuleInstances;

    public ImportModuleInstanceResultDTO() {
        importedModuleInstanceIds = new ArrayList<>();
    }

    /**
     * Method to get a gist of the result. Primarily used for logging.
     * @return
     */
    public String getGist() {
        return String.format(
                "existing module instances: %d, imported module instances: %d",
                existingModuleInstances.size(), importedModuleInstanceIds.size());
    }
}

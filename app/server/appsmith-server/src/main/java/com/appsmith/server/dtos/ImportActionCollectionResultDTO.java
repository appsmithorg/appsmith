package com.appsmith.server.dtos;

import com.appsmith.server.domains.ActionCollection;
import lombok.Getter;
import lombok.Setter;

import java.util.ArrayList;
import java.util.Collection;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Getter
public class ImportActionCollectionResultDTO {
    @Setter
    Collection<ActionCollection> existingActionCollections;
    // Map of action collection id from the JSON file to the action collection object that was saved
    Map<String, ActionCollection> savedActionCollectionMap = new HashMap<>();

    // list of _id fields of the saved action collections, we'll need them later
    List<String> savedActionCollectionIds = new ArrayList<>();

    /**
     * Method to get a gist of the result. Primarily used for logging.
     * @return
     */
    public String getGist() {
        return String.format(
                "existing action collections: %d, imported action collections: %d",
                existingActionCollections.size(), savedActionCollectionIds.size());
    }
}

package com.appsmith.server.dtos.ce;

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
    Map<String, ActionCollection> savedActionCollectionMap = new HashMap<>();

    // list of _id fields of the saved action collections, we'll need them later
    List<String> savedActionCollectionIds = new ArrayList<>();
}

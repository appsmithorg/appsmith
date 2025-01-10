package com.appsmith.external.git.dtos;

import com.appsmith.external.git.constants.ce.RefType;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class FetchRemoteDTO {

    /**
     * List of references which is to be fetched from remote.
     */
    List<String> refNames;

    /**
     * Assumption is that we fetch only one type of refs at once.
     */
    RefType refType;

    /**
     * fetch all the remotes
     */
    Boolean isFetchAll;
}

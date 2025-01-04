package com.appsmith.server.git.dtos;

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
     * fetch all the remotes
     */
    Boolean isFetchAll;
}

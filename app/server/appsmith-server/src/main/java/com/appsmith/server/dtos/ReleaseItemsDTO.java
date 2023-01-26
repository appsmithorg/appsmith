package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

import com.appsmith.external.models.Views;
import com.fasterxml.jackson.annotation.JsonView;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseItemsDTO {
    // This is a string so that it can hold values like `10+` if there's more than 10 new versions, for example.
    @JsonView(Views.Public.class)
    String newReleasesCount;

    @JsonView(Views.Public.class)
    List<ReleaseNode> releaseItems;
}

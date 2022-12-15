package com.appsmith.server.dtos;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ReleaseItemsDTO {
    // This is a string so that it can hold values like `10+` if there's more than 10 new versions, for example.
    String newReleasesCount;
    List<ReleaseNode> releaseItems;
}

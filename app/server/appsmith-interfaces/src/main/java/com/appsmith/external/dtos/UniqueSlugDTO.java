package com.appsmith.external.dtos;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.RequiredArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
@RequiredArgsConstructor
public class UniqueSlugDTO {

    String branchedPageId;

    String branchedApplicationId;

    String uniquePageSlug;

    String uniqueApplicationSlug;

    Boolean staticUrlEnabled;

    Boolean isUniqueSlugAvailable;
}

package com.appsmith.server.dtos;

import com.appsmith.server.domains.Layout;
import com.appsmith.server.meta.validations.FileName;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.List;

public record PageCreationDTO(
        @FileName(message = "Page names must be valid file names") @Size(max = 30) String name,
        @NotEmpty @Size(min = 24, max = 50) String applicationId,
        @NotEmpty List<Layout> layouts) {

    public PageDTO toPageDTO() {
        final PageDTO page = new PageDTO();
        page.setName(name);
        page.setApplicationId(applicationId);
        page.setLayouts(layouts);
        return page;
    }
}

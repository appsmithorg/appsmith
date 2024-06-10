package com.appsmith.server.dtos;

import com.appsmith.external.dtos.DslExecutableDTO;
import com.appsmith.server.domains.Layout;
import com.appsmith.server.meta.validations.FileName;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;
import net.minidev.json.JSONObject;

import java.util.List;
import java.util.Set;

public record PageCreationDTO(
        @FileName(message = "Page names must be valid file names", isNullValid = false) @Size(max = 30) String name,
        @NotEmpty @Size(min = 24, max = 50) String applicationId,
        @NotEmpty List<LayoutDTO> layouts) {

    public record LayoutDTO(JSONObject dsl, List<Set<DslExecutableDTO>> layoutOnLoadActions) {}

    public PageDTO toPageDTO() {
        final PageDTO page = new PageDTO();
        page.setName(name.trim());
        page.setApplicationId(applicationId);
        page.setLayouts(layouts.stream()
                .map(layoutDto -> {
                    final Layout l = new Layout();
                    l.setDsl(layoutDto.dsl);
                    l.setLayoutOnLoadActions(layoutDto.layoutOnLoadActions);
                    return l;
                })
                .toList());
        return page;
    }
}

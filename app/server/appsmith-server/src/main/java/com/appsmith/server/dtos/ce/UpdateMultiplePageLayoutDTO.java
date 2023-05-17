package com.appsmith.server.dtos.ce;

import com.appsmith.server.domains.Layout;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class UpdateMultiplePageLayoutDTO {

    @NotNull
    @Valid
    private List<UpdatePageLayoutDTO> pageLayouts;

    @Getter
    @Setter
    public static class UpdatePageLayoutDTO {
        @NotNull
        private String pageId;

        @NotNull
        private String layoutId;
        private Layout layout;
    }
}

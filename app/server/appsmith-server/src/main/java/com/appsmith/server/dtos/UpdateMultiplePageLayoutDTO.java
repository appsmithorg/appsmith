package com.appsmith.server.dtos;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;
import net.minidev.json.JSONObject;

import java.util.List;

@Getter
@Setter
public class UpdateMultiplePageLayoutDTO {

    @NotNull @Valid
    private List<UpdatePageLayoutDTO> pageLayouts;

    @Getter
    @Setter
    public static class UpdatePageLayoutDTO {
        @NotNull private String pageId;

        @NotNull private String layoutId;

        private LayoutDTO layout;
    }

    public record LayoutDTO(JSONObject dsl) {}
}

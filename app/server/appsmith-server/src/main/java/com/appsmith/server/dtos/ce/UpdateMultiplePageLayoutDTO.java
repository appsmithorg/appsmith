/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.dtos.ce;

import com.appsmith.server.domains.Layout;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotNull;
import java.util.List;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateMultiplePageLayoutDTO {

  @NotNull @Valid private List<UpdatePageLayoutDTO> pageLayouts;

  @Getter
  @Setter
  public static class UpdatePageLayoutDTO {

    @NotNull private String pageId;

    @NotNull private String layoutId;
    private Layout layout;
  }
}

package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.Getter;
import lombok.Setter;

import javax.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
public class OldPage extends BaseDomain {
    String name;

    @NotNull
    String applicationId;

    List<Layout> layouts;
}

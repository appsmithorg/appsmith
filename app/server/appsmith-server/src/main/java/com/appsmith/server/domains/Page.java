package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import jakarta.persistence.*;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Entity
@Deprecated
public class Page extends BaseDomain {
    String name;

    @NotNull String applicationId;

    // List<Layout> layouts;
}

package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import com.appsmith.external.models.Layout;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

import jakarta.validation.constraints.NotNull;
import java.util.List;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
@Deprecated
public class Page extends BaseDomain {
    String name;

    @NotNull
    String applicationId;

    List<Layout> layouts;
}

package com.appsmith.server.domains;

import com.appsmith.external.models.*;
import com.appsmith.external.views.Views;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Module extends BranchAwareDomain {
    String packageId;
    String type;
    ModuleDTO unpublishedModule;
    ModuleDTO publishedModule;
}

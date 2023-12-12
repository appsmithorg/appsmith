package com.appsmith.server.dtos;

import com.appsmith.external.views.Views;
import com.appsmith.server.domains.ModuleInstance;
import com.appsmith.server.dtos.ce.ApplicationJsonCE;
import com.fasterxml.jackson.annotation.JsonView;
import lombok.Getter;
import lombok.Setter;

import java.util.List;

/**
 * A DTO class to hold complete information about an application,
 * which will then be serialized to a file,
 * to export that application into a file.
 */
@Getter
@Setter
public class ApplicationJson extends ApplicationJsonCE {

    @JsonView(Views.Public.class)
    List<ModuleInstance> moduleInstanceList;

    @JsonView(Views.Public.class)
    List<ExportableModule> moduleList;
}

package com.appsmith.server.dtos;

import com.appsmith.external.models.ActionDTO;
import com.appsmith.server.helpers.ModuleConsumable;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("action")
public class ModuleActionDTO extends ActionDTO implements ModuleConsumable {}

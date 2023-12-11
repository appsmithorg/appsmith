package com.appsmith.server.dtos;

import com.appsmith.server.helpers.ModuleConsumable;
import com.fasterxml.jackson.annotation.JsonTypeName;

@JsonTypeName("JS_OBJECT")
public class ModuleActionCollectionDTO extends ActionCollectionDTO implements ModuleConsumable {}

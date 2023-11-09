package com.appsmith.server.helpers;

import com.appsmith.server.dtos.ModuleActionDTO;
import com.fasterxml.jackson.annotation.JsonSubTypes;
import com.fasterxml.jackson.annotation.JsonTypeInfo;

// This interface is used to have a generic type in the `ModuleDTO`.
// As the public entity can vary due to the module type, having this marker interface helps use to have just one type in
// the `ModuleDTO`
@JsonTypeInfo(use = JsonTypeInfo.Id.NAME, include = JsonTypeInfo.As.PROPERTY, property = "type")
@JsonSubTypes({@JsonSubTypes.Type(value = ModuleActionDTO.class, name = "ACTION")})
public interface ModuleConsumable {}

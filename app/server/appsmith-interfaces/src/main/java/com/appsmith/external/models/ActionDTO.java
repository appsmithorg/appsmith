package com.appsmith.external.models;

import com.appsmith.external.models.ce.ActionCE_DTO;
import com.querydsl.core.annotations.QueryEmbeddable;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@ToString
@QueryEmbeddable
public class ActionDTO extends ActionCE_DTO {}

package com.appsmith.external.models;

import com.appsmith.external.models.ce.ActionCE_DTO;
import com.querydsl.core.annotations.QueryEmbeddable;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;

@Getter
@Setter
@NoArgsConstructor
@EqualsAndHashCode(callSuper = true)
@ToString(callSuper = true)
@QueryEmbeddable
public class ActionDTO extends ActionCE_DTO {}

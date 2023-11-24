package com.appsmith.server.dtos;

import com.appsmith.server.dtos.ce.ActionCollectionCE_DTO;
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
public class ActionCollectionDTO extends ActionCollectionCE_DTO {}

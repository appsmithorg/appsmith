package com.appsmith.server.solutions.roles.dtos;

import lombok.Data;

import java.util.List;

@Data
public class EntityView {
    String type;
    List<? extends BaseView> entities;
}

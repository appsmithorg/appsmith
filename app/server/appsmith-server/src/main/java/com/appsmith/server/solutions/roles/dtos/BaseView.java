package com.appsmith.server.solutions.roles.dtos;

import lombok.Data;

import java.util.List;
import java.util.Set;

@Data
public class BaseView {
    private String id;
    private String name;
    List<Integer> enabled;
    List<Integer> editable;
    Set<EntityView> children;
}

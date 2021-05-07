package com.external.plugins.dao;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateOneDao {
    String collection;
    String query;
    String sort;
    String update;
}

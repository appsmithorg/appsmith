package com.external.plugins.dao;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateManyDao {
    String collection;
    String query;
    String update;
}

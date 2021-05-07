package com.external.plugins.dao;

import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
public class FindDao {
    String collection;
    String query;
    String sort;
    String projection;
    String limit;
    Long skip;
}

package com.appsmith.server.migrations;

import com.github.cloudyrock.mongock.ChangeLog;
import com.github.cloudyrock.mongock.ChangeSet;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Sort;
import org.springframework.data.mongodb.core.MongoTemplate;
import org.springframework.data.mongodb.core.index.Index;

@Slf4j
@ChangeLog(order = "003")
public class DatabaseChangelog3 {

    // below is the function to add unique index to the slug field in the tenant
    // Index index = new Index().on("slug", Sort.Direction.ASC).unique();: This line creates a new Index object. The
    // index definition specifies:
    // Field to be indexed: "slug". This suggests the presence of a field named "slug" in the "tenant" collection
    // (explained later).
    // Sort order: Sort.Direction.ASC ensures the slugs are sorted in ascending order (A to Z).
    // Uniqueness: .unique() makes sure each slug value is unique within the collection. This is useful to avoid
    // duplicate URLs or identifiers based on slugs.
    @ChangeSet(order = "044", id = "add-Slug-Index", author = "", runAlways = true)
    public void addSlugIndex(MongoTemplate mongoTemplate) {
        Index index = new Index().on("slug", Sort.Direction.ASC).unique();
        mongoTemplate.indexOps("tenant").ensureIndex(index);
    }
}

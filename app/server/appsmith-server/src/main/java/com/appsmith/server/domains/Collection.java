/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import java.util.List;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@NoArgsConstructor
@Document
public class Collection extends BaseDomain {

  String name;

  String applicationId;

  // Organizations migrated to workspaces, kept the field as depricated to support the old
  // migration
  @Deprecated String organizationId;

  String workspaceId;

  Boolean shared;

  // To save space, when creating/updating collection, only add Action's id field instead of the
  // entire action.
  List<NewAction> actions;
}

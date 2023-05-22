/* Copyright 2019-2023 Appsmith */
package com.appsmith.external.models;

import lombok.AllArgsConstructor;
import lombok.EqualsAndHashCode;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import lombok.ToString;
import org.springframework.data.mongodb.core.mapping.Document;

@Getter
@Setter
@ToString
@EqualsAndHashCode
@NoArgsConstructor
@AllArgsConstructor
@Document
public class Connection implements AppsmithDomain {

  Mode mode;
  Type type;
  SSLDetails ssl;
  String defaultDatabaseName;

  public enum Mode {
    READ_ONLY,
    READ_WRITE
  }

  public enum Type {
    DIRECT,
    REPLICA_SET
  }
}

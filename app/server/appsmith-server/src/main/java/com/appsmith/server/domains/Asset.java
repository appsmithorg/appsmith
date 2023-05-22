/* Copyright 2019-2023 Appsmith */
package com.appsmith.server.domains;

import com.appsmith.external.models.BaseDomain;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import org.springframework.http.MediaType;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class Asset extends BaseDomain {

  String contentType;
  byte[] data;

  public Asset(MediaType mediaType, byte[] data) {
    this(mediaType == null ? null : mediaType.toString(), data);
  }
}

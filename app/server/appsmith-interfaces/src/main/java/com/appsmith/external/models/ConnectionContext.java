package com.appsmith.external.models;

import com.appsmith.external.helpers.SSHTunnelContext;
import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@AllArgsConstructor
public class ConnectionContext<C> {
    C connection;
    SSHTunnelContext sshTunnelContext;
}

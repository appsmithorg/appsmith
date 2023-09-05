package com.appsmith.external.helpers;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.Setter;
import net.schmizz.sshj.SSHClient;

import java.net.ServerSocket;

@Getter
@Setter
@AllArgsConstructor
public class SSHTunnelContext {
    ServerSocket serverSocket;
    Thread thread;
    SSHClient sshClient;
}

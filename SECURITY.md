# Security Policy

## Reporting a Vulnerability

We take Appsmith's security seriously and welcome responsible reports through
[GitHub private vulnerability reporting](https://github.com/appsmithorg/appsmith/security/advisories/new).

Appsmith does not currently operate a bug bounty program.

## Private network access and SSRF

Appsmith is designed to connect to internal databases, APIs, and services. Plugins
and datasources are therefore intentionally able to reach RFC 1918 addresses
(`10.0.0.0/8`, `172.16.0.0/12`, and `192.168.0.0/16`). Private-network access alone
is not considered a vulnerability.

We do want reports of SSRF vulnerabilities that bypass Appsmith's protections or
cross an unintended security boundary, including:

- Access to cloud metadata endpoints, loopback, link-local, or other destinations
  Appsmith intends to block.
- Access to Appsmith platform components not intended as plugin destinations.
- Control of a request destination by a user without permission to configure it.
- Exposure of credentials, secrets, or otherwise inaccessible data.

Automated analysis is welcome, but please validate findings against a self-hosted
installation that you own or are explicitly authorized to test. Reports should
identify the attacker's permissions, request destination, security boundary crossed,
reproducible steps, and impact. Do not test deployments without the operator's
permission.

Self-hosted operators should restrict who can configure plugins and datasources and
apply appropriate network segmentation and egress controls.

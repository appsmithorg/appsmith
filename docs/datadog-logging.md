# Datadog Integration for Appsmith Logging

## Overview
Appsmith supports integration with third-party log management tools such as **Datadog** to help monitor, visualize, and analyze application logs efficiently.

This document provides steps to set up Datadog for capturing and analyzing Appsmith logs.

---

## Prerequisites
- A Datadog account
- Datadog API key and application key
- Access to your Appsmith instance (self-hosted or cloud)

---

## 1. Configure Appsmith Logging
Appsmith uses standard logging mechanisms that can be redirected to external services such as Datadog.

Modify the `docker.env` or `.env` file in your Appsmith setup to include the following environment variables:

```bash
APPSMITH_LOGGING_PROVIDER=datadog
DATADOG_API_KEY=<your_api_key>
DATADOG_APP_KEY=<your_app_key>
DATADOG_SITE=datadoghq.com

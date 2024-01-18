#!/bin/bash

exec /root/.temporalio/bin/temporal server start-dev \
    --log-level error \
    --headless # disable web ui

# exec /root/.temporalio/bin/temporal server start-dev \
#     --db-filename /appsmith-stacks/data/temporal/temporal.db \
#     --headless # disable web ui

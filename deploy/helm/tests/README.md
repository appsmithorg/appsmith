# Helm Chart Unit Tests

This directory contains unit tests for our Helm charts using [helm-unittest](https://github.com/helm-unittest/helm-unittest), a BDD-style testing framework for Helm charts.

## Running Tests Locally

You can run the tests locally using Docker:

```bash
docker run -ti --rm -v $(pwd):/apps helmunittest/helm-unittest .
```

## Snapshot Testing

Our tests use snapshot testing to validate the rendered Kubernetes manifests. This ensures that any changes to the defaults are intentional and reviewed.

### Updating Snapshots

When making changes that affect the rendered output (like updating labels or other metadata), you'll need to update the snapshots. This is particularly important during releases when labels are updated.

To update snapshots, run the tests with the `-u` flag:

```bash
docker run -ti --rm -v $(pwd):/apps helmunittest/helm-unittest -u .
```

**Important**: Always review the changes in the snapshots before committing them to ensure they match your expectations.

## Documentation

For more information about helm-unittest, including:
- Writing test cases
- Available assertions
- Test suite configuration
- Best practices

Please refer to the [official helm-unittest documentation](https://github.com/helm-unittest/helm-unittest).

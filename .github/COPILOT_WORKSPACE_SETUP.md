# GitHub Copilot Workspace Setup Requirements

## Overview

GitHub Copilot's agentic workspace feature uses GitHub Actions workflows to automatically set up and configure the development environment when a Copilot agent starts working on a repository.

## Required Configuration

For GitHub Copilot to properly recognize and use the workspace setup workflow, the following requirements must be met:

### 1. Workflow File Name

The workflow file **must** be named exactly:
```
.github/workflows/copilot-workspace-setup.yml
```

**Important**: The filename is case-sensitive and must use `copilot-workspace-setup.yml` (not `copilot-runner-setup.yml` or any other variant).

### 2. Job Name

The workflow must contain a job named exactly:
```yaml
jobs:
  copilot-setup-steps:
    # ... job configuration
```

**Important**: The job name must be `copilot-setup-steps` (with a hyphen, not underscore or other separators).

## What This Workflow Does

The workspace setup workflow in this repository:

1. **Environment Setup**
   - Installs Nix with flakes support on Ubuntu 24.04
   - Configures direnv for automatic environment loading
   - Caches Nix store for faster subsequent runs

2. **Dependency Installation**
   - Loads Nix environment with Node.js, Go, and MongoDB
   - Installs npm dependencies
   - Builds TypeScript and Svelte client

3. **Testing**
   - Starts MongoDB service
   - Runs unit tests
   - Builds Go simulation engine
   - Runs E2E tests
   - Generates test summaries

4. **Artifacts**
   - Uploads test outputs
   - Uploads screenshots from E2E tests
   - Creates startup summary

## How Copilot Uses This

When a GitHub Copilot agent is assigned to work on this repository:

1. GitHub automatically triggers the `copilot-workspace-setup.yml` workflow
2. The workflow runs all the setup steps defined in the `copilot-setup-steps` job
3. The agent receives context about:
   - Test results (pass/fail status)
   - Build status
   - Environment configuration
   - Available tools and commands
4. The agent can then start working with confidence that:
   - The environment is properly configured
   - All dependencies are installed
   - Tests are passing (or knows which tests are failing)

## Troubleshooting

### Workflow Not Running

If the workflow doesn't seem to be triggered by Copilot:

1. ✅ Verify the file is named exactly `.github/workflows/copilot-workspace-setup.yml`
2. ✅ Verify the job is named exactly `copilot-setup-steps`
3. ✅ Check that the workflow has proper triggers (workflow_dispatch, push, pull_request)
4. ✅ Ensure the YAML syntax is valid

### Workflow Runs But Fails

If the workflow runs but encounters errors:

1. Check the GitHub Actions logs for the specific failure
2. Review the test outputs in the workflow artifacts
3. Ensure all required secrets and environment variables are configured
4. Verify that the base image (ubuntu-24.04) has the necessary tools

## References

- Main workflow file: `.github/workflows/copilot-workspace-setup.yml`
- Setup documentation: `.github/RUNNER_SETUP.md`
- GitHub Actions docs: https://docs.github.com/en/actions

## Recent Changes

### 2025-11-05: Workflow File Rename

**Fixed**: Renamed workflow file from `copilot-runner-setup.yml` to `copilot-workspace-setup.yml`

**Reason**: GitHub Copilot expects the specific filename `copilot-workspace-setup.yml` to recognize and use the workspace setup workflow. The job name (`copilot-setup-steps`) was already correct from a previous commit.

**Impact**: With this change, GitHub Copilot agents will now properly recognize and execute the workspace setup workflow when starting work on this repository.

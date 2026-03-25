# Contributing to Appsmith

Thank you for your interest in Appsmith and for taking the time to contribute to this project. 🙌 

Appsmith is a project by developers for developers and there are a lot of ways you can contribute. If you don't know where to start contributing, ask us on our [Discord channel](https://discord.com/invite/rBTTVJp).

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Project Architecture](#project-architecture)
- [Quick Start Checklist](#quick-start-checklist)
- [How Can I Contribute?](#how-can-i-contribute)
- [Development Setup](#development-setup)
- [Pull Request Process](#pull-request-process)
- [Community Support](#community-support)

---

## Code of Conduct

Read our [Code of Conduct](CODE_OF_CONDUCT.md) before contributing. We are committed to fostering an open, welcoming, and safe environment in the community.

---

## Project Architecture

Understanding the project structure will help you navigate the codebase more effectively:

```
appsmith/
├── app/
│   ├── client/          # Frontend (React + TypeScript)
│   │   ├── src/         # React components, widgets, utilities
│   │   ├── cypress/     # Cypress integration tests
│   │   └── packages/    # Shared packages including RTS (Real-Time Server)
│   └── server/          # Backend (Java + Spring + WebFlux)
│       ├── appsmith-server/     # Main server application
│       └── appsmith-plugins/    # Database/API connectors
├── deploy/              # Docker & Kubernetes deployment configs
├── contributions/       # Contribution guides and documentation
└── static/              # Static assets for documentation
```

### Tech Stack Overview

| Component | Technologies |
|-----------|--------------|
| **Frontend** | React, TypeScript, Redux, Redux-Saga |
| **Backend** | Java 25, Spring, WebFlux, MongoDB, Redis |
| **Testing** | Jest (unit), Cypress (integration), JUnit (server) |
| **Deployment** | Docker, Kubernetes |

---

## Quick Start Checklist

New to contributing? Follow this checklist to get started:

### Before You Start
- [ ] Read this CONTRIBUTING guide
- [ ] Read our [Code of Conduct](CODE_OF_CONDUCT.md)
- [ ] Join our [Discord community](https://discord.com/invite/rBTTVJp) for support

### For Code Contributions
- [ ] Find an issue to work on (see [Finding Issues](#finding-issues))
- [ ] Comment on the issue to get it assigned to you
- [ ] Fork and clone the repository
- [ ] Set up your development environment (see [Development Setup](#development-setup))
- [ ] Create a feature branch from `release`
- [ ] Make your changes and write tests
- [ ] Submit a pull request

### For Documentation Contributions
- [ ] Visit the [appsmith-docs repository](https://github.com/appsmithorg/appsmith-docs)
- [ ] Read the [Docs Contribution Guide](https://github.com/appsmithorg/appsmith-docs/blob/main/CONTRIBUTING.md)

---

## How Can I Contribute?

### 🐛 Report a Bug

Report all issues through GitHub Issues using the [Report a Bug](https://github.com/appsmithorg/appsmith/issues/new?assignees=Nikhil-Nandagopal&labels=Bug%2CNeeds+Triaging&template=--bug-report.yaml&title=%5BBug%5D%3A+) template.

**Tips for a good bug report:**
- Use a clear and descriptive title
- Include steps to reproduce the issue
- Describe the expected vs. actual behavior
- Include screenshots or screen recordings if helpful
- Mention your environment (OS, browser, Appsmith version)

### 🛠 File a Feature Request

We welcome all feature requests! File your request through GitHub Issues using the [Feature Request](https://github.com/appsmithorg/appsmith/issues/new?assignees=Nikhil-Nandagopal&labels=Enhancement&template=--feature-request.yaml&title=%5BFeature%5D%3A+) template.

**Tips for a good feature request:**
- Describe the problem you're trying to solve
- Explain how your suggestion would help solve it
- Include examples or mockups if available

### 📝 Improve the Documentation

Help us keep our documentation up to date! You can:
- Suggest improvements using the [Documentation templates](https://github.com/appsmithorg/appsmith-docs/issues/new/choose)
- Contribute directly to our [Docs repository](https://github.com/appsmithorg/appsmith-docs)

### ⚙️ Contribute Code

#### Finding Issues

Looking for issues to contribute to? Here are some great starting points:

| Issue Type | Link |
|------------|------|
| Good First Issues | [Browse →](https://github.com/appsmithorg/appsmith/issues?q=is%3Aopen+is%3Aissue+label%3A%22Good+First+Issue%22) |
| Inviting Contributions | [Browse →](https://github.com/appsmithorg/appsmith/issues?q=is%3Aopen+is%3Aissue+label%3A%22Inviting+Contribution%22) |
| Help Wanted | [Browse →](https://github.com/appsmithorg/appsmith/issues?q=is%3Aopen+is%3Aissue+label%3A%22Help+Wanted%22) |

> ⚠️ **Important:** Always get an issue assigned to you before starting work. Comment on the issue expressing your interest. Tag `@contributor-support` if needed. Working on issues without assignment may result in your contribution being rejected.

#### Types of Code Contributions

| Contribution Type | Guide |
|-------------------|-------|
| Frontend (React/TypeScript) | [Client Setup Guide](contributions/ClientSetup.md) |
| Backend (Java/Spring) | [Server Setup Guide](contributions/ServerSetup.md) |
| New Widget | [Widget Development Guide](contributions/AppsmithWidgetDevelopmentGuide.md) |
| New Plugin/Connector | [Plugin Contribution Guide](contributions/ServerCodeContributionsGuidelines/PluginCodeContributionsGuidelines.md) |
| Add Custom JS Library | [Custom JS Library Guide](contributions/CustomJsLibrary.md) |
| Write Tests | [Test Automation Guide](contributions/docs/TestAutomation.md) |

---

## Development Setup

### Prerequisites

Before setting up the development environment, ensure you have:

| Tool | Version | Notes |
|------|---------|-------|
| Docker | Latest | Required for containerized services |
| Node.js | 20.11.1 | Use nvm or fnm for version management |
| Java | OpenJDK 25 | Eclipse Temurin recommended |
| Maven | 3.9+ | Preferably 3.9.12 |
| Git | Latest | For version control |
| mkcert | Latest | For local HTTPS certificates |

### Quick Setup

#### Frontend Only (for UI contributions)

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/appsmith.git
cd appsmith

# Set up local HTTPS certificates
cd app/client/docker && mkcert -install && mkcert "*.appsmith.com" && cd ../../..

# Add dev domain to hosts
echo "127.0.0.1 dev.appsmith.com" | sudo tee -a /etc/hosts

# Copy environment file
cp .env.example .env

# Install dependencies and start
cd app/client
yarn install
./start-https.sh https://release.app.appsmith.com  # Use staging backend
yarn start
```

Your frontend will be running at https://dev.appsmith.com

#### Full Stack Setup

1. **Set up MongoDB and Redis** (using Docker):
   ```bash
   # MongoDB
   docker run -d -p 127.0.0.1:27017:27017 --name appsmith-mongodb \
     -e MONGO_INITDB_DATABASE=appsmith mongo --replSet rs0

   # Redis
   docker run -d -p 127.0.0.1:6379:6379 --name appsmith-redis redis
   ```

2. **Build and run the server**:
   ```bash
   cd app/server
   mvn clean compile
   cp envs/dev.env.example .env
   # Edit .env to point to your local MongoDB and Redis
   ./build.sh -Dmaven.test.skip
   ./scripts/start-dev-server.sh
   ```

For detailed setup instructions, see:
- [Client Setup Guide](contributions/ClientSetup.md) - Full frontend setup with troubleshooting
- [Server Setup Guide](contributions/ServerSetup.md) - Complete backend setup including IntelliJ configuration

---

## Pull Request Process

### Branch Naming

Use descriptive branch names following these patterns:
- `fix/bug-description` - For bug fixes
- `feature/feature-name` - For new features
- `docs/description` - For documentation changes

### Commit Messages

Write clear, descriptive commit messages:
- Use the present tense ("Add feature" not "Added feature")
- Reference issue numbers when applicable
- Keep the first line under 72 characters

### Before Submitting

- [ ] Code compiles without errors
- [ ] Tests pass locally (Jest for frontend, JUnit for backend)
- [ ] New code includes appropriate tests
- [ ] Code follows the existing style conventions
- [ ] PR description clearly explains the changes

### PR Guidelines

1. **Create PR from your fork** to `appsmithorg/appsmith` `release` branch
2. **Link the issue** in your PR description (e.g., "Fixes #123")
3. **Tag the maintainer** you're collaborating with
4. **Wait for CI** to pass before requesting review
5. **Address review feedback** promptly and push new commits

### What NOT to Do

❌ Work on issues without getting them assigned first  
❌ Create PRs without proper description  
❌ Request review before CI passes  
❌ Submit PRs without tests  
❌ Skip reading the contribution guidelines  

---

## Community Support

Need help? We're here for you!

| Channel | Best For |
|---------|----------|
| [Discord](https://discord.com/invite/rBTTVJp) | Real-time help, discussions, community |
| [GitHub Discussions](https://github.com/appsmithorg/appsmith/discussions) | Questions, ideas, announcements |
| [GitHub Issues](https://github.com/appsmithorg/appsmith/issues) | Bug reports, feature requests |
| [support@appsmith.com](mailto:support@appsmith.com) | Private inquiries, security issues |

---

## Recognition

We ❤️ our contributors! All contributors are recognized in our [README](README.md#top-contributors). Your contributions help make Appsmith better for everyone.

Let's build great software together! 🚀
# Azure deployment

Azure infrastructure and app-specific production settings are managed from:

```text
/Users/aridder/Projects/app-plattform
```

The app repository contains the portable container build and the GitHub Actions
release job. First-time provisioning is done from the platform repository:

```bash
cd /Users/aridder/Projects/app-plattform
source .env.azure
pnpm platform:deploy
pnpm platform:deploy-app vipps-starter
pnpm platform:configure-github vipps-starter
```

After provisioning, every merge to `main`:

1. Runs type checking, linting, build, and end-to-end tests.
2. Builds immutable runtime and migration images.
3. Signs in to Azure through GitHub OIDC.
4. Applies Prisma migrations with an Azure Container Apps Job.
5. Deploys the application image only after migrations succeed.
6. Verifies the deployed health endpoint.

The deployment identity is scoped to this application's registry images,
Container App, and migration job. Secrets remain in Azure Key Vault and are
referenced by the Container App; they are never copied into GitHub.

App settings, custom domains, scaling, jobs, and secret declarations live in:

```text
/Users/aridder/Projects/app-plattform/apps/vipps-starter/app.azure.json
```

# Backend CI/CD (GitHub Actions -> ECR -> ECS)

This repo includes a GitHub Actions workflow that deploys the backend automatically when you push to `main`.

## What It Does

- Build Docker image
- Push to ECR (`hyphen-os-backend`)
- Register a new ECS task definition revision (same family, updated image)
- Update ECS service (`hyphen-os-backend-svc`) and wait until stable

## One-Time AWS Setup (Recommended: OIDC, No Long-Lived Keys)

1. Find the current ECS task roles (used by your task definition).

   - Task execution role ARN
   - Task role ARN

2. Deploy CloudFormation stack `deploy/github-oidc-role.cfn.yml`.

   - Parameters:
     - `TaskExecutionRoleArn`
     - `TaskRoleArn`
   - Optional:
     - `GitHubOrg`, `GitHubRepo`, `GitHubBranch` (defaults match current repo)

3. In GitHub repo settings, add Actions secret:

   - `AWS_ROLE_TO_ASSUME` = the stack output `RoleArn`

After that, pushes to `main` will deploy automatically.

## Notes

- The workflow renders a new task definition using the image tag `${GITHUB_SHA}` to avoid relying on `:latest` cache behavior.
- DB migrations run inside the container on start (`npm run start` runs `prisma migrate deploy`).


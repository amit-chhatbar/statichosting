# statichosting: AMI Hospital website

Static website for **AMI Hospital**, built with Node.js and hosted on AWS S3
(`arn:aws:s3:::statichosting-amit`).

No npm dependencies. The build, tests, and preview server use only built-in Node modules.

## Project layout

```
src/                     Website source (HTML, CSS, JS, assets)
scripts/build.js         Copies src/ -> dist/ and stamps the build version/date
scripts/serve.js         Local preview server for dist/
test/build.test.js       Tests for the build output (node --test)
.github/workflows/ci.yml CI: checkout -> test -> build -> upload artifact -> download & verify
.github/workflows/cd.yml CD: download the CI artifact -> sync to S3
```

## Run locally (Node 20+)

```sh
npm test        # run tests
npm run build   # build into dist/
npm start       # build + preview at http://localhost:8080
```

## Pipeline

1. **CI** (`ci.yml`) runs on every push and pull request to `main`:
   - `build` job: checks out the sources, runs the tests, builds the site, and uploads
     `dist/` as the artifact `ami-hospital-website`.
   - `verify` job: downloads that artifact and checks that the expected files are in it.
2. **CD** (`cd.yml`) runs automatically when CI **succeeds on a push to `main`**. It
   downloads the same artifact from that CI run (it does not rebuild) and runs
   `aws s3 sync --delete` to the bucket. Pull requests never deploy.

## One-time AWS setup

### 1. Turn on static website hosting for the bucket

```sh
aws s3 website s3://statichosting-amit --index-document index.html --error-document error.html
```

### 2. Allow public read access (so browsers can load the site)

Turn off "Block all public access" for the bucket, then attach this bucket policy:

```json
{
  "Version": "2012-10-17",
  "Statement": [{
    "Sid": "PublicReadForWebsite",
    "Effect": "Allow",
    "Principal": "*",
    "Action": "s3:GetObject",
    "Resource": "arn:aws:s3:::statichosting-amit/*"
  }]
}
```

### 3. Create a deploy-only IAM user

Give the user only the permissions it needs (least privilege):

```json
{
  "Version": "2012-10-17",
  "Statement": [
    { "Effect": "Allow", "Action": "s3:ListBucket", "Resource": "arn:aws:s3:::statichosting-amit" },
    { "Effect": "Allow", "Action": ["s3:PutObject", "s3:DeleteObject"], "Resource": "arn:aws:s3:::statichosting-amit/*" }
  ]
}
```

Create an access key for this user.

### 4. Add the credentials to GitHub (never commit them)

In the repo, go to **Settings → Secrets and variables → Actions** and add:

| Type     | Name                    | Value                                     |
|----------|-------------------------|-------------------------------------------|
| Secret   | `AWS_ACCESS_KEY_ID`     | Access key ID of the deploy user          |
| Secret   | `AWS_SECRET_ACCESS_KEY` | Secret access key of the deploy user      |
| Variable | `AWS_REGION`            | Bucket region (defaults to `us-east-1`)   |

Or use the GitHub CLI, which prompts for each value so it stays out of your shell history:

```sh
gh secret set AWS_ACCESS_KEY_ID
gh secret set AWS_SECRET_ACCESS_KEY
gh variable set AWS_REGION --body "us-east-1"
```

The CD job runs in a GitHub **environment** called `production`. To require a manual
approval before each deploy, add yourself as a required reviewer under
**Settings → Environments → production**.

After a deploy, the site is at `http://statichosting-amit.s3-website-<region>.amazonaws.com`.
The CD run summary prints the exact URL.

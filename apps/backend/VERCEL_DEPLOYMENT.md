# Deploying the Backend to Vercel

This guide explains how to deploy the Bank Statement Summarizer backend to Vercel.

## Prerequisites

1. A Vercel account (sign up at [vercel.com](https://vercel.com))
2. Vercel CLI installed (optional, for local testing)
3. Git repository with your code

## Deployment Steps

### 1. Prepare Your Project

The project has been prepared for Vercel deployment with the following changes:

- Added `vercel.json` configuration file
- Modified the PDF service to work without file system operations

### 2. Set Up Environment Variables

Make sure to set up the following environment variables in your Vercel project:

```
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.vercel.app
GEMINI_API_KEY=your_gemini_api_key_here
```

### 3. Deploy to Vercel

#### Option 1: Deploy via Vercel Dashboard

1. Go to [vercel.com](https://vercel.com) and log in
2. Click "New Project"
3. Import your Git repository
4. Select the `apps/backend` directory as the root directory
5. Configure the environment variables
6. Click "Deploy"

#### Option 2: Deploy via Vercel CLI

1. Install Vercel CLI: `npm i -g vercel`
2. Navigate to the backend directory: `cd apps/backend`
3. Run: `vercel`
4. Follow the prompts to link to your Vercel account and project
5. Set the environment variables when prompted

### 4. Verify Deployment

After deployment, verify that your API is working by visiting:

```
https://your-project-name.vercel.app/api/health
```

You should see a JSON response with status "OK".

### 5. Update Frontend Configuration

Update your frontend application to use the new backend URL:

```
VITE_API_URL=https://your-project-name.vercel.app/api
```

## Troubleshooting

### File Upload Issues

Vercel has a maximum body size limit of 4.5MB for serverless functions. If you need to upload larger files, consider:

1. Using direct upload to a storage service like AWS S3
2. Implementing client-side file processing to reduce file size

### Serverless Function Timeout

Vercel serverless functions have a maximum execution time of 10 seconds (or up to 60 seconds on paid plans). If your analysis takes longer, consider:

1. Optimizing your code for faster execution
2. Implementing a queue-based architecture with background processing

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Serverless Functions](https://vercel.com/docs/concepts/functions/serverless-functions)
- [Environment Variables in Vercel](https://vercel.com/docs/concepts/projects/environment-variables)
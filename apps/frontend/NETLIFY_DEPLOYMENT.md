# Deploying the Frontend to Netlify

This guide provides step-by-step instructions for deploying the Bank Statement Summarizer frontend to Netlify.

## Prerequisites

1. A [Netlify](https://www.netlify.com/) account
2. Your backend deployed to Vercel (or another hosting service)
3. Git repository with your frontend code

## Deployment Steps

### Option 1: Deploy via Netlify Dashboard (UI)

1. **Log in to Netlify**
   - Go to [https://app.netlify.com/](https://app.netlify.com/) and log in to your account

2. **Create a New Site**
   - Click on "Add new site" and select "Import an existing project"
   - Connect to your Git provider (GitHub, GitLab, or Bitbucket)
   - Select your repository

3. **Configure Build Settings**
   - Set the following build configuration:
     - Base directory: `apps/frontend` (if using monorepo) or leave empty if deploying only the frontend
     - Build command: `npm run build`
     - Publish directory: `dist`

4. **Set Environment Variables**
   - Go to Site settings > Environment variables
   - Add the following environment variables:
     ```
     VITE_API_URL=https://your-backend-url.vercel.app/api
     VITE_GEMINI_API_KEY=your_gemini_api_key (if needed)
     ```

5. **Deploy the Site**
   - Click "Deploy site"
   - Netlify will build and deploy your frontend application

### Option 2: Deploy via Netlify CLI

1. **Install Netlify CLI**
   ```bash
   npm install -g netlify-cli
   ```

2. **Login to Netlify**
   ```bash
   netlify login
   ```

3. **Initialize Netlify in Your Project**
   ```bash
   cd apps/frontend
   netlify init
   ```

4. **Configure Build Settings**
   - Follow the CLI prompts to configure your build settings
   - Set build command to `npm run build`
   - Set publish directory to `dist`

5. **Set Environment Variables**
   ```bash
   netlify env:set VITE_API_URL https://your-backend-url.vercel.app/api
   netlify env:set VITE_GEMINI_API_KEY your_gemini_api_key (if needed)
   ```

6. **Deploy the Site**
   ```bash
   netlify deploy --prod
   ```

## Post-Deployment Configuration

### Custom Domain (Optional)

1. Go to Site settings > Domain management
2. Click "Add custom domain"
3. Follow the instructions to set up your custom domain

### Continuous Deployment

Netlify automatically sets up continuous deployment from your Git repository. Every push to your main branch will trigger a new build and deployment.

### Environment Variables

If you need to update environment variables after deployment:

1. Go to Site settings > Environment variables
2. Add, edit, or remove environment variables as needed
3. Trigger a new deployment for the changes to take effect

## Troubleshooting

### Build Failures

If your build fails, check the build logs in the Netlify dashboard for specific errors.

Common issues include:
- Missing dependencies
- Incorrect build commands
- Environment variable issues

### API Connection Issues

If your frontend cannot connect to the backend API:

1. Verify that the `VITE_API_URL` environment variable is set correctly
2. Check that CORS is properly configured on your backend
3. Ensure your backend is running and accessible

## Optimizing Performance

### Enable Prerendering

For better SEO and performance, consider enabling prerendering in your Netlify settings:

1. Go to Site settings > Build & deploy > Prerendering
2. Enable prerendering for your site

### Configure Caching

Optimize caching for better performance:

1. Create a `_headers` file in your `public` directory
2. Add appropriate caching rules for your assets

## Monitoring

Use Netlify Analytics to monitor your site's performance and traffic:

1. Go to the Analytics tab in your Netlify dashboard
2. Review site performance, visitor data, and other metrics

---

Congratulations! Your Bank Statement Summarizer frontend is now deployed on Netlify and connected to your Vercel backend.
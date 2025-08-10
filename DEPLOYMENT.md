# Deployment Guide for Bank Statement Summarizer

This guide provides comprehensive instructions for deploying both the frontend and backend components of the Bank Statement Summarizer application.

## Overview

The Bank Statement Summarizer consists of two main components:

1. **Backend API** - Express.js application that handles PDF processing and AI analysis
2. **Frontend Application** - React.js application that provides the user interface

We recommend deploying these components to the following platforms:

- **Backend**: Vercel (serverless functions)
- **Frontend**: Netlify (static site hosting)

## Backend Deployment (Vercel)

For detailed instructions on deploying the backend to Vercel, see [VERCEL_DEPLOYMENT.md](./apps/backend/VERCEL_DEPLOYMENT.md).

### Key Points for Backend Deployment

- The backend uses serverless functions on Vercel
- Environment variables must be configured in Vercel
- File system operations have been optimized for serverless environments
- Maximum file size is limited to 4.5MB due to Vercel's payload limits

## Frontend Deployment (Netlify)

For detailed instructions on deploying the frontend to Netlify, see [NETLIFY_DEPLOYMENT.md](./apps/frontend/NETLIFY_DEPLOYMENT.md).

### Key Points for Frontend Deployment

- The frontend is a static site built with Vite
- Environment variables must be configured in Netlify
- The frontend must be configured to connect to the deployed backend API

## Environment Variables

### Backend Environment Variables

```
NODE_ENV=production
FRONTEND_URL=https://your-frontend-url.netlify.app
GEMINI_API_KEY=your_gemini_api_key
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
MAX_FILE_SIZE=4500000
```

### Frontend Environment Variables

```
VITE_API_URL=https://your-backend-url.vercel.app/api
```

## Deployment Workflow

For the best results, follow this deployment workflow:

1. Deploy the backend to Vercel first
2. Note the deployed backend URL
3. Configure the frontend environment variables with the backend URL
4. Deploy the frontend to Netlify
5. Configure the backend environment variables with the frontend URL (for CORS)
6. Test the complete application

## Testing the Deployment

After deploying both components, test the following functionality:

1. **Health Check**: Visit `https://your-backend-url.vercel.app/api/health`
2. **Frontend Access**: Visit your Netlify URL
3. **PDF Upload**: Test uploading a PDF bank statement
4. **Analysis**: Verify that analysis works correctly
5. **Export**: Test exporting data to CSV

## Troubleshooting

### Backend Issues

- **Function Timeout**: If analysis takes too long, increase the function timeout in Vercel
- **Memory Limit**: If processing large PDFs fails, increase the memory allocation
- **CORS Errors**: Ensure the `FRONTEND_URL` environment variable is set correctly

### Frontend Issues

- **API Connection**: Verify that `VITE_API_URL` points to the correct backend URL
- **Build Errors**: Check Netlify build logs for any build failures
- **Routing Issues**: Ensure Netlify redirects are configured correctly

## Scaling Considerations

### Backend Scaling

- Vercel automatically scales serverless functions
- Consider upgrading to a paid plan for higher limits
- Monitor API usage and adjust rate limiting as needed

### Frontend Scaling

- Netlify automatically scales static sites
- Consider using a CDN for global distribution
- Optimize assets for faster loading

## Monitoring

- Use Vercel and Netlify dashboards for basic monitoring
- Consider implementing application monitoring with tools like Sentry
- Set up logging for critical operations

---

For specific deployment instructions, refer to the individual deployment guides:

- [Backend Deployment Guide](./apps/backend/VERCEL_DEPLOYMENT.md)
- [Frontend Deployment Guide](./apps/frontend/NETLIFY_DEPLOYMENT.md)
# Vercel Deployment Guide

This guide will help you deploy both the frontend and backend to Vercel.

## Prerequisites

1. Install Vercel CLI:

```bash
npm install -g vercel
```

2. Make sure you have a Vercel account at [vercel.com](https://vercel.com)

## Environment Variables

### Frontend Environment Variables

Create a `.env` file in the `frontend` directory:

```env
# For production, leave empty to use same origin
VITE_API_URL=

# For development
# VITE_API_URL=http://localhost:3001/api
```

### Backend Environment Variables

Set these in your Vercel dashboard:

```env
GOOGLE_API_KEY=your_google_api_key_here
NODE_ENV=production
```

## Deployment Steps

### 1. Build the Frontend

```bash
cd frontend
npm install
npm run build
```

### 2. Deploy to Vercel

```bash
# From the root directory
vercel

# Follow the prompts:
# - Link to existing project or create new
# - Set project name
# - Confirm deployment settings
```

### 3. Configure Environment Variables

In your Vercel dashboard:

1. Go to your project settings
2. Navigate to "Environment Variables"
3. Add the backend environment variables listed above

### 4. Deploy Backend API

The backend will be automatically deployed as serverless functions.

## Project Structure for Vercel

```
/
├── vercel.json          # Vercel configuration
├── backend/             # Backend code
│   ├── src/
│   └── package.json
├── frontend/            # Frontend code
│   ├── src/
│   ├── dist/           # Built frontend (generated)
│   └── package.json
└── DEPLOYMENT.md       # This file
```

## Vercel Configuration

The `vercel.json` file handles:

- **Builds**: Both frontend and backend
- **Routes**: API routes to backend, static files to frontend
- **Environment**: Production settings

## API Routes

All API routes will be available at:

- `/api/upload/*` - File upload and analysis
- `/api/analysis/*` - Analysis endpoints
- `/api/export/*` - Export functionality

## Troubleshooting

### Common Issues:

1. **Build Failures**:

   - Check that all dependencies are installed
   - Verify TypeScript compilation
   - Ensure environment variables are set

2. **API Errors**:

   - Verify Google API key is set
   - Check function timeout limits
   - Review serverless function logs

3. **CORS Issues**:
   - Frontend and backend are on same domain
   - CORS is configured in backend

### Function Limits:

- **Timeout**: 10 seconds (free), 60 seconds (pro)
- **Memory**: 1024MB (free), 3008MB (pro)
- **Payload**: 4.5MB (free), 50MB (pro)

## Production Considerations

1. **File Upload Limits**: Vercel has 4.5MB limit for free tier
2. **Function Timeout**: 10 seconds for free tier
3. **Memory**: 1024MB for free tier
4. **Cold Starts**: Serverless functions may have cold start delays

## Monitoring

- Use Vercel Analytics for performance monitoring
- Check Function Logs for API debugging
- Monitor environment variables and secrets

## Custom Domain (Optional)

1. Add custom domain in Vercel dashboard
2. Configure DNS settings
3. Update environment variables if needed

## Security

- Environment variables are encrypted
- API keys are stored securely
- CORS is properly configured
- File uploads are validated

## Performance Optimization

1. **Frontend**:

   - Code splitting with React Router
   - Optimized bundle size
   - CDN delivery

2. **Backend**:
   - Efficient PDF processing
   - Timeout handling
   - Memory management

## Support

For issues:

1. Check Vercel Function Logs
2. Review build logs
3. Verify environment variables
4. Test locally first

# Bank Statement Summarizer Frontend

This is the frontend application for the Bank Statement Summarizer. It provides a user interface for uploading bank statements, viewing analysis results, and exporting data.

## Features

- PDF bank statement upload
- Real-time analysis progress streaming
- Interactive financial dashboard
- Transaction categorization
- Data visualization with charts
- Export functionality (CSV)
- Demo mode for testing

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/6766ffba-2839-4443-895d-ed3e2c84439f) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.

## Environment Variables

Create a `.env.local` file with the following variables:

```
VITE_API_URL=http://localhost:3003/api
```

## Deployment

### Netlify Deployment

This frontend can be deployed to Netlify. See [NETLIFY_DEPLOYMENT.md](./NETLIFY_DEPLOYMENT.md) for detailed instructions.

### Backend Integration

This frontend is designed to work with the Bank Statement Summarizer backend API. Make sure to update the `VITE_API_URL` environment variable to point to your deployed backend.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/6766ffba-2839-4443-895d-ed3e2c84439f) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

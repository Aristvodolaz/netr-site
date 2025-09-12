# Task Manager Frontend

Modern frontend implementation for the Task Manager application using Vite, TailwindCSS, and modern JavaScript.

## Features

- 📋 View and manage task list
- 🔍 Search tasks by name
- 📂 Upload task files (Excel)
- 📥 Upload WPS files
- ⬇️ Download tasks as Excel files
- 🚫 Hide tasks with confirmation
- 📊 Progress tracking for file uploads
- 📱 Responsive design

## Prerequisites

- Node.js 14.x or higher
- npm 6.x or higher

## Setup

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd task-manager-frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. For production build:
   ```bash
   npm run build
   ```

The production build will be in the `dist` directory, ready to be deployed to any static hosting service.

## Development

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build locally

## API Configuration

The application expects a backend server running at `http://10.171.12.36:3005`. You can modify the API endpoint in `vite.config.js` if needed.

## Browser Support

The application supports all modern browsers (Chrome, Firefox, Safari, Edge).

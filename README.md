# Tegami

A small web app for writing and self-hosting password protected letters and unlisted blog posts.

This project was built on [`jebsite-template`](https://github.com/Lustyn/jebsite-template), a modern, production-ready template for building full-stack React applications.

## Getting Started

### Prerequisites

- Node.js 20 or later
- corepack (which will automatically manage pnpm for you)

### Installation

Install the dependencies:

```bash
pnpm install
```

### Development

Start the development server with HMR:

```bash
pnpm dev
```

Your application will be available at `http://localhost:5173`.

## Building for Production

Create a production build:

```bash
pnpm build
```

## Deployment

First create a `.env` file with:

1. `TEGAMI` set to the path you want the letters and media to reside.
2. `PORT` set to the external port you'd like to use.
3. `AUTH` set to a colon separated username and password you'd like to use. Editor instructions go into further detail.

### Docker Deployment

To build and run using Docker:

```bash
docker compose up
```

The containerized application can be deployed to any platform that supports Docker, including:

- AWS ECS
- Google Cloud Run
- Azure Container Apps
- Digital Ocean App Platform
- Fly.io
- Railway

### DIY Deployment

If you're familiar with deploying Node applications, the built-in app server is production-ready.

Make sure to deploy the output of `pnpm build`:

```
├── package.json
├── pnpm-lock.yaml
├── build/
│   ├── client/    # Static assets
│   └── server/    # Server-side code
```

## Usage

On the home page if you're not provided a link, you can input a letter ID and key. Letters that you have previously opened will appear below the form. If you are given a link, on first open you'll be asked for a key similar to the bottom half of the home page form shown below.
![Home page letter selection menu](/public/home.png)

### Editor

As the site operator, you start by picking a username and password and putting it in the `AUTH` environment variable, separated by a colon (`<username>:<password>`). To get to the editor, navigate to `/admin` and provide the same credentials used for the `AUTH` environment variable. The admin panel provides the option to create a letter, as well as edit existing letters. This is what the editor looks like, using a document written while prototyping the media viewer:
![Editor preview](/public/editor.png)
The media viewer is where you can upload and delete media from the letter. This is what that media viewer looks like:
![Media viewer with upload button, and insert and delete buttons on each piece of media](/public/media.png)

# Koda Database Setup Guide

This guide covers how to set up and manage the local PostgreSQL database using Docker.

## Prerequisites

Ensure you have Docker Desktop installed and running.

## Starting the Database

If you are starting the project from a fresh state, run the following command from the backend/ directory:

docker compose up -d

## Troubleshooting Port Conflicts

If you encounter a bind: address already in use error, it means another process is using the database port. Follow these steps to resolve it:

The "Total Purge" (If things get stuck)

If the container becomes unresponsive or ports remain blocked, run this sequence to perform a clean wipe:

## Stop and remove the containers and clear the volumes

docker compose down -v

## Force remove all docker containers

docker ps -aq | xargs -I {} docker rm -f {}

## Clean up networks and volumes

docker network prune -f
docker volume prune -f

## Restart

docker compose up -d

## Changing the Port

If the database port (5555) is consistently blocked on your machine, you can shift to a different port:

Open backend/docker-compose.yml and change the port mapping (e.g., "5556:5432").

Open backend/.env and update the DATABASE_URL port to match (e.g., localhost:5556).

Run docker compose up -d again.

## Database Migrations

Once the container is running (verify with docker ps), ensure your database schema is up to date:

npx prisma migrate dev --name init

## Visualizing Data

To view your database tables and data in your browser, use Prisma Studio:

npx prisma studio

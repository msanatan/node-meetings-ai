# Node Meetings

Manage your meetings and forthcoming tasks from the lovely Node.js flavoured API!

## Prerequisites

To run this locally you need:

- Node.js v22
- Docker v4+

## Set up

To run this project, simply bring up the docker containers:

```bash
docker compose up -d
```

You may want to work on the Node.js on your host machine. You should follow these steps then:

Copy the env vars from the example file, changing as necessary:

```bash
cp .env.example .env
```

By default they are configured to work with the DB services in `docker-compose.yml`. You may want to bring up the individual DB services.

Install dependencies:

```bash
npm i
```

And then run the server

```bash
npm run dev
```

## Populating Data

To add some dummy data, run the seed script:

```bash
npm run seed
```

## JWTs

You'll need a JWT to use the API. You can generate one like this:

```bash
npm run generate:jwt <USER_ID>
```

Replacing `<USER_ID>` with the user you want

## Want to learn more?

Check out the `docs` folder which has the origianl instructions and some notes that were made along the way.

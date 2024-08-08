# closeby.ca 👇

## Development

Before running the dev server you'll need to need to populate the `.env` file with Cloudflare credentials.
The `.env.dist` file is a good starting point.
```sh
cp .env.dist .env
```


You'll need to run the following command to apply migrations to your local copy of the database:
```sh
pnpm run migrate:dev
```
Afterwards you can use drizzle-kit but initially this is required to make wrangler happy


Run the dev server:

```sh
pnpm run dev
```

## Migrations

Use drizzle-kit to generate migrations whenever you make changes to the database schema.
```sh
pnpm run drizzle-kit:dev generate
pnpm run drizzle-kit:dev migrate
```


Apply all migrations to production:
```sh
pnpm run migrations:production
```

## Typegen

You will need to rerun typegen whenever you make changes to `wrangler.toml`.
```sh
pnpm run typegen
```


## Deployment

First, build your app for production:

```sh
npm run build
```


Then, deploy your app to Cloudflare Pages:

```sh
npm run deploy
```


# Resources

- 💿 [Remix](https://remix.run/docs)
- ☁️ [Remix Cloudflare](https://remix.run/guides/vite#cloudflare)
- 🗂️ [Drizzle](https://drizzle.team/docs)
- 🖌️ [Shadcn](https://ui.shadcn.com/docs)
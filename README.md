# closeby.ca 👇

## 🛠️ Development

Before running the dev server you'll need to need to populate the `.env` file with Cloudflare credentials.
The `.env.dist` file is a good starting point.
```sh
cp .env.dist .env
```

Initially, you'll need to run this script to apply migrations to your local copy of the database:
```sh
pnpm run migrate:dev
```
Afterwards, feel free to use drizzle-kit:
```sh
pnpm run drizzle-kit:dev migrate
```

😏 Run the dev server:

```sh
pnpm run dev
```

## 🗂️ Migrations

Use drizzle-kit to generate migrations whenever you make changes to the database schema.
```sh
pnpm run drizzle-kit:dev generate
pnpm run drizzle-kit:dev migrate
```

To apply migrations to production:
```sh
pnpm run drizzle-kit:production migrate
```

## ✅ Typegen

You'll need to rerun typegen whenever you make changes to `wrangler.toml`.
```sh
pnpm run typegen
```

## 🚀 Deployment

Please for the love of God make sure the build is working before pushing to production
```sh
npm run preview
```

Then, deploy closeby to Cloudflare Pages:

```sh
npm run deploy
```


# Resources

- 💿 [Remix](https://remix.run/docs)
- ☁️ [Remix Cloudflare](https://remix.run/guides/vite#cloudflare)
- 🗂️ [Drizzle](https://drizzle.team/docs)
- 🖌️ [Shadcn](https://ui.shadcn.com/docs)
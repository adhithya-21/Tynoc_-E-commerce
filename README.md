# Form & Field

A warm, responsive homewares storefront built with the Next.js App Router, TypeScript, Tailwind CSS, and an optional DynamoDB single-table data layer. Browse a small-batch collection, search and filter products, save favorites, view product details, and manage a persistent shopping bag.

> **Demo note:** The storefront is ready to run without AWS. Its starter catalog is bundled locally, and bag and wishlist changes are saved in the browser. Configure DynamoDB to use the persistent server-side data layer. This project uses anonymous shopper sessions, not account passwords or payment processing; add a real identity provider and checkout integration before accepting orders.

## Features

- Responsive, editorial storefront with category collections, product cards, maker story, newsletter form, and mobile navigation.
- Product search, category filters, price sorting, detail pages, related items, and a not-found page.
- Browser-persisted cart and wishlist, with duplicate cart lines consolidated, quantity controls, subtotal/free-shipping calculation, remove controls, and optimistic server sync.
- Next.js JSON routes for catalog, categories, anonymous user profiles, cart, and wishlist; Zod validation and structured error responses.
- DynamoDB-backed reads and writes when configured; a no-credentials demo mode otherwise.
- Accessible control labels, useful empty/loading/error states, and reduced-motion support.

## Stack

- Next.js 15 App Router and React 19
- TypeScript and Tailwind CSS
- AWS SDK for JavaScript v3 (DynamoDB)
- Zod request validation and Lucide icons

## Project layout

```text
src/
  app/
    api/
      cart/route.ts
      categories/route.ts
      products/route.ts
      products/[slug]/route.ts
      users/route.ts
      wishlist/route.ts
    products/[slug]/page.tsx
    globals.css
    layout.tsx
    page.tsx
  components/
    CartDrawer.tsx
    Header.tsx
    ProductCard.tsx
  lib/
    dynamodb.ts
    http.ts
    products.ts
    session.ts
    store.ts
    types.ts
    useCatalog.ts
```

## Architecture

```text
Browser (Next.js / React)
  ├── Server-rendered application shell and interactive storefront
  ├── Browser storage for immediate cart and wishlist availability
  └── Same-origin JSON requests
        └── Next.js route handlers → validation / business rules → DynamoDB Document Client
                                              └── starter-data demo mode when no table is configured
```

The product catalog is read from `GET /api/products` and `GET /api/products/[slug]`; categories are available from `GET /api/categories`. `POST`, `PATCH`, and `DELETE /api/products` and `/api/categories` provide catalog management and require a server-side `ADMIN_API_TOKEN` bearer token plus a configured DynamoDB table. A server-generated, HttpOnly, same-site anonymous session cookie scopes a shopper's profile, cart, and wishlist. `GET`, `PUT`, and `DELETE /api/users` read, update, and erase the anonymous profile and associated shopper data. `GET`, `POST`, and `PATCH /api/cart` read, add/increment, and set/remove (`quantity: 0`) cart items. `GET` and `POST /api/wishlist` read and toggle a saved product. Browser storage keeps the demo responsive and is synchronized to the API when available.

### DynamoDB data model

Create one on-demand table with string partition key `pk`, string sort key `sk`, and a global secondary index named `GSI1` with string partition key `GSI1PK` and string sort key `GSI1SK`. Project data is represented as:

| Entity | `pk` | `sk` | GSI attributes / notes |
|---|---|---|---|
| Product | `PRODUCT#<productId>` | `DETAILS` | `GSI1PK=PRODUCTS`, `GSI1SK=SLUG#<slug>`; includes `entityType=PRODUCT`, product fields, and category |
| Category | `CATEGORY#<categoryId>` | `DETAILS` | `GSI1PK=CATEGORIES`, `GSI1SK=CATEGORY#<categoryId>`; includes `entityType=CATEGORY`, name, image, and count |
| User profile | `USER#<random-session-id>` | `PROFILE` | Includes `entityType=USER`, name, email, and `updatedAt` |
| Shopping cart | `USER#<random-session-id>` | `CART` | `items` is a list of `{ productId, quantity }`; API consolidates repeated product IDs |
| Wishlist | `USER#<random-session-id>` | `WISHLIST` | `productIds` is a unique string list |

Catalog reads use GSI1 queries rather than full-table scans. Cart and wishlist records share the anonymous user's partition. The storefront catalog itself is bundled as starter data in `src/lib/products.ts`; seed corresponding product/category items in DynamoDB before switching the app to a configured table.

Create the table in AWS Console or with AWS CLI (substitute your table name and region):

```powershell
aws dynamodb create-table `
  --table-name form-and-field `
  --attribute-definitions AttributeName=pk,AttributeType=S AttributeName=sk,AttributeType=S AttributeName=GSI1PK,AttributeType=S AttributeName=GSI1SK,AttributeType=S `
  --key-schema AttributeName=pk,KeyType=HASH AttributeName=sk,KeyType=RANGE `
  --global-secondary-indexes '[{"IndexName":"GSI1","KeySchema":[{"AttributeName":"GSI1PK","KeyType":"HASH"},{"AttributeName":"GSI1SK","KeyType":"RANGE"}],"Projection":{"ProjectionType":"ALL"}}]' `
  --billing-mode PAY_PER_REQUEST `
  --region us-east-1
```

Configure the application with an IAM role or the AWS shared-credentials/profile chain. Grant only the table and GSI actions this application uses (`GetItem`, `PutItem`, `DeleteItem`, `BatchWriteItem`, `Query`) on this table and its `index/GSI1` index. Do not place long-lived AWS access keys in client code or commit them. If you use DynamoDB Local, create a table with the same keys and GSI.

To load the bundled demo products/categories, first run the app in demo mode in one terminal. In another PowerShell terminal, configure the table and AWS credentials (`$env:DYNAMODB_TABLE_NAME="form-and-field"`; `$env:AWS_REGION="us-east-1"`) and run `npm run seed`. The script reads the app's demo catalog and batch-writes product/category records using the documented keys and GSI. It overwrites records with matching keys, so use it for initial setup or a deliberate catalog refresh.

## Environment variables

Copy `.env.example` to `.env.local` and set:

| Name | Required | Description |
|---|---|---|
| `AWS_REGION` | No | AWS region; defaults to `us-east-1`. |
| `DYNAMODB_TABLE_NAME` | No | Set to enable DynamoDB; absent means demo mode. |
| `DYNAMODB_ENDPOINT` | No | Local DynamoDB endpoint; omit when using AWS. |
| `ADMIN_API_TOKEN` | No | Server-only bearer token required for product/category create, update, and delete routes. |
| `SEED_SOURCE_URL` | No | Base URL for the running demo app used by `npm run seed`; defaults to `http://localhost:3000`. |

The AWS SDK resolves credentials from its normal provider chain (for example an IAM role or local AWS profile). For local DynamoDB, the SDK uses local-only placeholder credentials automatically.

## Run locally

Requirements: Node.js 20+ and npm.

```powershell
npm install
Copy-Item .env.example .env.local
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000). Without a configured DynamoDB table, the app runs in demo mode. Production checks:

```powershell
npm run typecheck
npm run lint
npm run build
```

## Screenshots

Add screenshots captured from the running application here before submitting:

| Storefront | Product detail |
|---|---|
| ![Form & Field storefront](./screenshots/storefront.png) | ![Form & Field product detail](./screenshots/product-detail.png) |

## Production considerations

The anonymous session cookie makes this a functional portfolio/demo app, not a full account system. Before production use, replace it with a real authentication provider, add authorization and CSRF protections to shopper-data mutations, add DynamoDB conditional/transactional writes for simultaneous cart updates, seed and validate a production catalog, configure image/CDN hosting, and integrate a payment provider. The newsletter currently validates its email input in the browser and demonstrates the success state; connect it to a consent-aware mailing-list service before collecting subscriptions.

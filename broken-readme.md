# Little Maker Co

Shopify storefront for **Little Maker Co** — a small-batch 3D-printing toy studio.
Built on a customized **Horizon** theme (Shopify's theme-blocks flagship).

- **Store:** `littlemaker-dev.myshopify.com`
- **Brand palette:** Egg Violet `#7B3FE4` · Coral Pink `#FF5C8A` · Deep Layer
  `#2A1A5E` · Lavender Mist `#F7F4FF`
- **Brand voice vault:** `~/.claude/brand-voice-vault/little-maker-co/`

---

## Getting started

Onboarding for a new person picking up this repo.

### 1. Prerequisites

| Tool                      | Why                                          | Install                              |
|---------------------------|----------------------------------------------|--------------------------------------|
| **Shopify CLI** (current) | Preview, lint, push the theme                | `npm install -g @shopify/cli@latest` |
| **Node.js 18+**           | Required by the Shopify CLI                  | nodejs.org / `brew install node`     |
| **git**                   | Version control                              | preinstalled / `brew install git`    |
| **uv**                    | Runs the Python helper scripts in `scripts/` | `brew install uv`                    |

> **Keep the Shopify CLI current.** Horizon is a theme-blocks theme; an outdated
> CLI renders an empty body in `shopify theme dev` even when the theme is fine.
> Check with `shopify version` — it should be 3.80 or higher.

Then get the code and set up secrets:

```sh
git clone <this-repo> littlemaker.co && cd littlemaker.co
cp .env.example .env   # if present; otherwise create .env
```

`.env` holds API keys (gitignored).
Currently used:

- `GOOGLE_API_KEY` — Google AI Studio key for the image-generation scripts (`scripts/generate_images.py`).
  Get one at https://aistudio.google.com/apikey
- `KLAVIYO_API_KEY` — needed only to push the email templates in
  `emails/` to Klaviyo.

### 2. Connect the Shopify MCP to Claude

The Shopify MCP lets Claude read and edit the store directly — products, collections, pages, theme files — without leaving the chat.
It's what was used to build this store.

**In Claude (claude.ai, desktop app, or Cowork):**
1. Open **Settings → Connectors** (a.k.a. the connector / MCP picker).
2. Find and add the **Shopify** connector.
3. Sign in to Shopify when prompted and **authorize the store**
   `littlemaker-dev.myshopify.com`.
4. Back in a chat, confirm it works — ask Claude to run **`get-shop-info`**; it
   should return the store name and domain.

**In Claude Code (CLI):** MCP servers are declared in `.mcp.json` (this repo already wires the `tessl` server).
To add another:

```sh
claude mcp add shopify <command-or-url>
```

Once connected, Claude can use tools like `get-shop-info`, `create-product`, `graphql_query`, `graphql_mutation`, and read/write theme files on **unpublished themes**.
Writes to the live theme are blocked for safety.

### 3. Preview the theme locally — and check your changes

```sh
shopify theme dev --store=littlemaker-dev.myshopify.com
```

- Opens a live local preview at **http://127.0.0.1:9292** that hot-reloads as
  you edit theme files.
- It syncs to a temporary **development theme** — it never touches the live store.
  Stop it with `Ctrl+C`.

Lint before pushing:

```sh
shopify theme check
```

(Horizon's own stock files trip an older checker with harmless `LiquidHTMLSyntaxError`
/ `content_for` warnings — focus on issues in files *you* changed.)

See what changed in the repo:

```sh
git status        # files modified
git diff          # the actual changes
git log --oneline # history
```

> If `theme dev` shows an empty page or fails to upload `config/*.json`: the
> development theme is stale (often left over from a different theme).
> Delete it with `shopify theme delete --development`, then run `shopify theme dev` again
> for a fresh one.
> Development themes are hidden from the admin Themes page —
> the CLI is the only way to manage them.

### 4. Push the theme to the real store

**Push as a new unpublished theme** (safe — does not change the live store):

```sh
shopify theme push --store=littlemaker-dev.myshopify.com --unpublished
```

Then in **Shopify admin → Online Store → Themes**, find the pushed theme and use
**⋯ → Preview** to review it on the real store.

**Update an existing theme** you've already pushed (push reports its theme ID):

```sh
shopify theme push --store=littlemaker-dev.myshopify.com --theme=<theme-id>
```

**Go live** — when you're happy, publish from **admin → Themes → ⋯ → Publish**.
(`shopify theme push --live` also works but requires `--allow-live`; publishing from admin is safer because you preview first.)

> First push from a new machine triggers a one-time `shopify login` browser
> sign-in.

---

## Managing products with Claude (Shopify MCP)

Once the Shopify MCP is connected (see Getting started → step 2), you run the store catalog by **asking Claude in plain language** — it calls the Shopify Admin API for you.
No code, no Shopify admin clicking required for most tasks.

**Things you can ask for:**

| Task                | Example prompt                                                             |
|---------------------|----------------------------------------------------------------------------|
| Inspect the catalog | "List all products and their prices"                                       |
| Create a product    | "Add a new product 'The Articulated Octopus', $18, in the Toys collection" |
| Update pricing      | "Change the Mystery Box — Pro price to $54"                                |
| Edit copy           | "Rewrite the Fidget Egg description in our brand voice"                    |
| Add/replace images  | "Generate a new photo for Rex the Pixel Dino and attach it"                |
| Manage inventory    | "Set the Dragon & Egg Bundle inventory to 25"                              |
| Collections         | "Create a 'Gifts under $15' collection" / "Add the dino to Toys"           |
| Pages & navigation  | "Add a Shipping page" / "Add it to the footer menu"                        |

**How it works:** reads (listing products, checking a price) happen instantly; **writes** (creating, updating, deleting) prompt you for confirmation first.
Claude uses tools like `get-shop-info`, `create-product`, `update-product`, `get-product`, `create-collection`, and the raw `graphql_query` / `graphql_mutation` for anything without a dedicated tool.

**What the MCP can't do:** subscription selling plans (the recurring billing on the Mystery Box products) need a write scope the connector doesn't carry — set those up in **Shopify admin → Settings → Subscriptions** or the Shopify Subscriptions app.
Theme deletion and publishing to the live theme are also blocked for safety.

> The catalog edits above change the **real store data** immediately (products,
> prices, inventory are not theme files).
> They're separate from theme changes,
> which still go through `shopify theme push`.

### Cloning the catalog to another store

The product catalog is version-controlled in **`catalog/`** — one JSON file per product, plus `collections.json` and product images.
To load it onto a fresh store (or re-apply edits to this one):

1. Connect the Shopify MCP to the target store (use `switch-shop` to change
   stores), and confirm with `get-shop-info`.
2. Ask Claude to **sync the catalog** — the **`catalog-sync`** skill (`.claude/skills/catalog-sync/`) reads `catalog/` and creates or updates the matching products and collections.
   It matches by `handle`, so re-running updates instead of duplicating.

Edit the files in `catalog/` to change the catalog; the sync is the deploy step.
Subscription selling plans are not part of the catalog — set those up per store.
See `catalog/README.md` for the file format.

---

## What's here

| Path                                               | Contents                                                                                  |
|----------------------------------------------------|-------------------------------------------------------------------------------------------|
| `templates/index.json`                             | Homepage — hero → how-it-works → tiers → toys → story → FAQ → email                       |
| `templates/page.*.json`                            | How It Works, About, Gift, FAQ landing pages                                              |
| `templates/404.json`                               | Branded 404                                                                               |
| `catalog/`                                         | Version-controlled product + collection definitions (synced via the `catalog-sync` skill) |
| `config/settings_data.json`                        | Brand color schemes + Poppins/Inter fonts + logo                                          |
| `sections/header-group.json` · `footer-group.json` | Header, announcement bar, footer                                                          |
| `brand-assets/`                                    | Source brand imagery (also uploaded to Shopify Files)                                     |
| `emails/`                                          | Klaviyo email templates + flow plan (not yet pushed)                                      |
| `scripts/`                                         | Image generation + Shopify/Klaviyo helpers                                                |

## Catalog (on the store)

- **Toys:** The Fidget Egg, The Articulated Dragon, Rex the Pixel Dino, Dragon & Egg Bundle
- **Subscription:** Mystery Box — Basic ($25/mo), Mystery Box — Pro ($49/mo)
- **Collections:** `toys`, `mystery-box`

## Horizon architecture notes

This theme is built on Horizon's theme-blocks system — pages compose from nested blocks inside generic sections, settings are design tokens, and templates specify only non-default settings.
See the `horizon-store-build` skill (`.claude/skills/horizon-store-build/`) for the full architecture reference.

Customized from [Shopify Horizon](https://github.com/Shopify/horizon) (MIT — see `LICENSE.md`).

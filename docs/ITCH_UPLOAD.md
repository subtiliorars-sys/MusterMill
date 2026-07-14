# itch.io upload — MusterMill

## One-time setup

1. Create game at https://itch.io/game/new  
   - **Kind:** HTML  
   - **Embed:** checked · viewport **760×900** · **Shared assets off**  
   - **Pricing:** Free / name your own price  

2. Install butler (already on fleet): `~/.local/bin/butler`

3. Login (owner once per machine):
   ```bash
   butler login
   # copies API key to ~/.config/itch/butler_creds.json
   ```

4. Match `.itch.toml` `user` + `project` to your itch URL slug  
   - Example live URL: `https://subtiliorars.itch.io/mustermill`

## Every release

```bash
cd projects/claude/MusterMill
npm run release:itch
```

This runs tests → build → zip → `butler push` (if credentials exist).

### Manual fallback

```bash
npm run build:itch
# Upload dist/mustermill-itch.zip via itch.io → Edit game → Uploads
```

## Page copy

Paste from [`ITCH_PAGE_COPY.md`](./ITCH_PAGE_COPY.md).

**v0.2 devlog line:**
> Deployment prestige live — reset battalion, carry bloodline trait at 50%, stack +10% slip bonus (max 5 deploys).

## Cover

Export `public/itch-cover.svg` → **630×500 PNG** for itch thumbnail.

## Parked (owner)

- [ ] Confirm itch username/slug matches `.itch.toml`  
- [ ] `butler login` on this machine if auto-push desired  
- [ ] Stripe / itch IAP for Branch Packs (demo toggle OK until then)

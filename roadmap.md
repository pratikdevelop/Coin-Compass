# Crypto Compass roadmap

## In progress
- [x] Centralised CoinGecko service (no mock data, stale-cache fallback, ranges 1D/7D/30D/90D/1Y/MAX)
- [ ] Wire markets table / coin pages / charts / ticker to new payload shape (volume, stale flag, ATH/ATL)

## Next
- [ ] Watchlist + alerts DB hardening (unique index, alert_type/percentage, edit/disable)
- [ ] Server-side alert engine (cron) + real alert emails
- [ ] Email sending domain setup (blocked: needs user's own domain)
- [ ] Wallet page: balance, add funds (simulated, clearly labelled), withdraw, transactions
- [ ] Portfolio integration with wallet + real prices
- [ ] Ad analytics: track impressions/loads/failures/clicks per page + dashboard page
- [ ] Blog page: write crypto articles (title, content, date), linked from news feed

## Blocked
- Real alert emails require a verified sending domain the user owns.

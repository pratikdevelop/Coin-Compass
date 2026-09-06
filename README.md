# Coin Compass

You are building a cryptocurrency market data web app (CoinMarketCapAlternative). The app has the following pages and components:

- Home Page: Displays a table of top cryptocurrencies. Columns: Rank, Name, Symbol, Price, 24h Change, Market Cap. User can search coins by name/symbol. Clicking a coin goes to its detail page.

- Coin Detail Page: Shows coin name, symbol, and an interactive price chart (1D, 7D, 1M, 1Y). Below the chart, show stats: Current Price, Market Cap, Circulating Supply, 24h Volume, Max Supply. Also display buttons: "Add to Watchlist" and "Set Price Alert". Include links to the coin's website and source code, and social media icons (Twitter, Telegram).

- Watchlist Page: Shows coins the user added. Same columns as home. Updates real-time. 

- Portfolio Page: (Optional for MVP) User can list their holdings (quantity of each coin). Show total balance and profit/loss. Plot a portfolio value chart.

- News Page: List of recent crypto news articles (headline, source, timestamp). Click an article to open in new tab. 

- API Endpoints (json):

  - GET `/api/coins`: returns a list of coins. Example response:

    ```

    [

      {"id":"bitcoin","name":"Bitcoin","symbol":"BTC","rank":1,"price":30000,"change24h":-2.5,"marketCap":550000000000},

      {"id":"ethereum","name":"Ethereum","symbol":"ETH","rank":2,"price":1800,"change24h":1.2,"marketCap":220000000000},

      ...

    ]

    ```

  - GET `/api/coin/:id`: details for one coin. Example:

    ```

    {"id":"bitcoin","name":"Bitcoin","symbol":"BTC","price":30000,"marketCap":550000000000,"volume24h":25000000000,"supplyCirculating":18500000,"supplyMax":21000000,"historicalPrices":[{"timestamp":1693500000,"price":29500},...]}

    ```

  - GET `/api/news`: list of news items. Example:

    ```

    [{"title":"New BTC ETF Launches","source":"CoinDesk","url":"https://...", "date":"2026-09-05"},

     {"title":"Altcoin Rally Continues","source":"CoinTelegraph","url":"...","date":"2026-09-05"}]

    ```

- User Stories & Acceptance Criteria:

  1. *Search & Navigate:* As a user, I can type in the search bar to find a coin by name or symbol. When I select it, I navigate to that coin’s detail page.

  2. *Data Display:* As a user, I see live price, 24h change, and market cap for each coin in the table. Data updates at least every minute.

  3. *Watchlist:* As a user, I can click "Add to Watchlist" on a coin page or table row. The coin then appears on my Watchlist page. Removing works similarly.

  4. *Price Alerts:* As a user, I can set an alert on the coin page (e.g. notify me when BTC > $35,000). The app should store the alert (just simulate; actual notification not needed in MVP).

  5. *Responsive Layout:* The UI must be mobile-friendly: on small screens, tables may scroll horizontally or stack.

- UI Components: Table (sortable columns), Autocomplete search field, Line chart (candlesticks if possible), Form for alerts (inputs for price and change% triggers), Responsive navigation bar.

- Tech Stack: Frontend can use React with Material UI or similar; use Chart.js for charts. Backend can be Node.js/Express. No actual DB needed for MVP; use in-memory or mock.

- Database Mock: If persisting watchlist/alerts, store them in memory or a simple JSON file (for prompt testing, not production).

- Constraints: Use real CoinGecko API for actual data (or simulated calls). Do not hardcode prices (except for mock data examples). Follow clean architecture: separation of components and services.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/f37929c3-6129-4097-a158-e0eaa41b9cea).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```

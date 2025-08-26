CREATE TABLE IF NOT EXISTS arbitrage_coins (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  symbol VARCHAR(10) NOT NULL,
  market_cap DECIMAL(20, 2) NOT NULL,
  current_price DECIMAL(20, 6) NOT NULL,
  arbitrage DECIMAL(10, 6) NOT NULL,
  ranking INT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert some initial data
INSERT INTO arbitrage_coins (name, symbol, market_cap, current_price, arbitrage, ranking)
VALUES 
  ('Bitcoin', 'BTC', 1000000000000, 50000.00, 0.05, 1),
  ('Ethereum', 'ETH', 500000000000, 3000.00, 0.04, 2),
  ('Binance Coin', 'BNB', 100000000000, 400.00, 0.03, 3);

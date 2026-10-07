# Bitcoin Market Sentiment vs Trader Performance

This notebook explores how the Fear and Greed Index relates to trader behavior and performance on Hyperliquid. The analysis covers 211,218 trades from 32 accounts between August 2024 and April 2025, cross-referenced with 2,644 daily sentiment readings.

## What is covered

- PnL breakdown across sentiment regimes
- Long vs short performance by sentiment
- Momentum vs contrarian strategy comparison
- Tail risk and loss concentration
- The HYPE token anomaly
- Day-of-week performance patterns
- Monthly PnL trends and trader consistency

## Data

- historical_data.csv: trade records from Hyperliquid
- fear_greed_index.csv: daily Fear and Greed Index values

## Running the notebook

Open `bitcoin_sentiment_analysis.ipynb` in Jupyter Notebook, VS Code, or Google Colab, then run the cells from top to bottom. Keep the trade data and Fear and Greed Index CSV files in the same working directory as the notebook so the analysis can load the datasets correctly.

## Documentation

- [Project overview](docs/project-overview.md)
- [Data sources](docs/data-sources.md)
- [Analysis workflow](docs/analysis-workflow.md)
- [Sentiment regimes](docs/sentiment-regimes.md)
- [Trader performance metrics](docs/trader-performance-metrics.md)
- [Risk notes](docs/risk-notes.md)
- [Reproducibility](docs/reproducibility.md)
- [Notebook checklist](docs/notebook-checklist.md)
- [Limitations](docs/limitations.md)

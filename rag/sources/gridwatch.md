# ⚡ GridWatch — AI-Driven Energy Theft & Anomaly Detection System
### 24-Hour Hackathon | Energy Conservation Week 2026

---

## 🚀 Setup & Run (Windows)

### Step 1 — Make sure Python is installed
Open Command Prompt and run:
```
python --version
```
You need Python 3.9 or above. Download from https://python.org if needed.

---

### Step 2 — Install all dependencies
Open Command Prompt INSIDE the gridwatch folder, then run:
```
pip install -r requirements.txt
```
This installs everything. Takes 1-2 minutes.

---

### Step 3 — Launch the dashboard
```
streamlit run dashboard.py
```
Your browser will open automatically at http://localhost:8501

---

## 🎮 How to Demo It

1. The dashboard loads with **30 days of pre-generated historical data**
2. Click **"Simulate New Readings"** in the sidebar to push live data
3. Watch the **Live Dashboard** — anomalies appear in red within seconds
4. Go to **Consumer Drilldown** → select C003, C007, or C009 to see theft patterns
5. Go to **Alert History** to see all flagged cases with risk scores

### The 3 "Theft" Consumers (for demo):
| Consumer | ID | Anomaly Type |
|---|---|---|
| Mohammed Iqbal | C003 | Meter tampered — usage drops to 20% of normal |
| Arjun Patel | C007 | Meter bypassed — near-zero readings |
| Venkat Raman | C009 | Gradual decline — slow tamper over time |

---

## 📁 File Structure
```
gridwatch/
├── dashboard.py        ← Main Streamlit app (run this)
├── model.py            ← Isolation Forest ML model
├── data_generator.py   ← Synthetic smart meter data
├── database.py         ← SQLite database layer
├── requirements.txt    ← All dependencies
└── README.md           ← This file
```

---

## ❓ Troubleshooting

**"streamlit is not recognised"**
→ Run: `pip install streamlit` then try again

**Dashboard is slow on first load**
→ Normal — it's generating 30 days of historical data and training ML models. Takes ~15 seconds once, then it's fast.

**Port already in use**
→ Run: `streamlit run dashboard.py --server.port 8502`

---

*Built with Python, Scikit-learn, Streamlit, SQLite, Plotly — 100% free & open source*

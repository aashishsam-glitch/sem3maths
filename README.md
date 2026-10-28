# SYSTEM BOTTLENECK IDENTIFICATION USING CORRELATION AND RANK CORRELATION

> **A Scientific 3D Software Analytics Application & Mathematical Performance Diagnostics Engine**  
> *Developed for Academic Defense, System Telemetry Evaluation, and Engineering Root-Cause Diagnostics.*

---

## 1. PROBLEM STATEMENT & OBJECTIVES

Modern distributed systems, cloud microservices, and multi-tier enterprise applications generate vast volumes of continuous performance telemetry. When response times degrade or latency spikes occur, systems engineers face an urgent diagnostic challenge: **Which hardware or software subsystem is most strongly associated with the performance degradation?**

Traditional approaches either rely on trial-and-error inspection or over-engineered "black box" machine learning models that obscure the underlying relationships between variables.

### Core Project Objectives:
1. **Mathematical Rigor**: Execute all correlation calculations purely in Python using foundational statistical science (**Pearson linear covariance** and **Spearman non-parametric rank correlation**).
2. **Visual Understandability**: Replace opaque spreadsheets and basic plots with an interactive **3D System Performance Observatory** that maps mathematical association directly onto 3D node geometry, dynamic spline connections, and live particle streams.
3. **Academic Integrity**: Enforce the foundational statistical principle: **"Correlation indicates association, NOT causation."** Metrics with high correlation are identified as *Potential Bottlenecks* and *Strongly Associated Metrics* that warrant targeted engineering investigation, rather than making unverified causal claims.
4. **Interactive Explainability**: Provide transparent step-by-step breakdowns showing original continuous values, fractional ranks, rank differences ($d_i$), sum of squares ($\sum d_i^2$), and LaTeX formulations for college project reviews and viva defenses.

---

## 2. SYSTEM ARCHITECTURE

The application follows a clean decoupled client-server architecture:

```
ia3maths/
├── backend/
│   ├── main.py                     # FastAPI REST API endpoints, CORS, static SPA mounting
│   ├── correlation_engine.py       # Pure Python Pearson r (with Fisher z CI) & Spearman rho engines
│   ├── bottleneck_detector.py      # Association scoring, risk classification & diagnostic evidence
│   ├── data_processor.py           # Data validation, cleaning, moments calculation & simulated telemetry
│   ├── models.py                   # Pydantic v2 data schemas & API contracts
│   ├── visualization.py            # Headless Matplotlib/Seaborn plot generators for export
│   ├── test_backend.py             # Automated unit tests for statistical correctness
│   └── requirements.txt            # Python dependencies
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── three/
│   │   │   │   └── SystemObservatory3D.tsx   # Interactive Three.js 3D System Observatory
│   │   │   └── dashboard/
│   │   │       ├── TopNavBar.tsx             # Header controls, workload selectors, health indicators
│   │   │       ├── KpiOverviewRibbon.tsx      # Top bottleneck & telemetry KPI cards
│   │   │       ├── BottleneckPanel.tsx        # Dedicated Bottleneck Hierarchy with supporting evidence
│   │   │       ├── CorrelationHeatmap.tsx     # Interactive multi-variable Pearson / Spearman matrix
│   │   │       ├── InteractiveScatterPlot.tsx # Raw continuous & rank-space regression scatter plots
│   │   │       ├── ComparisonView.tsx         # Side-by-side Pearson vs Spearman & step-by-step math
│   │   │       ├── DataTableModal.tsx         # Inline editable spreadsheet with outlier detection
│   │   │       ├── DataFlowPipeline.tsx       # 8-stage interactive pipeline schematic
│   │   │       ├── EducationalExplainer.tsx   # Viva presentation cheat sheet & academic guide
│   │   │       ├── ExportModal.tsx            # PDF/JSON/CSV/Markdown report generator
│   │   │       └── LiveAnalysisOverlay.tsx    # Multi-step statistical pipeline progress animation
│   │   ├── services/
│   │   │   └── api.ts                         # REST API client connecting to FastAPI backend
│   │   ├── styles/
│   │   │   └── index.css                      # Cyber grid, glassmorphism & dark tech theme
│   │   ├── types.ts                           # Full TypeScript interfaces matching backend models
│   │   ├── App.tsx                            # Root application state & stage orchestrator
│   │   └── main.tsx                           # React entry point
│   ├── package.json
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── sample_data/                    # Ready-to-use CSV performance datasets
│   ├── workload_cpu_bound.csv
│   ├── workload_memory_leak.csv
│   ├── workload_io_bound.csv
│   ├── workload_network_congestion.csv
│   └── workload_balanced.csv
│
├── run_app.py                      # One-click unified application runner
├── start.bat                       # Windows one-click launcher
└── README.md                       # Comprehensive academic & technical documentation
```

---

## 3. MATHEMATICAL FOUNDATIONS

All mathematical and statistical algorithms run strictly on the **Python backend** via NumPy, SciPy, and Pandas. **No correlation math is performed in JavaScript.**

### 3.1. Pearson Correlation Coefficient ($r$)

Measures the linear association and degree of linear co-variance between two continuous variables $X$ and $Y$:

$$r_{xy} = \frac{\sum_{i=1}^n (x_i - \bar{x})(y_i - \bar{y})}{\sqrt{\sum_{i=1}^n (x_i - \bar{x})^2} \sqrt{\sum_{i=1}^n (y_i - \bar{y})^2}} = \frac{\operatorname{Cov}(X, Y)}{s_x s_y}$$

Where:
- $r \in [-1, +1]$
- $+1$: Perfect positive linear relationship ($\text{CPU} \uparrow \implies \text{Response Time} \uparrow$)
- $0$: No linear relationship
- $-1$: Perfect inverse linear relationship

#### Hypothesis Testing & Confidence Interval:
- Two-tailed $p$-value computed via Student's $t$-distribution:
  $$t = r \sqrt{\frac{n-2}{1 - r^2}}, \quad \text{with } df = n - 2$$
- 95% Confidence Interval computed via **Fisher's $z$-transformation**:
  $$z = \operatorname{arctanh}(r) = \frac{1}{2} \ln \left(\frac{1+r}{1-r}\right), \quad SE_z = \frac{1}{\sqrt{n-3}}$$

---

### 3.2. Spearman Rank Correlation Coefficient ($\rho$)

Measures the **monotonic relationship** between two variables using their ordinal ranks. It does not require variables to be normally distributed or relationships to be strictly linear:

1. Transform raw continuous values $x_i, y_i$ into fractional ranks $R(x_i), R(y_i)$ (handling duplicate ties via average fractional ranks).
2. Calculate rank difference vectors:
   $$d_i = R(x_i) - R(y_i)$$
3. When ties are absent:
   $$\rho = 1 - \frac{6 \sum_{i=1}^n d_i^2}{n(n^2 - 1)}$$
4. When ties are present, the backend calculates Pearson's correlation applied directly to the rank variables for exact precision.

#### Why both Pearson and Spearman are combined:
- **Linear Queuing vs. Threshold Hockey-Stick Saturation**: In computing systems, queuing delays often explode non-linearly when resource utilization exceeds 80%. Spearman captures this monotonic escalation ($\rho \approx 0.94$) even when Pearson underestimates it ($r \approx 0.78$).
- **Outlier Sensitivity**: A high Pearson with a low Spearman indicates extreme outlier leverage pulling the regression slope. Close alignment between both confirms a reliable, robust trend.

---

### 3.3. Bottleneck Identification & Scoring Logic

The application evaluates candidate metrics against the selected target metric (default: `Response_Time`):

1. **Composite Association Score**:
   $$\text{Score}(M_j) = 0.5 \times |r(M_j, T)| + 0.5 \times |\rho(M_j, T)|$$
2. **Risk Categorization**:
   - **HIGH RISK** ($\text{Score} \ge 0.70$ and $r > 0.2$): Metric exhibits severe co-elevation with response time.
   - **MEDIUM RISK** ($0.40 \le \text{Score} < 0.70$): Moderate co-movement; secondary contributing resource.
   - **LOW RISK** ($\text{Score} < 0.40$): Low association; unlikely primary bottleneck in current regime.
3. **Academic Phrasing**:
   - Metrics are explicitly flagged as *"Potential Bottleneck"*, *"Strongly Associated Metric"*, or *"Requires Further Investigation"*.
   - The UI surfaces specific targeted engineering investigation steps (e.g. CPU flame graphs, lock contention, JVM GC pause logs, disk queue depth, or network socket timeouts).

---

## 4. 3D SYSTEM OBSERVATORY EXPERIENCE

The central visualization is an interactive **3D System Performance Observatory** built with Three.js:

- **Central SYSTEM CORE**: Glowing reactor sphere surrounded by rotating gimbal rings and an outer wireframe cage.
- **Interconnected 3D Metric Nodes**:
  - `CPU_Utilization` (Top $+Y$)
  - `Memory_Usage` (Left $-X$)
  - `Disk_IO` (Right $+X$)
  - `Network_Latency` (Forward $+Z$)
  - `Response_Time` (Target node)
- **Dynamic 3D Interconnects**:
  - Catmull-Rom spline tubes connect each metric to the target node and system core.
  - **Thickness & Glow**: Scaled proportionally to $|r|$.
  - **Color Coding**: Crimson/Amber for strong positive ($r \ge 0.6$), Cyan for moderate, Purple for negative.
  - **Dynamic Energy Particles**: Particles travel along the spline paths into Response Time at velocities proportional to correlation strength.
- **Interactive Controls**:
  - Orbit rotation (left click + drag), zoom (mouse wheel), pan (right click).
  - Hovering a node displays a futuristic 3D HUD billboard with live Mean, P95, Pearson $r$, Spearman $\rho$, and Risk level.
  - Clicking any 3D node automatically focuses the scatter plot and updates the detail inspector.

---

## 5. SIMULATED WORKLOAD PRESETS

The application includes 6 realistic simulated performance workloads (labeled clearly as *"Simulated Dataset"*):

1. **CPU Compute Saturation (Crypto / Microservices)**: High CPU utilization (75-98%) driving direct response time escalation ($r \approx 0.92, \rho \approx 0.94$).
2. **Progressive Memory Leak & GC Storm**: Memory climbs monotonically from 42% to 96%. Major GC pause storms cause hockey-stick response time spikes ($\rho > r$).
3. **Database I/O & Disk Write Saturation**: Disk queue depth explodes under heavy batch writes ($r \approx 0.89$).
4. **Cross-Datacenter Network Latency Spike**: WAN latency jitter and packet buffer queues dominate end-to-end response time.
5. **Balanced Nominal Operations (Healthy Cluster)**: All metrics operate well below saturation limits ($|r| < 0.25$).
6. **Multi-Resource Traffic Surge**: Concurrency burst straining both CPU compute threads and network buffers.

---

## 6. INSTALLATION & SETUP

### Prerequisites:
- Python 3.10+ (Verified on Python 3.14.3)
- Node.js 18+ (Verified on Node v24.14.0)

### Quick One-Click Launch (Recommended):

On Windows:
```cmd
start.bat
```

Or from terminal / PowerShell:
```bash
python run_app.py
```

This single command starts the Python FastAPI backend, serves the complete built 3D Observatory frontend, and automatically opens your default browser at `http://127.0.0.1:8000/`.

---

### Manual Launch (Separate Dev Mode):

#### 1. Start Python Backend:
```bash
python -m uvicorn backend.main:app --host 127.0.0.1 --port 8000
```
- API Docs: `http://127.0.0.1:8000/docs`
- Health check: `http://127.0.0.1:8000/health`

#### 2. Start Frontend Dev Server (in a new terminal):
```bash
cd frontend
npm install
npm run dev
```
- Frontend: `http://127.0.0.1:5173/`

---

## 7. RUNNING AUTOMATED TESTS

The backend includes a comprehensive automated test suite verifying statistical accuracy, edge cases (perfect correlation, inverse correlation, non-linear monotonic curves, constant vectors), data validation, and workload presets:

```bash
python backend/test_backend.py
```

Output:
```
.......
----------------------------------------------------------------------
Ran 7 tests in 0.376s

OK
```

---

## 8. STEP-BY-STEP VIVA & DEMONSTRATION WALKTHROUGH

Follow this sequence during your project review or viva presentation:

1. **Launch the Application**: Run `python run_app.py`. The browser opens showing the 3D System Performance Observatory with real-time particle streams.
2. **Explain the 3D Observatory**: Rotate the 3D view. Point out the central core and peripheral metric nodes. Explain that tube thickness and particle speed are mathematically derived from Pearson $r$.
3. **Inspect the KPI Ribbon**: Point out the *Potential Bottleneck* card, highest Pearson $r$, highest Spearman $\rho$, and average target latency.
4. **Trigger Live Analysis**: Click **"Run Analysis"**. Walk the reviewer through the 7-step pipeline animation executing in Python.
5. **Demonstrate Bottleneck Hierarchy**: Point to the right-hand panel. Highlight the academic disclaimer: *"Correlation indicates association, NOT causation."* Expand the top-ranked bottleneck to show supporting evidence and diagnostic recommendations.
6. **Inspect Correlation Heatmap**: Switch between **Pearson (r)**, **Spearman (ρ)**, and **|r - ρ| Diff**. Click a cell (e.g. CPU vs Response Time) to demonstrate instant drill-down.
7. **Inspect Dual Scatter Plot**:
   - Toggle **Raw Scale**: Show the least-squares regression trendline equation ($y = mx + c$) and $R^2$.
   - Toggle **Rank Space**: Show how Spearman ranking maps data into ordinal monotonic alignment.
8. **Demonstrate Pearson vs Spearman Comparison**: Open the Comparison tab. Click **"View Steps"** on any metric to reveal the exact step-by-step table showing raw values, assigned ranks $R(x)$ and $R(y)$, rank differences $d_i$, and squared differences $d_i^2$.
9. **Show Interactive Data Editor**: Click **"Data Editor"** in the top bar. Edit a row's value or add a new observation. Click **"Apply & Re-run Analysis"** to prove the calculations dynamically re-compute in Python.
10. **Explain Educational Mode**: Toggle **"Explain Analysis"**. Review the viva defense cards explaining why correlation does not equal causation, confounding variables, and how duplicate ranks are resolved.
11. **Export the Report**: Click **"Export"** to download the analysis as Markdown, JSON, or CSV.

---

## 9. IMPORTANT ACADEMIC DISCLAIMER

> **"CORRELATION INDICATES ASSOCIATION, NOT CAUSATION."**  
> High statistical correlation between a system metric (such as CPU Utilization) and Response Time proves that elevated values of both variables co-occur within the observed dataset. It does **not** prove that CPU utilization is the root cause of latency degradation. Common confounding factors (such as external request concurrency surges) can simultaneously elevate multiple independent metrics. Consequently, all metrics flagged by this system are classified as **Potential Bottlenecks** that guide where engineers should conduct targeted runtime profiling.

---

## 10. TECHNOLOGY STACK SUMMARY

| Component | Technology | Role |
|---|---|---|
| **Language** | Python 3.10+ | Core analytical calculations, statistical modeling |
| **Data Handling** | Pandas | Tabular ingestion, cleaning, median imputation |
| **Numerical Processing** | NumPy | Matrix vectorization, variance verification |
| **Statistical Engine** | SciPy (`scipy.stats`) | Pearson $r$, Spearman $\rho$, Student's $t$, Fisher $z$ CIs, rankdata |
| **Web API** | FastAPI / Uvicorn | High-performance asynchronous REST endpoints |
| **Frontend Framework** | React 18 + TypeScript | Component modularity, type-safe API consumption |
| **3D Observatory** | Three.js | WebGL 3D scene, dynamic spline tubes, particle flow, raycasting |
| **Styling & UI** | Tailwind CSS + Lucide Icons | Dark futuristic technical observatory, glassmorphism |
| **Build Tool** | Vite | Lightning-fast HMR and optimized production bundling |

---

## 11. LICENSE

Developed for academic research and software performance analytics.
Open for academic review and educational demonstration.

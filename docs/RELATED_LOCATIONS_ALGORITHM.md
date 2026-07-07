# Related Locations Recommendation Algorithm

This document details the production-ready design, mathematical formulas, configurations, and complexities of the Trouvailler travel destination recommendation engine.

---

## 1. Core Mathematical Scoring Formula

The algorithm evaluates candidates and assigns a final floating-point score based on the category profile and geographical proximity of the target destination relative to the candidate:

$$\text{Final Score} = \left( W_{\text{cat}} \cdot S_{\text{cat}} \right) + \left( W_{\text{geo}} \cdot S_{\text{geo}} \right)$$

### Configuration Tuner
These variables are defined in the configuration object `RECOMMENDATION_CONFIG` at the top of the service layer to allow tuning without changing the core scoring loop:
* **`W_CAT` (Category Similarity Weight)**: `85.0` (Vibe match dictates the primary signal)
* **`W_GEO` (Geographic Weight)**: `15.0` (Geography serves as context)
* **`GEO_SAME_STATE` (Same State Score)**: `1.0`
* **`GEO_SAME_COUNTRY` (Same Country, different State Score)**: `0.4`
* **`GEO_DIFF_COUNTRY` (Different Country Score)**: `0.0`
* **`STATE_CAP` (State Diversity Cap)**: `3` (Max recommendations allowed from same state)
* **`COUNTRY_CAP` (Country Diversity Cap)**: `5` (Max recommendations allowed from same country)

---

## 2. Scoring Components

### Component A: Category Similarity Score ($S_{\text{cat}}$)
To evaluate how well a destination satisfies a traveler's expectations without penalizing multi-attribute locations, the engine uses **Target-Focused Coverage**:

$$S_{\text{cat}} = \frac{|C_{\text{target}} \cap C_{\text{candidate}}|}{|C_{\text{target}}|}$$

* *If target has no categories ($|C_{\text{target}}| = 0$), $S_{\text{cat}}$ defaults to $0.0$.*

### Component B: Geographic Proximity Score ($S_{\text{geo}}$)
A single-pass tree resolver `resolveHierarchyPath` recursively parses the `parentLocation` references to determine state and country mappings:

$$S_{\text{geo}} = \begin{cases} 
      \text{GEO\_SAME\_STATE} & \text{Same State} \\
      \text{GEO\_SAME\_COUNTRY} & \text{Same Country, different State} \\
      \text{GEO\_DIFF\_COUNTRY} & \text{Global (different Country or no shared hierarchy)} 
   \end{cases}$$

---

## 3. Deterministic Stable Tie-Breaking Sequence

When two candidates receive the same final score, ties are resolved deterministically using this sequence:
1. **Raw Vibe Similarity**: Match of categories (highest $S_{\text{cat}}$).
2. **Absolute Count**: Greater absolute count of shared categories ($|C_{\text{target}} \cap C_{\text{candidate}}|$).
3. **Geographical Proximity**: Same State first, then Same Country.
4. **Stable Fallback**: Alphabetical sorting by location name (`name` field) followed by MongoDB Object ID string comparison as the absolute fallback.

---

## 4. Diversity Filters & Fallbacks

* **Diversity Caps**: No more than 3 locations from the same state and 5 from the same country are returned in the top 10 list (bypassed if candidate pool is $< 10$).
* **Target with No Categories Fallback**: If the target has no categories, $S_{\text{cat}}$ is $0.0$. The system evaluates candidates using pure geographic proximity ($S_{\text{geo}} \cdot W_{\text{geo}}$), applies diversity caps, and sorts them using the stable tie-breaker sequence.
* **Empty Result Fallback**: If no destinations obtain a matching category, the engine scores all active destinations using geographic proximity, runs the diversity caps check, and sorts them using the stable tie-breaker sequence.

---

## 5. Algorithmic Complexity & Scalability

* **Hierarchy Resolution**: $O(N \cdot H)$ where $N$ is the number of active locations and $H$ is the tree height (max depth of 3). Single-pass traversals are cached to prevent redundant lookups.
* **Scoring**: $O(N \cdot C)$ where $C$ is the average number of category tags per location.
* **Sorting**: $O(N \log N)$ comparison-based sort.
* **Extensibility**: The scoring pipeline is modular, allowing additional scoring components (e.g. season, rating) to be added as simple weighted sums in the future.

# Related Packages Recommendation Engine Algorithm

This document details the production-ready design, mathematical formulas, configurations, and complexities of the Trouvailler travel package recommendation engine.

---

## 1. Core Mathematical Scoring Formula

The algorithm evaluates candidates and assigns a final floating-point score based on the category profile, multi-city itineraries, durations, and price bands:

$$\text{Final Score} = (W_{\text{cat}} \cdot S_{\text{cat}}) + (W_{\text{loc}} \cdot S_{\text{loc}}) + (W_{\text{dur}} \cdot S_{\text{dur}}) + (W_{\text{price}} \cdot S_{\text{price}})$$

### Configuration Tuner
These variables are defined in the configuration object `PACKAGE_RECO_CONFIG` at the top of the service layer to allow tuning without changing the core scoring loop:
* **`W_CAT` (Category Similarity Weight)**: `50.0` (Primary signal weight: 50%)
* **`W_LOC` (Geographic Weight)**: `30.0` (Secondary signal weight: 30%)
* **`W_DUR` (Duration Band Similarity Weight)**: `10.0` (Duration weight: 10%)
* **`W_PRICE` (Price Tier Similarity Weight)**: `10.0` (Budget weight: 10%)

* **`W_ITINERARY`**: `0.7` (Weight of itinerary overlaps)
* **`W_HIERARCHY`**: `0.3` (Weight of main location hierarchical matching)

* **`GEO_SAME_DEST`**: `1.0` (Same main location)
* **`GEO_SAME_STATE`**: `0.5` (Same state parent)
* **`GEO_SAME_COUNTRY`**: `0.2` (Same country parent)

* **`DUR_WEEKEND`**: `3` (Weekend duration bound)
* **`DUR_SHORT`**: `6` (Short tour duration bound)
* **`DUR_MEDIUM`**: `10` (Medium tour duration bound)

* **`PRICE_BUDGET`**: `20000` (Budget upper limit)
* **`PRICE_STANDARD`**: `75000` (Standard upper limit)
* **`PRICE_PREMIUM`**: `200000` (Premium upper limit)

* **`STATE_CAP`**: `3` (Max recommendations allowed from same state)
* **`LOCATION_CAP`**: `3` (Max recommendations allowed from same main location)

---

## 2. Scoring Components

### Category Similarity Score ($S_{\text{cat}}$)
Uses target-focused overlap coverage:

$$S_{\text{cat}} = \frac{|C_{\text{target}} \cap C_{\text{candidate}}|}{|C_{\text{target}}|}$$

* *If target has no categories, $S_{\text{cat}}$ defaults to $0.0$.*

### Geographic Similarity Score ($S_{\text{loc}}$)
Combines multi-destination itinerary coverage (70% weight) with hierarchy matching (30% weight):

$$S_{\text{loc}} = (W_{\text{itinerary}} \cdot S_{\text{itinerary}}) + (W_{\text{hierarchy}} \cdot S_{\text{hierarchy}})$$

Where:
* **Itinerary Similarity ($S_{\text{itinerary}}$)**: Target-focused coverage of the complete `locations` array (main location + locations list):
  $$S_{\text{itinerary}} = \frac{|L_{\text{target}} \cap L_{\text{candidate}}|}{|L_{\text{target}}|}$$
* **Hierarchy Similarity ($S_{\text{hierarchy}}$)**: Matches the `mainLocation` parent branches resolved via single-pass traversals:
  $$S_{\text{hierarchy}} = \begin{cases} 
      \text{GEO\_SAME\_DEST} & \text{Same Main Location} \\
      \text{GEO\_SAME\_STATE} & \text{Same State parent, diff Main Location} \\
      \text{GEO\_SAME\_COUNTRY} & \text{Same Country parent, diff State} \\
      0.0 & \text{Global (diff Country)} 
   \end{cases}$$

### Duration Band Similarity ($S_{\text{dur}}$)
Trips are classified into four bands:
* **Weekend**: $1 \➔ 3$ days
* **Short**: $4 \➔ 6$ days
* **Medium**: $7 \➔ 10$ days
* **Long**: $11+$ days

*If both share the same Duration Band, $S_{\text{dur}} = 1.0$, otherwise $0.0$.*

### Price Band Similarity ($S_{\text{price}}$)
Packages are grouped into budget tiers:
* **Budget**: $\le 20,000$
* **Standard**: $\le 75,000$
* **Premium**: $\le 200,000$
* **Luxury**: $> 200,000$

*If both share the same Price Band, $S_{\text{price}} = 1.0$, otherwise $0.0$.*

---

## 3. Stable Tie-Breaking Sequence

Ties are resolved deterministically:
1. Higher Category Similarity Score ($S_{\text{cat}}$).
2. Higher Itinerary overlap size ($|L_{\text{target}} \cap L_{\text{candidate}}|$).
3. Alphabetical comparison of package `title` string.
4. Lexicographical comparison of MongoDB `_id` strings.

---

## 4. Diversity Filters & Fallbacks

* **Diversity Caps**: Max 3 recommendations from the same main location and 3 from the same state parent (bypassed if candidate pool is $< 10$).
* **Fallback Strategy**: If no category fits ($score = 0$), candidates are evaluated under duration and price band similarity, applying diversity caps and stable tie-breakers.

---

## 5. Complexity & Scalability

* **Scoring**: $O(N)$ linear candidates traversal.
* **Sorting**: $O(N \log N)$ comparison-based sort.
* **Extensibility**: Modular pipeline allows adding new signals (e.g. difficulty, seasonality) by appending new weighted products to the summation without affecting core category/geographic lookups.

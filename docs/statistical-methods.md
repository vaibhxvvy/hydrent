# Statistical Methods

HydRent is intended to be a strong data science and academic portfolio project. The statistical layer is explicit, testable, and explainable.

## Weighted Median

Simple averages are fragile in rental markets because a few broker-inflated or luxury outlier listings can distort expectations. HydRent uses weighted medians:

```text
weight = trust_score * time_decay * rent_type_weight * anomaly_resistance
```

Closed rents receive the highest rent type weight. Asking rents receive lower weight until validated.

## Percentile Bands

HydRent publishes percentile ranges:

- P10: unusually low but plausible.
- P25: lower quartile.
- Median: central expectation.
- P75: upper quartile.
- P90: high-end market.

This gives renters a negotiation range rather than a misleading single number.

## Time Decay

Older data loses influence:

- Under 30 days: full weight.
- 1 to 3 months: high-medium weight.
- 3 to 6 months: medium weight.
- 6 to 12 months: low weight.
- 12+ months: minimal influence.

The implementation lives in `timeDecayWeight`.

## Anomaly Detection

HydRent uses three complementary methods:

1. Z-score
   - Measures distance from mean in standard deviations.
   - Useful but sensitive to outliers.

2. IQR
   - Flags values outside quartile fences.
   - More robust than mean-based methods.

3. MAD
   - Median absolute deviation.
   - Robust against skewed rental distributions.

The platform stores anomaly pressure rather than blindly deleting data. Some outliers are real luxury units; they should be down-weighted or explained, not erased automatically.

## Confidence Score

Aggregate confidence combines:

- Sample size.
- Verified ratio.
- Average freshness.
- Variance score.
- Weight health.

This distinguishes "the median is high because data says so" from "the median is high but the dataset is thin."

## Affordability Metrics

The app includes rent-to-income pressure using locality-level income assumptions. Future work can support:

- Household income inputs.
- Commute-adjusted affordability.
- Rent per person for shared occupancy.
- Deposit burden.
- Maintenance burden.

## Future ML Architecture

Future ML can be layered on top of transparent statistics:

- Linear regression for baseline rent prediction.
- Random forest for nonlinear feature impact.
- Time-series forecasting for locality trends.
- Spatial clustering for micro-market discovery.
- Anomaly clustering for fraud campaigns.

Predictions should never replace verified aggregate data. They should be labeled as forecasts.

# Shared by the plates of this chapter

## Method

<!-- added to the end of every plate's Method -->
Each sheet shows a window of the (u, v) plane at equal scale on both axes, with u = u₀ + sθ₁ and v = v₀ + sθ₂.
Curvatures λ and step sizes η are given in the units of θ, which the optimizers move.
The surface is f under a soft cap, `L = A f/(H + f)`, with f measured from its global minimum.
So L ≈ (A/H) f near the bottom, where f is small compared with H, and far up it levels off below A.
L has the same [[critical points|crit]] as f, of the same kinds, and its gradient points the same way, so [[gradient flow|gflow]] follows the same paths and has the same basins.
The gradient, and the Hessian at a critical point, are multiplied by `AH/(H + f)²`, which is smallest on high ground.
Each race releases six particles per optimizer, scattered by about 0.006, from one point.
So a start on a basin boundary shows up as a split race.
All optimizers share one η, though Adam’s step is about η per coordinate whatever the size of the gradient.

## Figure caption: race

log₁₀(L − L*) along each optimizer’s path in the latest race, averaged over its particles still moving, with L* the lowest loss on the sheet.
A line ends when all of them have come to rest.

## Figure caption: arrivals

Where each optimizer’s particles came to rest, by minimum, as a share of all its particles that settled since the plate opened.
Optimizers that sent every start to the same minimum would have matching bars.

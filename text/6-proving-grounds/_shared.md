# Shared by the plates of this chapter

## Method

<!-- added to the end of every plate's Method -->
Each sheet shows a window of the (u, v) plane at equal scale on both axes, with u = u₀ + sθ₁ and v = v₀ + sθ₂; λ and η are in θ.
The surface is `L = A f/(H + f)`, with f measured from its global minimum, so L ≈ (A/H) f near the bottom and levels off below A far up.
L has the same [[critical points|crit]] as f, of the same kinds, and its gradient points the same way, so [[gradient flow|gflow]] follows the same paths and has the same basins.
The gradient, and the Hessian at a critical point, are multiplied by `AH/(H + f)²`.
Each race releases six particles per optimizer, scattered by about 0.006, from one point.
All optimizers share one η, though Adam’s step is about η per coordinate whatever the size of the gradient.

## Figure caption: race

log₁₀(L − L*) along each optimizer’s path in the latest race, averaged over its particles still moving. A line ends when all of them have come to rest.

## Figure caption: arrivals

Where each optimizer’s particles came to rest, by minimum, as a share of all its particles that settled since the plate opened.

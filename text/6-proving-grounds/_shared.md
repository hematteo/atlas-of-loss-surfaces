# Shared by the plates of this chapter

## Method

<!-- added to the end of the Method of every plate in this chapter except sculpt; rosenbrock, rastrigin and ackley show the race figure, himmelblau and camel the arrivals figure -->
Each sheet shows a window of the (u, v) plane at equal scale on both axes.
The optimizers move the parameters θ, which map to the plane by u = u₀ + sθ₁ and v = v₀ + sθ₂.
Curvatures λ and step sizes η are given in the units of θ.
All optimizers share one η, though Adam’s step is about η per coordinate whatever the size of the gradient.

The loss is f under a soft cap, `L = A f/(H + f)`, with f measured from its global minimum.
So L ≈ (A/H) f where f is small compared with H, and L levels off below A where f is large.

L has the same [[critical points|crit]] as f, of the same kinds, and its gradient points the same way.
So [[gradient flow|gflow]] follows the same paths and has the same basins.
The gradient, and the Hessian at a critical point, are multiplied by `AH/(H + f)²`.
This factor is smallest where f is large.

After any fixed starts a plate lists, races start at random points of high loss, at the interval the plate gives.
Each race releases six particles per optimizer from one point, scattered by about 0.006.
So a start on a basin boundary shows up as a split race.
A particle retires when it comes to rest or after the number of steps the plate gives.

The readouts give each optimizer’s lowest L − L* in the latest race or, where the figure shows bars by minimum, the counts behind them.

## Figure caption: race

log₁₀(L − L*) along each optimizer’s path in the latest race, averaged over its particles still moving, with L* the lowest loss on the sheet.
A line ends when all of them have come to rest.

## Figure caption: arrivals

Where each optimizer’s particles came to rest, by minimum, as a share of all its particles that settled since the plate opened.
Optimizers that sent every start to the same minimum would have matching bars.

# Ackley’s well

## Subtitle

Gradient descent and Adam stop in the first dimple; the heavy ball sometimes crosses the ripples into the funnel.

## Lead

Ackley’s function, `f = −20 exp(−0.2 √(½(u² + v²))) − exp(½(cos 2πu + cos 2πv)) + 20 + e`, is a nearly flat, rippled plain with one funnel at the origin (Ackley 1987).
Away from the centre the ripples are steeper than the funnel, so the gradient points to the nearest dimple.

## In practice

Ripples steeper than the large-scale trend trap methods that follow the local gradient.
Smoothing over larger scales, by noise or a population, can recover the trend.

## Try

1. Watch the five fixed races → [[gradient descent|gd]] and [[Adam|adam]] always stop in the dimple nearest their start.
2. Follow the [[heavy ball|hb]] in races two to four, which start 1.6 to 2.3 from the origin → most of its particles reach the funnel.
3. Click at distance 1.4 or 1.6 → the heavy ball reaches the funnel from 16 of 36 directions; at 1.8 to 2.5 from 4, at 2.8 and beyond from none.
4. Click at 1.0 or 1.2 → the heavy ball never reaches the funnel: from inside the first ring of dimples it never gathers enough speed.

## Background

Ackley (1987) defined the function in two dimensions to test a genetic hill-climbing algorithm.
Bäck and Schwefel (1993) generalized it to n dimensions, with the root mean square of the coordinates in the first exponential and the mean of their cosines in the second.
It is usually evaluated on [−32.768, 32.768]ⁿ, with the global minimum f = 0 at the origin and a local minimum near almost every point with integer coordinates.

The two terms have different scales.
The funnel term decays with distance from the origin, and its slope is at most 2.8.
The ripple term has the same amplitude everywhere, and its slope reaches 5.8.
A method that follows the local gradient therefore stops in the first dimple it meets, at every step size tried on this sheet, unless it starts inside the funnel’s own basin.
Averaging f over one ripple period removes the ripples and leaves the funnel, so methods that sample f over larger scales, such as population-based and noisy searches, can follow the funnel.
Momentum averages gradients over time rather than space, and on this sheet that is enough to cross a few ripples, but only for starts that give it a run-up.

## Method

The window is a close-up of the centre, u ∈ [−3.2, 3.2], v ∈ [−2, 2], with A = 2.2, H = 10 and η = 0.012.
The funnel’s tip is a cone, with no curvature at its point.
Here `√(½(u² + v²) + 0.05²)` replaces the root mean square, which rounds the tip within about 0.07 of the origin and gives it λ<sub>max</sub> = 79, and the constant is lowered by 20(1 − e<sup>−0.01</sup>) ≈ 0.199 so that f(0, 0) = 0.
The sheet has 23 minima, 58 saddles and 24 maxima.
The first five races start from fixed points 1.6 to 2.9 from the origin, later ones at random on high ground, one every 2,500 steps; particles retire at rest or after 2,400 steps.
The figure plots log₁₀(L − L*) against step, averaged over each optimizer’s particles still moving; the readouts give the lowest L − L* each reached in the latest race.

## References

- Ackley, D. H. (1987). A Connectionist Machine for Genetic Hillclimbing. Kluwer.
  Defines the function in two dimensions, as a test for a genetic hill-climbing algorithm.
- Bäck, T. and Schwefel, H.-P. (1993). An overview of evolutionary algorithms for parameter optimization. Evolutionary Computation 1(1).
  Generalizes the function to n dimensions.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
  Definitions, usual domains and minima of the standard test functions.

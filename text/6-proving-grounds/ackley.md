# Ackley’s well

## Subtitle

A rippled plain with one funnel, to ask when momentum carries the heavy ball over the ripples that trap gradient descent and Adam.

## Lead

Ackley’s function is a nearly flat plain covered in ripples, with one funnel at the origin (Ackley 1987).
In symbols, `f = −20 exp(−0.2 √(½(u² + v²))) − exp(½(cos 2πu + cos 2πv)) + 20 + e`: the first term makes the funnel and the second the ripples.
Away from the centre the ripples are steeper than the funnel, so the gradient points to the nearest dimple (a shallow local minimum between ripples), not to the origin.
So a gradient method sees only the ripples, and this plate tests whether momentum can see past them.

## In practice

Ripples steeper than the large-scale trend trap methods that follow the local gradient.
Smoothing over larger scales, by noise or a population, can recover the trend, because averaging over a ripple’s period cancels the ripple.

## Try

1. Watch the five fixed races → [[gradient descent|gd]] and [[Adam|adam]] always stop in the dimple nearest their start.
   Outside the funnel’s own basin, the ripples’ slope beats the funnel’s.
2. Follow the [[heavy ball|hb]] in races two to four, which start 1.6 to 2.3 from the origin → most of its particles reach the funnel.
   Momentum averages recent gradients: the ripples’ pushes change sign from one ripple to the next and partly cancel, while the funnel’s pull adds up.
3. Click at distance 1.4 or 1.6 from the origin → from 20 of 36 directions, some of the heavy ball’s particles reach the funnel.
   From 1.8 to 2.5 this happens in at most 2 directions, and from 2.8 and beyond in none.
   Farther out, the funnel’s pull is weaker and there are more ripples to cross.
4. Click at 1.0 or 1.2 → the heavy ball reaches the funnel from no direction at 1.0, and at 1.2 from only 3 of 36, with a few of its particles.
   From inside the first ring of dimples it rarely gathers enough speed.
   So momentum needs a run-up as well as a pull, and only a band of starts gives it both.

## Background

Ackley (1987) defined the function in two dimensions to test a genetic hill-climbing algorithm.
Bäck and Schwefel (1993) generalized it to n dimensions, with the root mean square of the coordinates in the first exponential and the mean of their cosines in the second.
It is usually evaluated on [−32.768, 32.768]ⁿ, with the global minimum f = 0 at the origin and a local minimum near almost every point with integer coordinates.

The two terms have different scales, and this is what makes the function hard.
The funnel term decays with distance from the origin, and its slope is at most 2.8.
The ripple term has the same amplitude everywhere, and its slope reaches 5.8 along the axes and 6.5 at most.
So a method that follows the local gradient stops in the first dimple it meets, at every step size tried on this sheet, unless it starts inside the funnel’s own basin.

Averaging is the way past the ripples.
Averaging f over one ripple period removes the ripples and leaves the funnel.
So methods that sample f over larger scales, such as population-based and noisy searches, can follow the funnel.
Momentum averages gradients over time rather than space.
On this sheet that is enough to cross a few ripples, but only for starts that give it a run-up, i.e. room to build speed.

## Method

The window is a close-up of the centre, u ∈ [−3.2, 3.2], v ∈ [−2, 2], with A = 2.2, H = 10 and η = 0.012.
The funnel’s tip is a cone, with no curvature at its point: its slope does not shrink near the minimum, so gradient descent could never settle there.
Here `√(½(u² + v²) + 0.05²)` replaces the root mean square.
This rounds the tip within about 0.07 of the origin and gives it [[λ<sub>max</sub>|sharpness]] = 82.
The constant is lowered by 20(1 − e<sup>−0.01</sup>) ≈ 0.199 so that f(0, 0) = 0.
The sheet has 23 minima, 58 saddles and 24 maxima.
The first five races start from fixed points 1.6 to 2.9 from the origin, and later ones at random on high ground, one every 2,500 steps.
Particles retire at rest or after 2,400 steps.
The figure plots log₁₀(L − L*) against step, averaged over each optimizer’s particles still moving.
The readouts give the lowest L − L* each reached in the latest race.

## At scale

The n-dimensional form has a dimple near almost every integer point, so the number of local minima grows exponentially with n.
Network losses are thought to be different.
In high dimensions most of their high-loss critical points are saddles rather than minima (see <i>Saddle points</i> and <i>Rastrigin’s egg crate</i>).
So being trapped in the nearest dimple is rarely the problem training has to solve.

## References

- Ackley, D. H. (1987). A Connectionist Machine for Genetic Hillclimbing. Kluwer.
  Defines the function in two dimensions, as a test for a genetic hill-climbing algorithm.
- Bäck, T. and Schwefel, H.-P. (1993). An overview of evolutionary algorithms for parameter optimization. Evolutionary Computation 1(1).
  Generalizes the function to n dimensions.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
  Definitions, usual domains and minima of the standard test functions.

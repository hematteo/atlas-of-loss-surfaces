# The six-hump camel

## Subtitle

Six minima, two of them global, where the start, not the optimizer, decides which one gradient descent, the heavy ball and Adam reach.

## Lead

When a surface has several minima, what decides which one a gradient method ends in?
The six-hump camel function, `f = (4 − 2.1u² + u⁴/3)u² + uv + (4v² − 4)v²`, is a standard test problem for global optimization (the search for the lowest of several minima), usually cited to Dixon and Szegő (1978).
It has six minima: two global ones with f = −1.0316, at ±(0.0898, −0.7126), and two pairs of local ones.
This plate answers it by counting where three optimizers end from the same starts.

## In practice

Where a gradient method ends depends mostly on its start, so results from a few starts say little.
Benchmark from many starts and report the distribution of outcomes, i.e. how often each minimum is reached.

## Try

1. Watch the figure → for each of [[gradient descent|gd]], the [[heavy ball|hb]] and [[Adam|adam]], about 52% of the particles that come [[to rest|rest]] reach the global minima, A and B.
   The share is set mostly by how much high ground drains to A and B.
2. Click the saddle at the origin → every optimizer’s six particles split between A and B: the release point lies on the boundary of their [[basins|basin]].
   The particles start only slightly apart, and on a boundary that is enough.
3. Raise the heavy ball’s momentum β to 0.99 → over 600 races, its share at E and F falls from 12% to 6%, and its share at C and D rises from 36% to 39%.
   More momentum carries more particles out of the shallow outer minima.
4. Compare gradient descent → its shares stay at 21% for E and F and 27% for C and D.
   Without momentum, gradient descent keeps the shares of gradient flow.

## Background

The function is one of the small test problems used since the 1970s to compare methods that must find the lowest of several minima.
On its usual window, u ∈ [−3, 3] and v ∈ [−2, 2], it has 15 [[critical points|crit]]: six minima, seven [[saddles|saddle]] and two maxima.
It is symmetric under `(u, v) → (−u, −v)`, so every feature has a twin through the origin, and the saddle at the origin separates the two global minima.

For a method that follows the gradient, the outcome is set by the [[basins of attraction|basin]] of [[gradient flow|gflow]].
The basin of a minimum is the set of starts from which gradient flow (gradient descent with vanishingly small steps) ends there.
On this sheet gradient descent reproduces these basins.
Over 600 races it divided its particles among the three pairs of minima as 52%, 27% and 21%, within 0.2 percentage points of gradient flow from the same 600 starts.

Momentum and Adam change the paths, and near basin boundaries they can end elsewhere.
In the same 600 races, the minimum where most of the heavy ball’s particles came to rest differed from gradient descent’s in 10% of races, and Adam’s in 3%.
Adam’s share of each pair stayed within half a percentage point of gradient descent’s.
The heavy ball’s shares moved about nine percentage points from E and F to C and D, because momentum carries it out of the shallow outer minima.
<i>Basins of attraction</i> shows the same division on a designed sheet.

## Method

The window is u ∈ [−2, 2], v ∈ [−1.25, 1.25], with A = 1.8, H = 6 and η = 0.03.
All fifteen critical points lie inside it, although it is smaller than the usual window.
Minima are lettered by height: A and B global, C and D with f = −0.2155, E and F with f = 2.1043.
Saddles and maxima are marked with their value of f.
Races start at random points on high ground, one every 900 steps.
A particle retires when it comes to rest or after 1,600 steps.
The figure shows, for each optimizer, how its particles that came to rest divide among the minima, counted over all races since the plate opened.
The readouts give the counts.

## Caveat

The cap compresses high minima more than low ones.
The factor `AH/(H + f − f*)²` is 0.30 at A and B, 0.23 at C and D and 0.13 at E and F.
So E and F are flatter on this sheet, relative to A and B, than on f, and the barriers around them are lower in L.
This may let the heavy ball escape E and F more easily here than it would on f.

## At scale

Here the minima differ in height, so which one a run reaches decides its loss.
In networks, different starts usually reach different minima of nearly the same loss, and those minima are joined by paths along which the loss stays low (see <i>Mode connectivity</i>).
So the distribution of outcomes worth reporting there is mostly over the functions the runs compute, not over their losses.

## References

- Dixon, L. C. W. and Szegő, G. P. (1978). The global optimization problem: an introduction. In Towards Global Optimisation 2, 1–15. North-Holland.
  A standard collection of global-optimization test problems, the source usually cited for this function.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
  Gives the usual window [−3, 3] × [−2, 2] and the six minima, two of them global.

# The six-hump camel

## Subtitle

The start, not the optimizer, decides which minimum gradient descent, the heavy ball and Adam reach.

## Lead

The six-hump camel function, `f = (4 − 2.1u² + u⁴/3)u² + uv + (4v² − 4)v²`, is a standard test problem for global optimization, usually cited to Dixon and Szegő (1978).
It has six minima: two global ones with f = −1.0316, at ±(0.0898, −0.7126), and two pairs of local ones.

## In practice

Where a gradient method ends depends mostly on its start, so few starts say little.
Benchmark from many starts and report the distribution of outcomes.

## Try

1. Watch the figure → [[gradient descent|gd]], the [[heavy ball|hb]] and [[Adam|adam]] each bring 54% to 56% of particles to the global minima, A and B.
2. Click the saddle at the origin → every optimizer’s six particles split between A and B: the release point lies on the boundary of their [[basins|basin]].
3. Raise β to 0.99 → over 300 races, the heavy ball’s E and F share falls from 19% to 14%; its C and D share rises from 28% to 36%.
4. Compare gradient descent → its shares stay at 22% for E and F and 24% for C and D.

## Background

The function belongs to the small test problems used since the 1970s to compare methods that must find the lowest of several minima.
On its usual window, u ∈ [−3, 3] and v ∈ [−2, 2], it has 15 [[critical points|crit]]: six minima, seven [[saddles|saddle]] and two maxima.
It is symmetric under `(u, v) → (−u, −v)`, so every feature has a twin through the origin, and the saddle at the origin separates the two global minima.

For a method that follows the gradient, the outcome is set by the [[basins of attraction|basin]] of [[gradient flow|gflow]].
On this sheet gradient descent reproduces them: it divided its particles among the three pairs of minima in the same proportions as gradient flow from the same 300 starts.
Momentum and Adam change the paths, and near basin boundaries they can end elsewhere.
In 300 measured races the heavy ball’s most common minimum differed from gradient descent’s in 4% of races and Adam’s in 5%.
No optimizer’s share of a pair differed from gradient descent’s by more than four percentage points.
<i>Basins of attraction</i> shows the same division on a designed sheet.

## Method

The window is u ∈ [−2, 2], v ∈ [−1.25, 1.25], with A = 1.8, H = 6 and η = 0.03; all fifteen critical points lie inside it.
Minima are lettered by height: A and B global, C and D with f = −0.2155, E and F with f = 2.1043.
Saddles and maxima are marked with their value of f.
Races start at random points on high ground, one every 900 steps.
A particle retires when it comes to rest or after 1,600 steps.
The figure shows, for each optimizer, how its particles that came to rest divide among the minima, counted over all races since the plate opened; the readouts give the counts.

## Caveat

The cap compresses high minima more than low ones.
The factor `AH/(H + f − f*)²` is 0.30 at A and B, 0.23 at C and D and 0.13 at E and F.
E and F are therefore flatter on this sheet, relative to A and B, than on f, and the barriers around them are lower in L.

## References

- Dixon, L. C. W. and Szegő, G. P. (1978). The global optimization problem: an introduction. In Towards Global Optimisation 2, 1–15. North-Holland.
  A standard collection of global-optimization test problems, the source usually cited for this function.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
  Gives the usual window [−3, 3] × [−2, 2] and the six minima, two of them global.

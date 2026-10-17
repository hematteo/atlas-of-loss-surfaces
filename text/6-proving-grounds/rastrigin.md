# Rastrigin’s egg crate

## Subtitle

The sheet shows 77 of the minima; gradient methods stop in their starting cell, and noisy SGD hops between cells.

## Lead

Rastrigin’s function, `f = 10n + Σᵢ (uᵢ² − 10 cos 2πuᵢ)`, here with n = 2, is a bowl covered by a lattice of local minima, one near every integer point.
Its global minimum is f(0, 0) = 0.
Rastrigin (1974) proposed the two-dimensional case; the n-dimensional form became a standard test for evolutionary algorithms (Mühlenbein et al. 1991).

## In practice

At ordinary step sizes, gradient methods stay in their starting cell; escape needs noise, restarts or a population.
Practical annealing cools too fast for its guarantee.

## Try

1. Leave σ at 6 → [[SGD|sgd]] particles hop between neighbouring cells: in 150 measured races, two thirds ended outside their start cell, but only 5 of 900 in the central cell.
2. Raise σ to 8 → about 5% end in the central cell and a fifth pass through it, while a fifth leave the sheet; at σ = 10, two thirds leave.
3. Raise β to 0.99 → the [[heavy ball|hb]] crosses ridges too, ending in another cell one time in three.

## Background

Each cell is a [[basin of attraction|basin]] of [[gradient flow|gflow]].
The ridge between the cell at integer coordinate n and its neighbours is 20 ± n high in f, while the bowl rises by only 2n + 1 from one cell to the next one out.
So the gradient points to the bottom of the current cell almost everywhere, and [[gradient descent|gd]], the [[heavy ball|hb]] and [[Adam|adam]] at their default settings stop in the cell where they start.
The function is used to test global methods, such as the genetic algorithms of Mühlenbein et al. (1991), and methods that cross barriers by noise.

SGD with Gaussian gradient noise is a discretized [[Langevin process|langevin]] at temperature `T = ησ²/2` (see <i>Noise as temperature</i>).
Its [[stationary distribution|stationary]] is proportional to `exp(−L/T)`.
Temperatures high enough to cross ridges within a few thousand steps also spread that distribution over many cells.
On this sheet it puts 13% of its mass in the central cell at σ = 6 and 7% at σ = 8.
[[Simulated annealing|anneal]] (Kirkpatrick et al. 1983) lowers T during the run.
Hajek (1988) proved that with the schedule `T = c/log t` it converges in probability to the global minima if and only if c is at least the depth of the deepest non-global well.
A schedule that slow does not fit in a 2,400-step race.

## Method

The window is u ∈ [−5.12, 5.12], the usual range, and v ∈ [−3.2, 3.2], with A = 6 and H = 200, so L/f falls only from 0.030 at the bottom to 0.023 at the highest point.
The sheet has 273 [[critical points|crit]]: 77 minima, 136 saddles and 60 maxima.
Because of the cap, λ<sub>max</sub> at the minima falls from 122 at the centre to 89 in the corners. η = 0.004.
Gradient descent, the heavy ball and Adam use the exact gradient.
SGD uses `∇L + σξ`, `ξ ~ N(0, I)`, is never counted as at rest and runs for 2,400 steps; at the default σ = 6 its temperature is `T = ησ²/2 = 0.072`.
Races start at random points on high ground, one every 2,500 steps.
The figure plots log₁₀(L − L*) against step, averaged over each optimizer’s particles still moving; the readouts give the lowest L − L* each reached in the latest race.

## Caveat

Particles that leave the window are removed.
The window is narrower in v than the usual ±5.12, and the cap weakens the bowl’s pull near the edges by up to 44%.
So at large σ more SGD particles are lost here than would be on f over the usual square.

## References

- Rastrigin, L. A. (1974). Systems of Extremal Control. Nauka, Moscow.
  Proposes the function in two dimensions.
- Mühlenbein, H., Schomisch, M. and Born, J. (1991). The parallel genetic algorithm as function optimizer. Parallel Computing 17(6–7).
  Uses the n-dimensional form as a benchmark for a parallel genetic algorithm.
- Kirkpatrick, S., Gelatt, C. D. and Vecchi, M. P. (1983). Optimization by simulated annealing. Science 220(4598).
  Simulated annealing: a noisy search whose temperature is lowered during the run.
- Hajek, B. (1988). Cooling schedules for optimal annealing. Mathematics of Operations Research 13(2).
  With T = c/log t, annealing finds the global minima in probability if and only if c is at least the depth of the deepest non-global well.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
  Definitions, usual domains and minima of the standard test functions.

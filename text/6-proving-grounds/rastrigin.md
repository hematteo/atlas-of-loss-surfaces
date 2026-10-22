# Rastrigin’s egg crate

## Subtitle

A bowl tiled with minima, 77 on the sheet, to ask whether noise lets SGD leave the cell where gradient methods stay.

## Lead

Rastrigin’s function is a bowl covered by a lattice of local minima, one near every integer point.
Each minimum sits in its own cell, walled off by ridges.
In symbols, `f = 10n + Σᵢ (uᵢ² − 10 cos 2πuᵢ)`, here with n = 2.
The uᵢ² terms make the bowl and the cosines make the cells.

Rastrigin (1974) proposed the two-dimensional case.
The n-dimensional form became a standard test for evolutionary algorithms (Mühlenbein et al. 1991).

The global minimum is f(0, 0) = 0.
This plate tests which methods can reach it when every cell on the way is a trap.

## In practice

At ordinary step sizes, gradient methods stay in the cell where they start.
Escaping takes noise, restarts or a population of searchers.
The [[simulated annealing|anneal]] schedules used in practice cool too fast for the method’s convergence guarantee to hold.
So their results carry no promise of reaching the global minimum.

## Try

1. Leave the gradient noise σ at 6 → [[SGD|sgd]] particles hop between neighbouring cells.
   In 150 measured races, two thirds ended outside the cell they started in, but only 10 of 900 ended in the central cell.
   Noise strong enough to cross ridges also spreads particles over many cells.
2. Raise σ to 8 → about 4% end in the central cell and a quarter pass through it, but 30% leave the sheet.
   At σ = 10, nearly three quarters leave.
   More noise crosses more ridges, but also carries more particles over the edge.
3. Raise the momentum β to 0.99 → the [[heavy ball|hb]] crosses ridges too, and ends in another cell one time in three.
   Speed from one descent carries it over the next ridge.

## Background

Each cell is a [[basin of attraction|basin]] of [[gradient flow|gflow]].
The ridges around the cell at integer coordinate k are 20 ± k high in f.
From one cell to the next one out, the bowl rises by only 2k + 1.
Say k = 3: the ridges are about 20 high, but the next cell out is only 7 higher.

So the gradient points to the bottom of the current cell almost everywhere.
At their default settings, [[gradient descent|gd]], the [[heavy ball|hb]] and [[Adam|adam]] stop in the cell where they start.
The function is used to test global methods, such as the genetic algorithms of Mühlenbein et al. (1991), and methods that cross barriers by noise.

Noise helps, but at a price.
SGD with Gaussian gradient noise is a discretized [[Langevin process|langevin]] at temperature `T = ησ²/2` (see <i>Noise as temperature</i>).
Its [[stationary distribution|stationary]] describes where its particles would settle if the race ran forever.
This distribution is proportional to `exp(−L/T)`.

Temperatures high enough to cross ridges within a few thousand steps also spread that distribution over many cells.
On this sheet it puts 13% of its mass in the central cell at σ = 6 and 7% at σ = 8.

[[Simulated annealing|anneal]] (Kirkpatrick et al. 1983) starts hot, to cross ridges, and lowers T during the run, to settle.
Hajek (1988) proved a convergence result for the schedule `T = c/log t`.
With it, annealing converges in probability to the global minima if and only if c is at least the depth of the deepest non-global well.
Such a T falls only as fast as log t grows, which is very slowly.
A schedule that slow does not fit in a 2,400-step race.

## Method

The window is u ∈ [−5.12, 5.12], the usual range, and v ∈ [−3.2, 3.2], with A = 6, H = 200 and η = 0.004.
The sheet has 273 [[critical points|crit]]: 77 minima, 136 saddles and 60 maxima.
The cap is gentle here: L/f falls only from 0.030 at the bottom to 0.023 at the highest point.
Because of the cap, λ<sub>max</sub> at the minima falls from 122 at the centre to 89 in the corners.

Gradient descent, the heavy ball and Adam use the exact gradient.
SGD uses `∇L + σξ`, with fresh Gaussian noise `ξ ~ N(0, I)` at every step.
It is never counted as at rest and runs for 2,400 steps.
At the default σ = 6 its temperature is `T = ησ²/2 = 0.072`.
Races start at random points of high loss, one every 2,500 steps.

The figure plots log₁₀(L − L*) against step, averaged over each optimizer’s particles still moving.
The readouts give the lowest L − L* each reached in the latest race.

## Caveat

Particles that leave the window are removed.
The window is narrower in v than the usual ±5.12, and the cap weakens the bowl’s pull near the edges by up to 44%.
So at large σ more SGD particles are lost here than would be on f over the usual square.

## At scale

In n dimensions the function is a sum of n one-dimensional terms, so its critical points are products of one-dimensional ones.
A critical point is a minimum only if every coordinate sits at a minimum.
A mix of minima and maxima makes it a saddle.
On the usual square each coordinate has 11 minima and 10 maxima, so there are 21ⁿ critical points.
Only 11ⁿ of them are minima, a fraction (11/21)ⁿ that is about 10⁻²⁸ at n = 100.

So almost every critical point is a saddle.
That is closer to what has been argued for network losses than this sheet is (see <i>Saddle points</i>).
In a spin-glass model of a network, Choromanska et al. (2015) found that the local minima crowd into a band of loss just above the global minimum.

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
- Choromanska, A., Henaff, M., Mathieu, M., Ben Arous, G. and LeCun, Y. (2015). The loss surfaces of multilayer networks. AISTATS.
  In a spin-glass model of a network, the lowest critical values form a band just above the global minimum.

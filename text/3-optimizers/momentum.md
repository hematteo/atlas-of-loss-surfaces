# Momentum

## Subtitle

Gradient descent, the heavy ball and Nesterov’s method start together near the rim of an elliptical crater.

## Lead

The [[heavy ball|hb]] adds a fraction β of its previous step to each gradient step.
On a quadratic with condition number [[κ|cond]], with η and β tuned to the extreme curvatures, it needs of order √κ steps where [[gradient descent|gd]] needs of order κ (Polyak 1964).

## In practice

The heavy ball’s √κ speed-up needs η and β tuned and is proved only for quadratics; Nesterov’s holds on smooth strongly convex losses.
With an untuned β or noisy gradients, momentum need not beat SGD.

## Figure caption

Log₁₀ of the mean loss above the crater floor for the latest cohort, by optimizer. A curve oscillates when its particles overshoot the floor and swing back.

## Try

1. Leave β at 0.9 → in the figure the heavy ball lags gradient descent: its underdamped directions shrink by √0.9 ≈ 0.95 per step, gradient descent’s slowest by 0.92.
2. Set β to 0.5, just below β* for λ<sub>min</sub> → the heavy ball reaches the floor in under half gradient descent’s steps: both shrink by about 0.75 per step.
3. Set β to 0.99 → the heavy ball keeps swinging across the [[Crater floor|@Crater floor]] after [[Nesterov’s method|nag]] has settled: its error shrinks by only √β ≈ 0.995 per step.

## Background

Polyak (1964) introduced the heavy ball, `v ← βv − η∇L`, `θ ← θ + v`.
On a quadratic each eigendirection of the [[Hessian|hessian]] evolves separately, as a damped oscillator.
For curvature λ the error is multiplied each step by a root of `z² − (1 + β − ηλ)z + β = 0`.
Above `β* = (1 − √(ηλ))²` the roots are complex, the iterate overshoots and swings back, and the error shrinks by √β per step.
At β* the direction is [[critically damped|critdamp]] and shrinks by `1 − √(ηλ)`, the fastest rate at that η (Qian 1999).
Take `η = 4/(√λ_max + √λ_min)²` and `β = ((√κ − 1)/(√κ + 1))²`.
Then every direction shrinks by `(√κ − 1)/(√κ + 1)` per step, against `(κ − 1)/(κ + 1)` for gradient descent at its best η.
Goh (2017) works through this analysis.

Nesterov (1983) evaluates the gradient at the look-ahead point θ + βv.
Sutskever et al. (2013) wrote it in this form and showed that momentum, with a good initialization, trains deep and recurrent networks as well as Hessian-free optimization had.
Nesterov’s oscillating directions shrink by `√(β(1 − ηλ))` per step, so its damping grows with the curvature.

On a one-dimensional strongly convex function with condition number 25, the heavy ball with Polyak’s parameters falls into a limit cycle from some starting points (Lessard, Recht and Packard 2016).
With stochastic gradients neither method need improve on SGD (Kidambi et al. 2018).

## Method

The crater is an anisotropic Gaussian well on a gentle bowl, ringed by six low hills.
The [[Crater floor|@Crater floor]] is labelled with its two Hessian eigenvalues (8.3 and 22.5 on this seed, so κ = 2.7 and the crater is well conditioned).
There is no gradient noise, so each [[cohort|cohort]] moves almost as one.
Cohorts start on an ellipse about 0.4 from the floor, outside the region where the well is quadratic. η = 0.01.
The readouts give `β* = (1 − √(ηλ))²` for each eigenvalue, κ = λ<sub>max</sub>/λ<sub>min</sub>, and Polyak’s β for that κ.
That β is optimal only together with Polyak’s η, `4/(√λ_max + √λ_min)²` ≈ 0.07 here; at the sheet’s η the fastest β is close to β* for λ<sub>min</sub>.
The figure plots log₁₀ of the cohort’s mean `L − L*` against steps since release.

## References

- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5).
  Introduces the heavy-ball method and its optimal η and β on a quadratic.
- Nesterov, Y. (1983). A method for solving the convex programming problem with convergence rate O(1/k²). Soviet Mathematics Doklady 27.
  The accelerated gradient method, with the gradient taken at a look-ahead point.
- Qian, N. (1999). On the momentum term in gradient descent learning algorithms. Neural Networks 12(1).
  Near a minimum, momentum descent is a set of damped oscillators; momentum helps by bringing directions closer to critical damping.
- Sutskever, I., Martens, J., Dahl, G. and Hinton, G. (2013). On the importance of initialization and momentum in deep learning. ICML.
  Writes Nesterov’s method in the momentum form used here, and shows momentum is needed to train deep and recurrent networks with first-order methods.
- Goh, G. (2017). Why momentum really works. Distill.
  An interactive analysis of momentum on quadratics: critical damping, the optimal β and the √κ rate.
- Lessard, L., Recht, B. and Packard, A. (2016). Analysis and design of optimization algorithms via integral quadratic constraints. SIAM Journal on Optimization 26(1), 57–95.
  A one-dimensional strongly convex function with κ = 25 on which the heavy ball with Polyak’s parameters (α = 1/9, β = 4/9) settles into a period-3 cycle instead of converging.
- Kidambi, R., Netrapalli, P., Jain, P. and Kakade, S. M. (2018). On the insufficiency of existing momentum schemes for stochastic optimization. ICLR.
  With stochastic gradients, the heavy ball and Nesterov’s method can fail to improve on SGD.

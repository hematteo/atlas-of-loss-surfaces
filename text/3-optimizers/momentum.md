# Momentum

## Subtitle

Gradient descent, the heavy ball and Nesterov’s method start together near the rim of an elliptical crater, to ask when momentum speeds up the descent.

## Lead

The [[heavy ball|hb]] adds a fraction β of its previous step to each gradient step.
So when successive steps point the same way, they build up.

Take a quadratic with condition number [[κ|cond]], the ratio of its largest to its smallest curvature.
With the [[learning rate|lr]] η and β tuned to those two curvatures, the heavy ball needs of order √κ steps.
[[Gradient descent|gd]] needs of order κ (Polyak 1964).
On this plate we can see how much of that speed-up depends on choosing β well.
Polyak’s tuned η for this crater, about 0.07, lies above the slider’s range, so the Try steps hold η at 0.01 and vary β.
At that η, part of the heavy ball’s gain is simply its longer effective step, η/(1 − β).

## In practice

The heavy ball’s √κ speed-up is proved only for quadratics.
Goujaud, Taylor and Dieuleveut (2025) showed that no choice of η and β that accelerates it on quadratics also converges on every smooth strongly convex loss.
[[Nesterov’s method|nag]] keeps its √κ rate on all smooth strongly convex losses (Nesterov 2004).
With an untuned β, or with noisy gradients (Kidambi et al. 2018), momentum need not beat [[SGD|sgd]].

## Figure caption

Log₁₀ of the mean loss above the crater floor for the latest cohort, by optimizer.
On this log scale, a straight falling stretch means the loss shrinks by a fixed factor per step.
A curve oscillates when its particles overshoot the floor and swing back.

## Try

1. Leave β at 0.9 → in the figure the heavy ball lags gradient descent.
   Its underdamped directions shrink by √0.9 ≈ 0.95 per step, while gradient descent’s slowest shrinks by 0.92.
   Above β*, every direction shrinks by √β, so too much momentum slows them all alike.
2. Set β to 0.5, just below the readout β* for λ<sub>min</sub> → the heavy ball reaches the floor in under half gradient descent’s steps.
   β* is the β that [[critically damps|critdamp]] the floor’s shallower direction.
   That direction now shrinks by about 0.75 per step, against gradient descent’s 0.92.
3. Set β to 0.99 → the heavy ball keeps swinging across the [[Crater floor|@Crater floor]] after [[Nesterov’s method|nag]] has settled.
   The heavy ball’s error shrinks by only √β ≈ 0.995 per step.
   Nesterov’s rate, given in the Background, is below √β in every direction.

## Background

As an update, Polyak’s heavy ball is `v ← βv − η∇L`, `θ ← θ + v`.
On a quadratic each eigendirection of the [[Hessian|hessian]] evolves separately, as a damped oscillator.
For curvature λ the error is multiplied each step by a root of `z² − (1 + β − ηλ)z + β = 0`.

The two roots multiply to β.
When they are complex they are equal in size, so each has size √β.
The roots are complex above `β* = (1 − √(ηλ))²`, and there the iterate overshoots and swings back.
At β* the direction is [[critically damped|critdamp]] and shrinks by `1 − √(ηλ)`, the fastest rate at that η (Qian 1999).

Polyak’s tuning sets `η = 4/(√λ_max + √λ_min)²` and `β = ((√κ − 1)/(√κ + 1))²`.
Then every direction shrinks by `(√κ − 1)/(√κ + 1)` per step, against `(κ − 1)/(κ + 1)` for gradient descent at its best η.
Goh (2017) works through this analysis.

Nesterov (1983) evaluates the gradient at the look-ahead point θ + βv, where the momentum alone would carry the iterate.
His method’s oscillating directions shrink by `√(β(1 − ηλ))` per step, so its damping grows with the curvature.
Intuitively, the look-ahead gradient already sees part of the coming overshoot and pushes back early.
Sutskever et al. (2013) wrote the method in this look-ahead form.
They showed that momentum, with a good initialization, trains deep and recurrent networks as well as Hessian-free optimization had.

Outside quadratics these guarantees weaken.
Lessard, Recht and Packard (2016) gave a one-dimensional strongly convex function with condition number 25.
From some starting points, the heavy ball with Polyak’s parameters falls into a limit cycle on it.

## Method

The crater is an anisotropic Gaussian well on a gentle bowl, ringed by six low hills.
The [[Crater floor|@Crater floor]] is labelled with its two Hessian eigenvalues, 8.3 and 22.5 on this seed.
So κ = 2.7, and the crater is well conditioned.

There is no gradient noise, so each [[cohort|cohort]] moves almost as one.
Cohorts start on an ellipse about 0.4 from the floor, outside the region where the well is quadratic.
The learning rate is η = 0.01, and the figure counts time in steps since release.

The readouts give β* for each eigenvalue, κ, and Polyak’s β for that κ.
That β is optimal only together with Polyak’s η, about 0.07 here.
At the sheet’s η the fastest β is close to β* for λ<sub>min</sub>.
β* falls as the curvature rises, so at that β the steeper direction is already underdamped and shrinks just as fast.

## Limits

The √κ picture is for exact gradients.
High-dimensional random least-squares problems serve as a model of training with many parameters.
On them, Paquette and Paquette (2021) showed that small-batch heavy ball with a fixed β is no faster than SGD with a suitably rescaled step.

Long momentum averages can still help language models.
AdEMAMix (Pagliardini, Ablin and Grangier 2025) adds a second, much slower average of the gradient to [[Adam|adam]].
A 1.3B-parameter model trained with it on 101B tokens matched one trained with AdamW on 197B.
So at scale, momentum may matter less as an accelerator than as a long average of past gradients.

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
- Nesterov, Y. (2004). Introductory lectures on convex optimization: a basic course. Kluwer.
  Includes the accelerated method’s √κ rate on smooth strongly convex functions.
- Paquette, C. and Paquette, E. (2021). Dynamics of stochastic momentum methods on large-scale, quadratic models. NeurIPS.
  On high-dimensional least squares, small-batch heavy ball gives no speed-up over SGD with its step rescaled.
- Goujaud, B., Taylor, A. and Dieuleveut, A. (2025). Provable non-accelerations of the heavy-ball method. Mathematical Programming.
  For every η and β, the heavy ball either is not accelerated on quadratics or fails to converge on some smooth strongly convex function.
- Pagliardini, M., Ablin, P. and Grangier, D. (2025). The AdEMAMix optimizer: better, faster, older. ICLR.
  Adds a slow second momentum average to Adam; gradients stay useful for tens of thousands of steps in language-model training.

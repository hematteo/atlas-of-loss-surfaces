# The road to infinity

## Subtitle

Gradient descent, normalized descent and sign descent head for infinity along two roads, the ℓ₂ and ℓ∞ max-margin directions.

## Lead

On linearly separable data the logistic loss has no minimum: it keeps falling as the weights grow along any separating direction.
Gradient descent still converges in direction, to the ℓ₂ [[maximum-margin separator|maxmargin]], at rate 1/log t (Soudry et al. 2018).
Steepest descent for another norm maximizes the margin in that norm (Gunasekar et al. 2018).

## In practice

On separable data, near-zero training loss does not fix the classifier: the optimizer’s geometry picks the margin, and gradient descent’s direction keeps changing, converging at rate 1/log t.

## Figure caption

The direction of each optimizer’s weights in the latest race against log steps. Dashed: the ℓ₂ and ℓ∞ max-margin directions of the data.

## Try

1. Watch the first race, from the [[Origin|@Origin]] → normalized descent comes within about 2.5° of the ℓ₂ road (88.7°) by step 300 and within 0.1° by step 6,000.
2. Follow gradient descent → it remains 9 to 13° short after 6,000 steps: ‖w‖ grows only like log t, to about 9.5, and the angle shrinks like 1/log t.
3. Follow sign descent → it first turns towards the ℓ₂ road, to 70 to 78° at step 100, then heads for the ℓ∞ road (45°), reaching 47° by step 1,000.
4. Click elsewhere to start a race → the roads do not move.

## Background

Soudry et al. (2018) studied linearly separable data and losses with an exponential tail, such as the logistic loss.
They proved that gradient descent with a small enough fixed step drives ‖w‖ to infinity like log t, and that its direction converges to the ℓ₂ maximum-margin separator, the hard-margin support vector machine.
Nothing in the loss or the algorithm mentions margins, so this is an [[implicit bias|implicit]].
The convergence is slow: the angle to the separator shrinks like 1/log t.
Nacson et al. (2019) showed that 1/log t is the best rate a fixed step size achieves.
They also showed that normalized gradient descent with step length `1/√(t+1)` brings the margin to its maximum at rate `log t/√t`.

Gunasekar et al. (2018) showed that the bias comes from the geometry of the update.
Sign descent is steepest descent for ℓ∞, so it heads for the ℓ∞ maximum-margin direction, which can differ from the ℓ₂ one.
Lyu and Li (2020) extended margin maximization to homogeneous neural networks.
Under gradient flow or gradient descent with the logistic loss, the direction of the parameters converges to a KKT point of a margin-maximization problem.

## Method

The data are fourteen points `zₙ = yₙxₙ` in two dimensions, separable through the origin.
The loss is the mean logistic loss `L(w) = mean log(1 + exp(−⟨w, zₙ⟩))`.
Particles step in weight space with exact gradients: gradient descent with η = 1, below `2/β` for the smoothness bound β = 0.47; normalized descent `w ← w − 0.2∇L/‖∇L‖₂`; sign descent `w ← w − 0.2 sign(∇L)`.
The sheet is an azimuthal projection of weight space: directions are true and a point at ‖w‖ = r lies at radius proportional to `log(1 + 2r)`, so rings at ‖w‖ = 1, 10, 100 and 1,000 fit.
The relief is a saturating function of `log L(w)` minus the lowest log L on the circle of the same radius, so the valley floor is the best direction at each distance.
The roads come from scanning 72,000 directions for the largest ℓ₂ margin (88.7°, 0.663) and the largest ℓ∞ margin (45.0°, 0.678).
The figure plots each optimizer’s mean direction against log₁₀ steps.

## Caveat

Normalized and sign descent here take steps of constant length 0.2.
The theorems cover particular step-size schedules, such as length `1/√(t+1)` in Nacson et al.
The sheet therefore shows that the constant-length versions reach the same directions on these data; it does not prove that they always do.

## References

- Soudry, D., Hoffer, E., Nacson, M. S., Gunasekar, S. and Srebro, N. (2018). The implicit bias of gradient descent on separable data. JMLR 19.
  Gradient descent on separable data converges in direction to the ℓ₂ max-margin separator, at rate 1/log t.
- Gunasekar, S., Lee, J., Soudry, D. and Srebro, N. (2018). Characterizing implicit bias in terms of optimization geometry. ICML.
  Steepest descent with respect to a norm maximizes the margin in that norm.
- Nacson, M. S., Lee, J., Gunasekar, S., Savarese, P., Srebro, N. and Soudry, D. (2019). Convergence of gradient descent on separable data. AISTATS.
  1/log t is optimal for fixed steps; normalized steps give log t/√t.
- Lyu, K. and Li, J. (2020). Gradient descent maximizes the margin of homogeneous neural networks. ICLR.
  Extends margin maximization to homogeneous networks.

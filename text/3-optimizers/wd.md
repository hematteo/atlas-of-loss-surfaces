# Weight decay and scale invariance

## Subtitle

SGD with and without weight decay, and AdamW, on a loss that depends only on the bearing of θ.

## Lead

Behind a normalization layer the loss is [[scale-invariant|scaleinv]], `L(cθ) = L(θ)`.
Gradient steps then lengthen θ, lowering the [[effective learning rate|efflr]] η/‖θ‖².
Weight decay holds ‖θ‖ at an equilibrium where θ turns by about √(2ηλ) per step (van Laarhoven 2017; Wan et al. 2021; Kosson, Messmer and Jaggi 2024).
This approximation matches trained networks.

## In practice

For weights behind a normalization layer, weight decay does not shrink the function.
It sets the effective learning rate, and at equilibrium the product ηλ, not η or λ alone, sets how fast the weights turn.

## Figure caption

Above: mean ‖θ‖ of one cohort, followed through its run, by optimizer, with the predicted equilibria dashed. Below: the angle θ turns per step (root mean square), with √(2ηλ) for SGD with weight decay and √(2ηλ(1 − β₁)/(1 + β₁)) for AdamW dashed.

## Try

1. Let the first cohort finish → SGD with weight decay holds ‖θ‖ ≈ 0.60 (predicted 0.595), turning √(2ηλ) = 0.0283 rad per step; SGD without decay grows past 1.
2. Raise σ to 4 → the violet circle and SGD’s norm move out to about 0.75, AdamW’s stays near 0.8: Adam divides out the noise.
3. Set σ to 0.3 → SGD with weight decay settles at 0.23, above the predicted 0.21.
4. Set σ to 0 → SGD with decay shrinks to the ticks and AdamW to about 0.2: without noise, θ lengthens only when particles bounce, at f″/‖θ‖² = 2/η.

## Background

For a scale-invariant loss, `∇L(cθ) = ∇L(θ)/c` and the gradient is perpendicular to θ.
A gradient step can therefore only lengthen θ, and the angle it turns θ through scales as `η/‖θ‖²`.
Van Laarhoven (2017) concluded that L2 regularization of such weights does not regularize but sets this effective learning rate, and Zhang et al. (2019) identified the same mechanism in trained networks.
Without weight decay ‖θ‖ grows and the effective learning rate decays by itself; Arora, Li and Lyu (2019) proved that scale-invariant weights then converge without tuning η.
Li and Arora (2020) showed that weight decay on such weights is equivalent to an exponentially growing learning rate.
Li, Lyu and Arora (2020) conjectured that SGD reaches equilibrium in about 1/(ηλ) steps, with the intrinsic learning rate ηλ as the only parameter.

At equilibrium the growth from gradient steps balances the decay.
For SGD this gives `‖θ‖⁴ = ηE‖g̃‖²/2λ`, with g̃ measured at unit norm, and an [[angular update|angupd]] of `√(2ηλ)` per step, or `√(2ηλ/(1 + β))` with momentum β (Wan et al. 2021).
For AdamW (Loshchilov and Hutter 2019), Kosson, Messmer and Jaggi (2024) derived `‖θ‖ = √(ηC/2λ)` for C coordinates and `√(2ηλ(1 − β₁)/(1 + β₁))` per step, assuming updates dominated by noise.
Without noise, decay shrinks θ until gradient descent reaches the [[edge of stability|eos]]; Lyu, Li and Arora (2022) analysed this regime in normalized networks and showed that it then reduces sharpness.

## Method

The loss is `f(φ)`, with φ the bearing of θ: three von Mises valleys, each labelled with its curvature f″.
It is exactly scale-invariant outside a disc of radius 0.06 at the origin, where the bearing is undefined.
Gradient noise is perpendicular to θ with standard deviation σ/‖θ‖, as in a scale-invariant network.
Both SGD ensembles use η = 0.004; AdamW uses η = 0.016, β₁ = 0.9, β₂ = 0.999, and its λ is scaled so that all three share the ηλ set by the control.
The dashed circles are the predicted equilibria, `(ησ²/2λ)^¼` for SGD with decay and `√(ηC/2λ)` with C = 2 for AdamW.
The ticks mark `‖θ‖ = √(ηf″/2)`, where f″/‖θ‖² = 2/η.
The figure follows one cohort for 6000 steps; the readouts average its ‖θ‖ and its root-mean-square angle per step over ages from 2500 on (4000 for SGD without decay).

## Caveat

The predictions assume that noise dominates the gradient.
That fails near the edge of stability, and at σ = 0 the AdamW circle does not apply either.
With only two coordinates, AdamW’s angle per step is 10–15% below its prediction, which assumes updates perpendicular to θ on average.

## References

- van Laarhoven, T. (2017). L2 regularization versus batch and weight normalization. arXiv:1706.05350.
  With normalization, L2 regularization does not regularize; it sets the effective learning rate η/‖θ‖².
- Arora, S., Li, Z. and Lyu, K. (2019). Theoretical analysis of auto rate-tuning by batch normalization. ICLR.
  Scale-invariant weights converge without tuning their learning rate, because ‖θ‖ adapts.
- Zhang, G., Wang, C., Xu, B. and Grosse, R. (2019). Three mechanisms of weight decay regularization. ICLR.
  In normalized networks, weight decay works mainly by raising the effective learning rate.
- Loshchilov, I. and Hutter, F. (2019). Decoupled weight decay regularization. ICLR.
  AdamW: weight decay applied to θ directly, not through Adam’s preconditioner.
- Li, Z. and Arora, S. (2020). An exponential learning rate schedule for deep learning. ICLR.
  For scale-invariant weights, weight decay is equivalent to an exponentially growing learning rate.
- Li, Z., Lyu, K. and Arora, S. (2020). Reconciling modern deep learning with traditional optimization analyses: the intrinsic learning rate. NeurIPS.
  The equilibrium depends on ηλ alone; conjectures it is reached in about 1/(ηλ) steps.
- Wan, R., Zhu, Z., Zhang, X. and Sun, J. (2021). Spherical motion dynamics: learning dynamics of normalized neural network using SGD and weight decay. NeurIPS.
  Proves convergence to the equilibrium under assumptions; angular update √(2ηλ/(1 + β)).
- Lyu, K., Li, Z. and Arora, S. (2022). Understanding the generalization benefit of normalization layers: sharpness reduction. NeurIPS.
  Gradient descent with weight decay on normalized networks reaches the edge of stability and then reduces sharpness.
- Kosson, A., Messmer, B. and Jaggi, M. (2024). Rotational equilibrium: how weight decay balances learning across neural networks. ICML.
  Equilibrium norms and angular updates for SGD with momentum, AdamW and Lion.

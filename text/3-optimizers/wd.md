# Weight decay and scale invariance

## Subtitle

SGD with and without weight decay, and [[AdamW|adamw]], on a loss that depends only on the direction of θ, to ask what decay is for there.

## Lead

Behind a normalization layer, scaling the weights leaves the output unchanged.
So the loss is [[scale-invariant|scaleinv]], `L(cθ) = L(θ)`.

For such a loss, gradient steps lengthen θ.
A longer θ turns less for the same step, which lowers the [[effective learning rate|efflr]] η/‖θ‖².
Weight decay with coefficient λ pulls the other way and holds ‖θ‖ at an equilibrium.

There θ turns by about √(2ηλ) per step, or √(2ηλ/(1 + β)) with momentum β (van Laarhoven 2017; Wan et al. 2021; Kosson, Messmer and Jaggi 2024).
Measured angular updates in trained networks match this approximation (Wan et al. 2021; Kosson, Messmer and Jaggi 2024).
On this plate we can watch the norm settle and check the turning rate against that prediction.

## In practice

For weights behind a normalization layer, weight decay does not shrink the function.
It sets the effective learning rate, and at equilibrium the product ηλ, not η or λ alone, sets how fast the weights turn.
So for such weights, raising η and lowering λ by the same factor leaves their turning rate unchanged.

## Figure caption

Above: mean ‖θ‖ of one cohort, followed through its run, by optimizer, with the predicted equilibria dashed.
Below: the angle θ turns per step (root mean square), with √(2ηλ) for SGD with weight decay and √(2ηλ(1 − β₁)/(1 + β₁)) for AdamW dashed.
A curve that flattens onto its dashed line has reached its equilibrium.

## Try

1. Let the first cohort finish → SGD with weight decay holds ‖θ‖ ≈ 0.60, against a predicted 0.595.
   It turns θ by √(2ηλ) = 0.0283 rad per step.
   Without decay, SGD’s norm grows just past 1 by the end of its run.
2. Raise the noise σ to 4 → the violet circle and SGD’s norm move out to about 0.75, while AdamW’s stays near 0.8.
   SGD’s equilibrium `(ησ²/2λ)^¼` grows with σ.
   AdamW’s `√(ηC/2λ)` does not contain σ at all, because Adam divides out the noise.
3. Set σ to 0.3 → SGD with weight decay settles at 0.23, above the predicted 0.21.
   The prediction assumes that noise dominates the gradient (see Limits).
4. Set σ to 0 → SGD with decay shrinks to the ticks and AdamW to about 0.2.
   Without noise, θ lengthens only when particles bounce.
   With f″ the valley’s labelled curvature, that happens at f″/‖θ‖² = 2/η.
   This is the [[edge of stability|eos]], reached by shrinking θ (see <i>The edge of stability</i>).

## Background

For a scale-invariant loss, `∇L(cθ) = ∇L(θ)/c`.
The gradient is also perpendicular to θ, since moving along θ does not change the loss.
So a gradient step can only lengthen θ, and the angle it turns θ through scales as `η/‖θ‖²`.

Van Laarhoven, and later Zhang et al. (2019) in trained networks, found that decay on such weights works by setting this effective learning rate.

Arora, Li and Lyu (2019) proved that without decay, scale-invariant weights converge without tuning η.
Li and Arora (2020) showed that weight decay on such weights is equivalent to an exponentially growing learning rate.
Li, Lyu and Arora (2020) conjectured that SGD reaches equilibrium in about 1/(ηλ) steps, with the intrinsic learning rate ηλ as the only parameter.

At equilibrium the growth from gradient steps balances the decay.
Each step, decay removes about 2ηλ‖θ‖² from ‖θ‖², while the gradient step adds η²‖g̃‖²/‖θ‖².
For SGD, setting the two equal gives `‖θ‖⁴ = ηE‖g̃‖²/2λ`, with g̃ measured at unit norm.
This gives the Lead’s [[angular update|angupd]] of `√(2ηλ)` per step.

Kosson, Messmer and Jaggi (2024) did the same for AdamW (Loshchilov and Hutter 2019), assuming updates dominated by noise.
With C coordinates, they derived `‖θ‖ = √(ηC/2λ)` and an angular update of `√(2ηλ(1 − β₁)/(1 + β₁))` per step.

Lyu, Li and Arora (2022) analysed the noise-free regime of Try 4 in normalized networks.
They showed that, once at the edge of stability, gradient descent reduces [[sharpness|sharpness]].

## Method

The loss is `f(φ)`, where φ is the angle of θ, its bearing on the map.
The function f has three von Mises valleys, each labelled with its curvature f″.
The loss is exactly scale-invariant outside a disc of radius 0.06 at the origin, where the angle is undefined.

Gradient noise is perpendicular to θ, with standard deviation σ/‖θ‖, as in a scale-invariant network.
So the noise falls as ‖θ‖ grows, just as the gradient does.

Both SGD ensembles use η = 0.004.
AdamW uses η = 0.016, β₁ = 0.9 and β₂ = 0.999.
Its λ is scaled so that both decayed optimizers share the ηλ set by the control.

The AdamW circle uses C = 2.
The SGD circle is the Background’s formula with E‖g̃‖² set to σ².
That substitution is where the assumption that noise dominates enters.
The ticks mark `‖θ‖ = √(ηf″/2)`.

The figure follows one cohort for 6000 steps.
The readouts average its ‖θ‖ and its root-mean-square angle per step over ages from 2500 on (4000 for SGD without decay).

## Limits

The assumption that noise dominates fails near the edge of stability, and at σ = 0 the AdamW circle does not apply either.
With only two coordinates, AdamW’s angle per step is 8–15% below its prediction, which assumes updates perpendicular to θ on average.
In a layer with millions of coordinates, a noisy update is almost perpendicular to θ, so this shortfall should shrink.

D’Angelo et al. (2024) studied language models trained for about one epoch.
In that regime, they found, weight decay helps less by regularizing than by changing the dynamics.
It lowers the training loss and makes training more stable.

Wang and Aitchison (2025) treat AdamW’s weights as an exponential average of its updates over about 1/(ηλ) steps.
The window has this length because each step multiplies the old weights by 1 − ηλ.
The best window stays at about the same number of epochs as models and datasets grow.
So λ should fall with more data and, under μP learning-rate scaling, rise with width.

Not every weight in a transformer sits behind a normalization.
The output layer and the normalization gains do not, and the equilibrium here does not describe them.

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
- D’Angelo, F., Andriushchenko, M., Varre, A. and Flammarion, N. (2024). Why do we need weight decay in modern deep learning? NeurIPS.
  Weight decay works through the training dynamics, not as an explicit regularizer; in near one-epoch language-model training it lowers the training loss and stabilizes training.
- Wang, X. and Aitchison, L. (2025). How to set AdamW’s weight decay as you scale model and dataset size. ICML.
  AdamW’s weights as an exponential average over about 1/(ηλ) steps; the best window in epochs stays about fixed as models and datasets grow.

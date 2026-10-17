# Adam, sign descent and the axes

## Subtitle

A narrow quadratic valley that can be turned against the parameter axes.

## Lead

[[Adam|adam]] divides each coordinate’s step by a running estimate of its gradient magnitude, so, unlike [[gradient descent|gd]], it depends on the axes’ orientation.
Why Adam outperforms SGD on transformers is open: explanations include its closeness to [[sign descent|signsgd]] (Kunstner et al. 2023) and an ℓ∞ geometry that rotation destroys (Xie, Mohamadi and Li 2025).

## In practice

Adam exploits the coordinate axes: after a random rotation of the loss it trained worse, while SGD, which is rotation-invariant, was unaffected (Xie, Mohamadi and Li 2025).
Retest it after reparametrizations that mix coordinates.

## Figure caption

Above: steps to come within 0.005 of the floor, by the angle of the basin; gradient descent is flat, Adam is fastest along an axis. Below: mean loss above the floor for the latest cohort; the sign methods level off.

## Try

1. Turn the basin to 45° → ‘Adam steps’ rises from 37 to 132, ‘GD steps’ stays about 145: a diagonal [[preconditioner|precond]] rescales the curvatures only along the axes.
2. Watch [[signSGD|signsgd]] → many particles stop partway down the valley and never come to rest: while the cross-valley gradient dominates both coordinates, each diagonal step goes straight across the floor.
3. Watch [[Lion|lion]] → its particles get further down the valley than signSGD’s: its momentum averages out the alternating cross-valley gradient.

## Background

Adam (Kingma and Ba 2015) keeps exponential averages of the gradient and of its elementwise square and steps by `η m̂/(√v̂ + ε)`.
It descends from RPROP (Riedmiller and Braun 1993), which used only the sign of each partial derivative, and from AdaGrad (Duchi, Hazan and Singer 2011).
With β₁ = β₂ = 0 and ε = 0 the step is `η sign(g)`, sign descent.
Balles and Hennig (2018) split Adam into the sign of the gradient and a magnitude set by its relative variance, so Adam approaches sign descent when the noise is small.
Sign descent is steepest descent in the ℓ∞ norm.
Balles, Pedregosa and Le Roux (2020) found it favourable when the Hessian is concentrated on its diagonal and its largest eigenvalue is much larger than the average.
Lion (Chen et al. 2023), found by program search, takes the sign of an interpolation between momentum and the current gradient.

All these methods are diagonal, so unlike gradient descent they change under a rotation of parameter space.
Kunstner et al. (2023) found that the gap between SGD and Adam on transformers persists with full batches, where Adam behaves like sign descent with momentum.
Zhang et al. (2024) related the gap to Hessian spectra that differ between parameter blocks.
Xie, Mohamadi and Li (2025) proved convergence under ℓ∞ smoothness and found that after a random rotation of the training loss, Adam can be outperformed by rotation-invariant variants of SGD.

## Method

The valley is an exact quadratic, `½(λ_u u² + λ_v v²)` with λ<sub>u</sub> = 1 and λ<sub>v</sub> = 200, in coordinates (u, v) turned by α against (θ₁, θ₂) and capped smoothly far from the floor.
A faint bowl and texture bring the floor’s eigenvalues to about 1.5 and 197. η = 0.009, so ηλ<sub>max</sub> ≈ 1.8 and gradient descent is stable.
Adam uses β₁ = 0.9, β₂ = 0.999, ε = 10⁻⁸; Lion uses β₁ = 0.9, β₂ = 0.99.
Gradient noise is σ = 0.005.
Cohorts start at u = ±0.4, v = ±0.04.
The step counts come from separate noise-free runs from that point, one for each α in steps of 7.5°: the number of steps until `L − L* < 0.005`.
The last readout, λ<sub>max</sub>η², sets the loss at which sign descent stops in an axis-aligned valley: it ends in a two-step cycle across the floor, with mean loss between λη²/8 and λη²/4.

## Caveat

In two dimensions a sign step can point only along the four diagonals, so the axes matter as much as they can.
At 45° every sign step goes either along the valley or straight across it.
In higher dimensions the effect is a matter of degree, which Balles, Pedregosa and Le Roux (2020) relate to how much of the Hessian lies on its diagonal.

## References

- Riedmiller, M. and Braun, H. (1993). A direct adaptive method for faster backpropagation learning: the RPROP algorithm. IEEE International Conference on Neural Networks.
  Steps by a per-weight size using only the sign of each partial derivative.
- Duchi, J., Hazan, E. and Singer, Y. (2011). Adaptive subgradient methods for online learning and stochastic optimization. JMLR 12.
  AdaGrad: per-coordinate step sizes from accumulated squared gradients.
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR.
  Introduces Adam.
- Bernstein, J., Wang, Y.-X., Azizzadenesheli, K. and Anandkumar, A. (2018). signSGD: compressed optimisation for non-convex problems. ICML.
  Convergence of sign-based SGD on non-convex problems, and one-bit gradient compression.
- Balles, L. and Hennig, P. (2018). Dissecting Adam: the sign, magnitude and variance of stochastic gradients. ICML.
  Splits Adam into a sign direction and a variance-adapted magnitude.
- Balles, L., Pedregosa, F. and Le Roux, N. (2020). The geometry of sign gradient descent. arXiv:2002.08056.
  Sign descent as ℓ∞ steepest descent; favourable when the Hessian is concentrated on its diagonal and λ<sub>max</sub> is far above the average eigenvalue.
- Kunstner, F., Chen, J., Lavington, J. W. and Schmidt, M. (2023). Noise is not the main factor behind the gap between SGD and Adam on transformers, but sign descent might be. ICLR.
  The SGD–Adam gap persists with full batches, where Adam behaves like sign descent with momentum.
- Chen, X., Liang, C., Huang, D., Real, E., Wang, K., Liu, Y., Pham, H., Dong, X., Luong, T., Hsieh, C.-J., Lu, Y. and Le, Q. V. (2023). Symbolic discovery of optimization algorithms. NeurIPS.
  Lion, found by program search: the sign of an interpolation of momentum and gradient.
- Zhang, Y., Chen, C., Ding, T., Li, Z., Sun, R. and Luo, Z.-Q. (2024). Why transformers need Adam: a Hessian perspective. NeurIPS.
  Relates the SGD–Adam gap to Hessian spectra that differ between parameter blocks.
- Xie, S., Mohamadi, M. A. and Li, Z. (2025). Adam exploits ℓ∞-geometry of loss landscape via coordinate-wise adaptivity. ICLR.
  Convergence under ℓ∞ smoothness; after a random rotation of the loss, Adam can lose to rotation-invariant SGD variants.

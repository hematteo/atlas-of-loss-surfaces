# Adam, sign descent and the axes

## Subtitle

A narrow quadratic valley that can be turned against the parameter axes, to ask how much Adam and sign descent rely on them.

## Lead

[[Adam|adam]] gives each coordinate its own step size.
It divides each coordinate’s step by a running root mean square of that coordinate’s gradient.

This per-coordinate scaling makes Adam depend on how the axes are oriented, unlike [[gradient descent|gd]].
If we rotate the loss, gradient descent’s path rotates with it, while Adam’s path changes.

Adam outperforms [[SGD|sgd]] on transformers, and why it does is an open question.
Proposed explanations include:

1. Its closeness to [[sign descent|signsgd]], which steps by the sign of each gradient coordinate (Kunstner et al. 2023).
2. An ℓ∞ geometry of the loss that rotation destroys (Xie, Mohamadi and Li 2025).

On this plate we can turn the valley against the axes and count what Adam loses.

## In practice

After a random rotation of the loss, Adam trained worse, while rotation-invariant SGD was unaffected (Xie, Mohamadi and Li 2025).
So retest Adam after any reparametrization that mixes coordinates.

## Figure caption

Above: steps to come within 0.005 of the floor, by the angle of the basin.
Gradient descent’s curve is flat, and Adam is fastest when the valley lies along an axis.
Below: mean loss above the floor for the latest cohort, on a log scale.
The sign methods level off, since a step of fixed size cannot settle onto the floor.

## Try

1. Turn the basin to 45° → ‘Adam steps’ rises from 37 to 132 while ‘GD steps’ stays about 145.
   Adam is a diagonal [[preconditioner|precond]], so it can rescale the curvature only along the axes.
   At 45° each coordinate mixes the steep and shallow directions, so no per-coordinate scale can separate them.
2. At 45°, watch [[signSGD|signsgd]] → its particles barely move down the valley and never come to rest.
   While the cross-valley gradient dominates both coordinates, each diagonal step goes straight across the floor.
3. Watch [[Lion|lion]] → its particles get further down the valley than signSGD’s.
   Lion’s momentum averages out the cross-valley gradient, which flips sign each time a particle crosses the floor.
   The small gradient along the valley keeps its sign, so it survives the average.

## Background

Adam (Kingma and Ba 2015) keeps exponential averages of the gradient and of its elementwise square, m̂ and v̂.
It then steps by `η m̂/(√v̂ + ε)`.
This update descends from RPROP (Riedmiller and Braun 1993), which used only the sign of each partial derivative.
The line runs through [[RMSprop|rmsprop]] (Tieleman and Hinton 2012), a minibatch form of RPROP that divides each gradient by a running root mean square.
Adam also descends from AdaGrad (Duchi, Hazan and Singer 2011).

With β₁ = β₂ = 0 there is no averaging, and with ε = 0 each coordinate of the gradient is divided by its own size.
The step is then `η sign(g)`, which is sign descent (Bernstein et al. 2018).
Balles and Hennig (2018) split Adam into the sign of the gradient and a magnitude set by its relative variance.
So when the noise is small, Adam approaches sign descent.

Sign descent is steepest descent in the ℓ∞ norm, and it moves every coordinate by the same amount.
Balles, Pedregosa and Le Roux (2020) found it favourable when the Hessian is concentrated on its diagonal and its largest eigenvalue is much larger than the average.
Lion (Chen et al. 2023), found by program search, takes the sign of an interpolation between momentum and the current gradient.

The Lead’s two explanations rest on these findings about the gap between SGD and Adam, and a third study adds another:

1. Kunstner et al. found that the gap persists with full batches, where Adam behaves like sign descent with momentum.
2. Xie, Mohamadi and Li proved convergence under ℓ∞ smoothness.
3. Zhang et al. (2024) related the gap to Hessian spectra that differ between parameter blocks.

## Method

The valley is an exact quadratic, `½(λ_u u² + λ_v v²)`, with λ<sub>u</sub> = 1 and λ<sub>v</sub> = 200.
So it curves 200 times more steeply across than along.
Its coordinates (u, v) are turned by α against (θ₁, θ₂), and it is capped smoothly far from the floor.
A faint bowl and texture bring the floor’s eigenvalues to about 1.5 and 197.

The learning rate is η = 0.009, so ηλ<sub>max</sub> ≈ 1.8 and gradient descent is [[stable|stab]].
Adam uses β₁ = 0.9, β₂ = 0.999 and ε = 10⁻⁸.
Lion uses β₁ = 0.9 and β₂ = 0.99.
Gradient noise is σ = 0.005.

Cohorts start at u = ±0.4, v = ±0.04.
The step counts come from separate noise-free runs from that point, one for each α in steps of 7.5°.

The last readout, λ<sub>max</sub>η², sets the loss at which sign descent stops in an axis-aligned valley.
There it ends in a two-step cycle across the floor, with mean loss between λη²/8 and λη²/4.
Each sign step moves the steep coordinate by η, so the cycle alternates between two points η apart.
When those points straddle the floor evenly, the mean loss is λη²/8.

## Limits

In two dimensions a sign step can point only along the four diagonals, so the axes matter as much as they can.
In higher dimensions the effect is a matter of degree, tied to how much of the Hessian lies on its diagonal (see the Background).

Studies of real networks point to other causes of the gap between SGD and Adam as well.
In language models, Kunstner et al. (2024) traced much of the gap to heavy-tailed class imbalance.
Gradient descent makes slow progress on the many rare tokens, while Adam and sign descent do not.
Zhao et al. (2025) found that Adam, Lion and signed momentum train language models about equally well.
In their comparison, what matters most is adaptivity on the last layer and the normalization parameters.

In large networks, Shampoo (Gupta, Koren and Singer 2018) and SOAP (Vyas et al. 2025) precondition each weight matrix from both sides.
Muon replaces each matrix’s momentum by the nearest orthogonal matrix.
This is a steepest-descent step in the spectral norm (Bernstein and Newhouse 2024).
Liu et al. (2025) trained large language models with Muon on about half of AdamW’s compute.

These matrix updates rotate along with the matrix’s rows and columns.
So within a layer they do not depend on the coordinate axes the way Adam does.
At scale the axes may still matter, but with parameter blocks and matrices as the units rather than single coordinates.

## References

- Riedmiller, M. and Braun, H. (1993). A direct adaptive method for faster backpropagation learning: the RPROP algorithm. IEEE International Conference on Neural Networks.
  Steps by a per-weight size using only the sign of each partial derivative.
- Duchi, J., Hazan, E. and Singer, Y. (2011). Adaptive subgradient methods for online learning and stochastic optimization. JMLR 12.
  AdaGrad: per-coordinate step sizes from accumulated squared gradients.
- Tieleman, T. and Hinton, G. (2012). Lecture 6.5, RMSprop. COURSERA: Neural Networks for Machine Learning.
  RMSprop: divides each gradient by a running root mean square of its recent values.
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
- Gupta, V., Koren, T. and Singer, Y. (2018). Shampoo: preconditioned stochastic tensor optimization. ICML.
  Preconditions each weight matrix with one matrix per side, instead of per coordinate.
- Bernstein, J. and Newhouse, L. (2024). Old optimizer, new norm: an anthology. arXiv:2409.20325.
  Adam, Shampoo and their relatives as steepest descent in different norms; orthogonalized updates as steepest descent in the spectral norm.
- Kunstner, F., Milligan, A., Yadav, R., Schmidt, M. and Bietti, A. (2024). Heavy-tailed class imbalance and why Adam outperforms gradient descent on language models. NeurIPS.
  Gradient descent is slow on rare classes, which dominate language data; Adam and sign descent are not.
- Liu, J. et al. (2025). Muon is scalable for LLM training. arXiv:2502.16982.
  Muon, with weight decay and per-matrix step scaling, trains large language models about twice as compute-efficiently as AdamW.
- Vyas, N., Morwani, D., Zhao, R., Shapira, I., Brandfonbrener, D., Janson, L. and Kakade, S. (2025). SOAP: improving and stabilizing Shampoo using Adam for language modeling. ICLR.
  Runs Adam in the eigenbasis of Shampoo’s preconditioner.
- Zhao, R., Morwani, D., Brandfonbrener, D., Vyas, N. and Kakade, S. (2025). Deconstructing what makes a good optimizer for autoregressive language models. ICLR.
  Apart from SGD, the optimizers compared perform about equally; adaptivity on the last layer and LayerNorm parameters is what matters.

# Sharp and flat minima

## Subtitle

A narrow, deep well and a wide, shallower basin, with a slider that stretches θ₁.

## Lead

A minimum is sharp when the loss rises quickly around it and flat when it rises slowly.
Flat minima have been linked to better generalization since Hochreiter and Schmidhuber (1997).
But sharpness depends on how the parameters are written (Dinh et al. 2017), so whether flatness explains generalization is disputed.

## In practice

Sharpness is capped by the learning rate, shaped by batch size and changed by reparametrization.
On its own, a sharpness difference between runs is weak evidence about which generalizes better.

## Figure caption

The loss along the straight line through both minima. The dashed lines mark L* + δ for each, with δ = 0.1.

## Try

1. Stretch θ₁ to α = 2 → the figure’s section does not change: the stretch moves both minima and every point between them together.
2. Read the map and readouts → both hatched areas double, the curvature along θ₁ falls fourfold and λ<sub>max</sub> may hardly move: one [[reparametrization|reparam]] changes three sharpness measures by three different factors.
3. Set α back to 1 and raise η just above the 2/λ printed at the [[Sharp minimum|@Sharp minimum]] → particles there bounce between its walls instead of converging.
4. Raise η past about four times that value → they are thrown out and come [[to rest|rest]] in the [[Flat Basin|@Flat Basin]].

## Background

Three measures are in common use.
[[λ<sub>max</sub>|sharpness]], the largest eigenvalue of the Hessian, is the curvature in the steepest direction.
[[ε-sharpness|epssharp]] is the largest rise in loss within a small neighbourhood; Keskar et al. used it, and sharpness-aware minimization (Foret et al. 2021) minimizes it directly.
The volume of the [[sublevel set|sublevel]] `{θ : L(θ) < L* + δ}` is closest to Hochreiter and Schmidhuber’s definition.
They argued that a minimum in a large flat region can be specified with low precision, so by a minimum-description-length argument it should generalize better.

Keskar et al. (2017) found that large-batch training reaches minima with higher ε-sharpness and a larger [[generalization gap|gengap]].
Jiang et al. (2020) trained over 10,000 convolutional networks and found sharpness-based measures among the best of more than 40 predictors of generalization.
Dinh et al. (2017) showed that in a ReLU network, multiplying one layer’s weights by α and dividing the next layer’s by α leaves the function unchanged but changes the curvature.
So a minimum can be made arbitrarily sharp.
Andriushchenko et al. (2023) found that even sharpness measures built to be invariant to such rescalings correlate poorly with generalization, sometimes negatively, in settings such as transformers and fine-tuning.

The step size also limits which minima an optimizer can reach.
Gradient descent cannot converge to a minimum with `λ_max > 2/η`, and SGD’s noise narrows the set further (Wu, Ma and E 2018).
So a large learning rate selects flatter minima, whether or not flatness is what helps generalization.

## Method

The two basins are Gaussian wells on a gentle bowl.
The narrow one is about six times narrower than the wide one and is the deeper of the two.
Each minimum is labelled with λ<sub>max</sub> and with the volume of its sublevel set for δ = 0.1 (in two dimensions, an area), which is hatched on the map.
The figure shows the loss along the straight line through both minima, with dashed lines at L* + δ for each.
[[SGD|sgd]] and full-batch [[gradient descent|gd]] are released at random points, and the readouts show both Hessian eigenvalues at each minimum and count where each optimizer comes [[to rest|rest]].

The stretch instrument replaces the surface by `L(θ₁/α, θ₂)`.
This is a [[reparametrization|reparam]] of the plane: every loss value is still attained, at a moved point.
The Hessian at the corresponding point becomes `DHD` with `D = diag(1/α, 1)`, and every sublevel area is multiplied by α.
It is a two-dimensional analogue of the rescaling in Dinh et al.
Because it is uniform, it changes the sharpness values but not which minimum is sharper; non-uniform reparametrizations can change that too.

## Caveat

Here the sharp minimum is sharp in every direction.
At the minima reached in training, the Hessian has a few large eigenvalues and very many near zero (Sagun et al. 2018).
So a minimum can be sharp along a handful of directions and flat along nearly all the others. λ<sub>max</sub>, ε-sharpness and volume can then rank the same minima differently.

## References

- Hochreiter, S. and Schmidhuber, J. (1997). Flat minima. Neural Computation 9(1).
  The original argument: flat minima take fewer bits to describe and should generalize better.
- Keskar, N. S., Mudigere, D., Nocedal, J., Smelyanskiy, M. and Tang, P. T. P. (2017). On large-batch training for deep learning: generalization gap and sharp minima. ICLR.
  Large-batch training reaches minima with higher ε-sharpness and a larger generalization gap.
- Dinh, L., Pascanu, R., Bengio, S. and Bengio, Y. (2017). Sharp minima can generalize for deep nets. ICML.
  Rescaling a ReLU network changes its sharpness but not its function.
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS.
  Gradient descent can converge only to minima with λ<sub>max</sub> ≤ 2/η; SGD’s noise narrows this further.
- Jiang, Y., Neyshabur, B., Mobahi, H., Krishnan, D. and Bengio, S. (2020). Fantastic generalization measures and where to find them. ICLR.
  Across more than 10,000 networks, sharpness-based measures were among the best predictors of generalization.
- Foret, P., Kleiner, A., Mobahi, H. and Neyshabur, B. (2021). Sharpness-aware minimization for efficiently improving generalization. ICLR.
  Minimizes the worst loss within a ball around the weights.
- Andriushchenko, M., Croce, F., Müller, M., Hein, M. and Flammarion, N. (2023). A modern look at the relationship between sharpness and generalization. ICML.
  Even rescaling-invariant sharpness correlates poorly with generalization in modern settings.
- Sagun, L., Evci, U., Güney, V. U., Dauphin, Y. and Bottou, L. (2018). Empirical analysis of the Hessian of over-parametrized neural networks. ICLR Workshop Track.
  The Hessian spectrum after training: a bulk near zero and a few outliers.

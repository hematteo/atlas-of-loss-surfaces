# Sharp and flat minima

## Subtitle

A narrow, deep well and a wide, shallower basin, with a slider that stretches θ₁ to ask how much of sharpness lives in the coordinates.

## Lead

A minimum is sharp when the loss rises quickly as θ moves away from it, and flat when it rises slowly.
Since Hochreiter and Schmidhuber (1997), flat minima have been linked to better generalization.
The argument is about description length.
If the weights can be perturbed without changing the loss, they need less precision to describe, and a simpler description should transfer better to new data.

The catch is that sharpness depends on how the parameters are written down (Dinh et al. 2017).
So whether flatness explains generalization is still disputed, and this plate shows why.
Stretching one coordinate moves the measures of sharpness, while every loss value on the sheet stays the same.

## In practice

Before reading anything into sharpness, check what set it.
The learning rate caps it, the batch size shapes it, and a reparametrization can change it without changing the function.
So on its own, a sharpness difference between two runs is weak evidence about which one generalizes better.

## Figure caption

The loss along the straight line through both minima.
The dashed lines mark L* + δ for each, with δ = 0.1.
The width of each well at its dashed line is one way to read its flatness.

## Try

1. Stretch θ₁ to α = 2 → between the two minima the figure shows the same curve, only drawn wider.
   The stretch moves both minima and every point between them together.
2. Now read the map and readouts → both hatched areas double, the curvature along θ₁ falls fourfold and λ<sub>max</sub> hardly moves.
   At the sharp minimum λ<sub>max</sub> goes from 346 to 311.
   The area scales by α and the curvature along θ₁ by 1/α².
   λ<sub>max</sub> now comes from θ₂, which the stretch leaves alone.
   So one [[reparametrization|reparam]] has changed these three quantities by three different factors.
   The question "how sharp is this minimum?" has no answer until we say which measure, in which coordinates.
3. Reset α to 1, then raise η to about 7.5 times the 2/λ at the [[Sharp minimum|@Sharp minimum]] → many particles are thrown into the [[Flat Basin|@Flat Basin]].
   That η is near the top of the slider.
   Most of SGD’s particles, and about a third of gradient descent’s, come [[to rest|rest]] there.
   Without noise, many of the others come to rest near the pass between the two wells, where the readouts do not count them.
   Between 1.3 and about 6.5 times, they keep bouncing in and around the narrow well.
   So the large [[learning rate|lr]] has selected the flat minimum, without any reference to generalization.

## Background

Three measures of sharpness are in common use, and they do not always agree:

1. [[λ<sub>max</sub>|sharpness]] is the largest eigenvalue of the Hessian: the curvature in the steepest direction.
2. [[ε-sharpness|epssharp]] is the largest rise in loss within a small neighbourhood.
   Keskar et al. used it, and sharpness-aware minimization (Foret et al. 2021; see <i>Sharpness-aware minimization</i>) minimizes the worst loss within such a neighbourhood.
3. The [[sublevel set|sublevel]] `{θ : L(θ) < L* + δ}` contains all the weights whose loss is within δ of the minimum.
   Its volume is closest to Hochreiter and Schmidhuber’s definition.

The evidence for the link is mostly correlational.
Keskar et al. (2017) found that large-batch training reaches minima with higher ε-sharpness and a larger [[generalization gap|gengap]].
Jiang et al. (2020) trained over 10,000 convolutional networks.
Of more than 40 predictors of generalization, sharpness-based measures were among the best.

The evidence against it starts from Dinh et al.’s construction.
They multiplied one layer’s weights in a ReLU network by α and divided the next layer’s by α.
They showed that this leaves the function unchanged but changes the curvature.
So a minimum can be made arbitrarily sharp without changing a single prediction the network makes.

Andriushchenko et al. (2023) then asked whether sharpness measures built to be invariant to such rescalings do better.
They found that these still correlate poorly with generalization, sometimes negatively, in settings such as transformers and fine-tuning.

There is also a simpler reason flat minima turn up: the learning rate filters out sharp ones.
Gradient descent cannot converge to a minimum with `λ_max > 2/η`, and SGD’s noise narrows the set further (Wu, Ma and E 2018; see <i>Stability and catapults</i>).

In Wu, Ma and E’s analysis, the noise comes from sampling the minibatch and vanishes at a minimum that fits every example.
On this sheet the noise is added at a constant level instead.

## Method

The two basins are Gaussian wells on a gentle bowl.
The narrow one is five to six times narrower than the wide one.
It is also the deeper of the two, so a particle that ends in the flat basin is not there because its loss is lower.

Each minimum is labelled with λ<sub>max</sub> and with the volume of its sublevel set for δ = 0.1.
In two dimensions that volume is an area, and it is hatched on the map.
[[SGD|sgd]] and full-batch [[gradient descent|gd]] are released at random points.
The readouts show both Hessian eigenvalues at each minimum and count where each optimizer comes [[to rest|rest]].

The stretch instrument replaces the surface by `L(θ₁/α, θ₂)`.
This [[reparametrization|reparam]] of the plane is a two-dimensional analogue of the rescaling in Dinh et al.
The sheet itself does not grow, so at α = 2 it shows only the middle half of the original θ₁ range.

Under the stretch, the Hessian at the corresponding point becomes `DHD` with `D = diag(1/α, 1)`.
Every sublevel area changes by the same factor, so the stretch cannot change which minimum has the larger volume.

The stretch can, however, reorder λ<sub>max</sub>.
A minimum curved mostly along θ₁ flattens under a strong stretch, while one curved along θ₂ does not.
Here both minima are curved about equally in every direction, so on the slider’s range the sharp one stays sharper.
Non-linear reparametrizations can reorder any of the three measures.

## Limits

Here the sharp minimum is sharp in every direction, which is not what minima in real networks look like.
At the minima reached in training, the Hessian has a few large eigenvalues and very many near zero (Sagun et al. 2018; see <i>Survey of a loss surface</i>).
So a minimum can be sharp along a handful of directions and flat along nearly all the others.

λ<sub>max</sub>, ε-sharpness and volume can then rank the same minima differently.
λ<sub>max</sub> sees only the steepest direction, while the volume is set mostly by the many flat ones.
The volume is also set by the directions in which the minimum is not isolated at all.
The [[learning coefficient|llc]] is a measure built for that case (see <i>Singular minima and the learning coefficient</i>).

In full-batch training with a fixed η, λ<sub>max</sub> rises to 2/η and stays there (see <i>The edge of stability</i>).
So the final λ<sub>max</sub> mostly records the learning rate we chose.

Hoffer, Hubara and Soudry (2017) and Shallue et al. (2019) retuned the learning rate and the number of steps for the larger batch.
Much of the large-batch gap that Keskar et al. reported then closed.
Wen, Li and Ma (2023) showed that in two-layer ReLU networks some of the flattest minima generalize poorly.
They also showed that sharpness-aware minimization can generalize well for reasons other than flatness.
Flatness can also lose its force as the input dimension grows.
For two-layer ReLU networks, Liang et al. (2025) proved that flat minima still generalize, but at a rate that worsens exponentially with the input dimension.
Low-norm solutions, such as those weight decay finds, do not suffer this.

The claim that survives at scale is narrower than the original argument.
Flat minima and good generalization often appear together, but the learning rate and batch size can produce both.

## References

- Hochreiter, S. and Schmidhuber, J. (1997). Flat minima. Neural Computation 9(1).
  The original argument: flat minima take fewer bits to describe and should generalize better.
- Keskar, N. S., Mudigere, D., Nocedal, J., Smelyanskiy, M. and Tang, P. T. P. (2017). On large-batch training for deep learning: generalization gap and sharp minima. ICLR.
  Large-batch training reaches minima with higher ε-sharpness and a larger generalization gap.
- Dinh, L., Pascanu, R., Bengio, S. and Bengio, Y. (2017). Sharp minima can generalize for deep nets. ICML.
  Rescaling a ReLU network changes its sharpness but not its function.
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS.
  Gradient descent can converge only to minima with λ<sub>max</sub> &lt; 2/η; SGD’s noise narrows this further.
- Jiang, Y., Neyshabur, B., Mobahi, H., Krishnan, D. and Bengio, S. (2020). Fantastic generalization measures and where to find them. ICLR.
  Across more than 10,000 networks, sharpness-based measures were among the best predictors of generalization.
- Foret, P., Kleiner, A., Mobahi, H. and Neyshabur, B. (2021). Sharpness-aware minimization for efficiently improving generalization. ICLR.
  Minimizes the worst loss within a ball around the weights.
- Andriushchenko, M., Croce, F., Müller, M., Hein, M. and Flammarion, N. (2023). A modern look at the relationship between sharpness and generalization. ICML.
  Even rescaling-invariant sharpness correlates poorly with generalization in modern settings.
- Sagun, L., Evci, U., Güney, V. U., Dauphin, Y. and Bottou, L. (2018). Empirical analysis of the Hessian of over-parametrized neural networks. ICLR Workshop Track.
  The Hessian spectrum after training: a bulk near zero and a few outliers.
- Hoffer, E., Hubara, I. and Soudry, D. (2017). Train longer, generalize better: closing the generalization gap in large batch training of neural networks. NeurIPS.
  The large-batch gap comes mainly from too few updates, and closes when training is lengthened and retuned.
- Shallue, C. J., Lee, J., Antognini, J., Sohl-Dickstein, J., Frostig, R. and Dahl, G. E. (2019). Measuring the effects of data parallelism on neural network training. Journal of Machine Learning Research 20(112).
  With the learning rate and other metaparameters retuned for each batch size, no consistent large-batch generalization penalty.
- Wen, K., Li, Z. and Ma, T. (2023). Sharpness minimization algorithms do not only minimize sharpness to achieve better generalization. NeurIPS.
  Two-layer ReLU networks in which the flattest minima generalize poorly, yet sharpness minimization still helps.
- Liang, T., Qiao, D., Wang, Y.-X. and Parhi, R. (2025). Stable minima of ReLU neural networks suffer from the curse of dimensionality: the neural shattering phenomenon. NeurIPS.
  Flat minima of two-layer ReLU networks generalize at a rate that worsens exponentially with input dimension.

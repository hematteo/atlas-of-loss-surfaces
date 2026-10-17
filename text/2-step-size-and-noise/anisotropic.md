# The shape of the noise

## Subtitle

Isotropic and Hessian-shaped noise of equal total variance, escaping from one narrow well.

## Lead

Minibatch noise is anisotropic: near a minimum its [[covariance|gradcov]] is approximately the [[Hessian|hessian]] divided by the batch size, so it is largest along the sharpest directions (Zhu et al. 2019; Xie, Sato and Sugiyama 2021).
Zhu et al. showed that such noise leaves sharp minima faster than isotropic noise of equal total variance.
Both results rest on local approximations.

## In practice

When modelling SGD’s noise, match its covariance, not only its size.
Isotropic Gaussian noise escaped sharp minima far more slowly than SGD, while Hessian-shaped noise behaved like SGD (Zhu et al. 2019).

## Figure caption

Fraction of particles still in the narrow well against steps since release, for each shape of noise: a Kaplan–Meier estimate, with particles still inside counted as censored.

## Try

1. Read the median escape times → both ensembles leave the [[Narrow well|@Narrow well]], but Hessian-shaped noise leaves about six times sooner, in a median of about 350 steps.
2. Lower the noise scale σ to 7 → the shaped median rises to about 7,000 steps, while the isotropic readout shows ‘&gt;’ for minutes, because its median is about 250,000 steps.
3. Compare the two values of σ → the gap widens from six-fold to about forty-fold, because escape time grows as `exp(ΔL/T)` and the shaped noise is 1.9 times hotter across the well.
4. Watch the exits → nearly all particles leave across the well, where the rim is 4.5 times closer.

## Background

Near a minimum, the covariance of minibatch gradients is the empirical Fisher divided by B.
When the model’s predictions match the distribution of its data, the empirical Fisher is close to the Fisher information, and the Fisher is close to the Hessian.
Xie, Sato and Sugiyama (2021) measured `C ≈ H/B`, with C the noise covariance, near minima of small networks.
The relation is an approximation.
It weakens away from minima, and when the model does not match its data the empirical Fisher can differ from both the Fisher and the Hessian (Kunstner, Balles and Hennig 2019).

Zhu et al. (2019) took `Tr(HΣ)`, the rate at which noise of covariance Σ raises the loss at a minimum, as an indicator of escape.
They compared noise of covariance Σ with isotropic noise of the same trace.
When the Hessian is ill-conditioned and Σ is aligned with its top eigenvectors, the aligned noise has the larger indicator, by a factor that grows with the dimension.
In their experiments, SGD and gradient descent with Hessian-shaped noise both escaped from sharp minima in which isotropic noise of the same size stayed.
Xie et al. (2021) derived the mean time for SGD to escape over a saddle.
Its logarithm is `2BΔL/η` times a weighted sum of the inverse curvatures at the minimum and at the saddle along the escape direction.
SGD therefore leaves sharp minima exponentially faster than flat ones, while isotropic noise favours flat minima only polynomially.
Both results use quadratic or low-temperature approximations.
The link from escape to generalization is argued, not shown (see <i>Sharp and flat minima</i>).

## Method

The well is a Gaussian dip of depth 0.3 with standard widths 0.1414 and 0.0316, so its Hessian at the bottom has eigenvalues of about 15 and 300 (the mark prints 15 and 297).
Its rim is level: the loss rises by 0.29 to 0.30 in every direction.
Both ensembles run [[SGD|sgd]] with η = 0.001 and noise of total variance 2σ².
Isotropic: `ξ ~ N(0, σ²I)`.
Shaped: `ξ ~ N(0, 2σ²|H|/tr|H|)`, with |H| the Hessian at the particle, its eigenvalues made positive.
At σ = 9.5 the temperature `T = ησ²/2` of the isotropic noise is 0.045 in both directions; the shaped noise has 0.086 across the well and 0.004 along it.
Thirty particles per ensemble (16 on phones) start at the bottom.
One that leaves the ellipse three widths out is counted as escaped and replaced.
The figure is the [[Kaplan–Meier estimate|km]] of the fraction still inside, with particles still in the well as censored times; the readouts are its medians.
Changing σ starts a new experiment.

## Caveat

The shaped noise here has the same total variance as the isotropic noise, as in Zhu et al.’s comparison.
Real minibatch noise is not normalized this way.
With `C ≈ H/B`, its size also grows with the curvature.
At a sharper minimum it is therefore both better aligned and larger.
The sheet isolates the first effect.

## At scale

With the squared loss the noise also shrinks with the loss itself, and it vanishes at a minimum that fits the data exactly.
Mori et al. (2022) showed that escape then depends on the logarithm of the ratio of the loss at the saddle to the loss at the minimum, not on their difference.
So the escape rate is a power law in that ratio, not an exponential in the barrier height.
In large networks minima are often [[mode-connected|modeconn]] (see <i>Mode connectivity</i>), so SGD selects among them less by escaping over barriers than by stability.
Wu, Wang and Su (2022) showed that SGD can stay only at minima whose Hessian has Frobenius norm at most of order √B/η.

## References

- Zhu, Z., Wu, J., Yu, B., Wu, L. and Ma, J. (2019). The anisotropic noise in stochastic gradient descent: its behavior of escaping from sharp minima and regularization effects. ICML.
  The indicator Tr(HΣ); noise aligned with the Hessian escapes sharp minima faster than isotropic noise of the same trace.
- Xie, Z., Sato, I. and Sugiyama, M. (2021). A diffusion theory for deep learning dynamics: stochastic gradient descent exponentially favors flat minima. ICLR.
  Measures C ≈ H/B near minima and derives escape times exponential in BΔL/(ηλ).
- Kunstner, F., Balles, L. and Hennig, P. (2019). Limitations of the empirical Fisher approximation for natural gradient descent. NeurIPS.
  The empirical Fisher need not approximate the Fisher or the Hessian.
- Kaplan, E. L. and Meier, P. (1958). Nonparametric estimation from incomplete observations. Journal of the American Statistical Association 53(282).
  The survival estimate used for the figure and readouts.
- Mori, T., Ziyin, L., Liu, K. and Ueda, M. (2022). Power-law escape rate of SGD. ICML.
  With the squared loss the noise scales with the loss, so the escape rate is a power law in the ratio of the saddle’s loss to the minimum’s.
- Wu, L., Wang, M. and Su, W. (2022). The alignment property of SGD noise and how it helps select flat minima: a stability analysis. NeurIPS.
  A minimum linearly stable for SGD has Hessian Frobenius norm O(√B/η); SGD noise is aligned with sharp directions and scales with the loss.

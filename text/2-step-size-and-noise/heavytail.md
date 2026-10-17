# The tails of the noise

## Subtitle

Gaussian and α-stable noise in a narrow, deep crater and a wide, shallow one.

## Lead

Şimşekli, Sagun and Gürbüzbalaban (2019) reported that SGD’s gradient noise is heavy-tailed, closer to an [[α-stable law|stable]] with α &lt; 2 than to a Gaussian.
Such noise leaves a basin in one jump, so exit time depends on width more than depth.
Other groups found the noise close to Gaussian at common batch sizes.

## In practice

Whether SGD’s noise is heavy-tailed depends on the batch size and on how the tail index is estimated.
Measure it per parameter before building on either the Gaussian or the heavy-tailed picture.

## Figure caption

Fraction of particles still inside each crater after a given number of steps (Kaplan–Meier, log scale), solid for the narrow crater and dashed for the wide one. The Gaussian ensemble keeps the narrow crater longest; the heavy-tailed ensemble leaves it first.

## Try

1. Read the Gaussian medians → Gaussian particles stay longest in the [[Narrow crater|@Narrow crater]], whose barrier is 3.5 times higher.
2. Read the α medians → heavy-tailed particles leave it first, in a median of about 40 steps, mostly in one jump: its rim is 4.5 times closer.
3. Compare the wide-crater medians → heavy tails shorten that stay too, by about 15 times (about 210 steps against 3,300).
4. Set the depth of the narrow crater to 0.3, then 1.2 → its Gaussian median rises from about 340 to over a million; the heavy-tailed one stays about 30–45.

## Background

Şimşekli, Sagun and Gürbüzbalaban (2019) argued from the generalized central limit theorem that a sum of gradients with infinite variance tends to an α-stable law.
They estimated tail indices well below 2 in several networks and modelled SGD as an SDE driven by Lévy motion.
For such an SDE, the exit time from a basin grows only polynomially as the noise shrinks.
It is set by the distance from the minimum to the edge of the basin, not by the height of the barrier (Imkeller and Pavlyukevich 2006).
Nguyen et al. (2019) gave step-size conditions under which discrete SGD keeps this behaviour.
Heavy-tailed SGD would then prefer wide minima.

The measurement is disputed.
Panigrahi et al. (2019) found the noise best described as Gaussian at batch sizes of 256 and above, at least early in training.
Xie, Sato and Sugiyama (2021) pointed out that the tail index had been estimated by pooling the noise of all parameters as samples of one distribution, which assumes it is isotropic and identically distributed.
Pooled Gaussians of different variances are themselves heavier-tailed than a Gaussian.
They found the noise close to Gaussian for B &gt; 16.
Battash, Wolf and Lindenbaum (2024) again found heavy tails, and modelled each parameter by its own one-dimensional Lévy process.
A separate result is proved.
With the multiplicative noise of SGD, the iterates θ can be heavy-tailed even when the data are Gaussian, more so at larger η/B (Gürbüzbalaban, Şimşekli and Zhu 2021; Hodgkinson and Mahoney 2021).

## Method

Each crater has the profile `D(u² − 1)exp(−u²)`, u = r/R, so its rim is at `r = √2R`, drawn as a dash-dotted circle.
The narrow crater has R = 0.09 and the depth D set by the slider (at 0.75 its barrier is ΔL = 0.85 and its rim 0.127 from the centre); the wide one has R = 0.4, ΔL = 0.24 and its rim 0.566 away.
The marks print both.
Both ensembles run [[SGD|sgd]] with η = 0.001 and noise scale σ.
The heavy-tailed noise is `σ√A·ξ`, ξ ~ N(0, I), with A a positive stable variable of index α/2; that makes it an isotropic α-stable vector, and at α = 2 it is the Gaussian.
Eighteen particles per ensemble and crater (ten on phones) start at the centre; crossing the rim counts as an escape, and the particle is replaced.
Steps longer than 0.16 are drawn as arcs.
The readouts are [[Kaplan–Meier|km]] medians, with particles still inside as censored times.
Changing σ or α starts a new experiment.

## Caveat

The noise here is isotropic, the case the pooled tail-index estimates assumed.

## References

- Şimşekli, U., Sagun, L. and Gürbüzbalaban, M. (2019). A tail-index analysis of stochastic gradient noise in deep neural networks. ICML.
  Reports α-stable gradient noise with α well below 2, and models SGD as a Lévy-driven SDE.
- Imkeller, P. and Pavlyukevich, I. (2006). First exit times of SDEs driven by stable Lévy processes. Stochastic Processes and their Applications 116(4).
  Exit times of Lévy-driven SDEs grow polynomially in the noise and depend on distances, not barrier heights.
- Nguyen, T. H., Şimşekli, U., Gürbüzbalaban, M. and Richard, G. (2019). First exit time analysis of stochastic gradient descent under heavy-tailed gradient noise. NeurIPS.
  Step sizes for which discrete SGD keeps the continuous-time exit behaviour.
- Panigrahi, A., Somani, R., Goyal, N. and Netrapalli, P. (2019). Non-Gaussianity of stochastic gradient noise. arXiv:1910.09626.
  Gradient noise is close to Gaussian for batches of 256 and above, at least early in training.
- Xie, Z., Sato, I. and Sugiyama, M. (2021). A diffusion theory for deep learning dynamics: stochastic gradient descent exponentially favors flat minima. ICLR.
  Argues that the pooled tail-index estimate assumes isotropic, identically distributed noise; finds the noise close to Gaussian.
- Battash, B., Wolf, L. and Lindenbaum, O. (2024). Revisiting the noise model of stochastic gradient descent. AISTATS.
  Finds heavy-tailed noise again, with each parameter modelled by its own Lévy process.
- Gürbüzbalaban, M., Şimşekli, U. and Zhu, L. (2021). The heavy-tail phenomenon in SGD. ICML.
  SGD’s iterates can be heavy-tailed on linear regression with Gaussian data; tails get heavier as η/B grows.
- Hodgkinson, L. and Mahoney, M. W. (2021). Multiplicative noise and heavy tails in stochastic optimization. ICML.
  Multiplicative noise makes the stationary distribution of stochastic optimizers heavy-tailed.

# Singular minima and the learning coefficient

## Subtitle

Four minima of equal depth, with λ = 1, ¾, ½ and ½, to measure flatness where the Hessian is singular.

## Lead

Where the [[Hessian|hessian]] at a minimum is singular, some curvatures are zero.
The loss may still rise along those directions, only more slowly, for example as a fourth power.
So curvature does not say how flat such a minimum is.

Singular learning theory measures flatness by volume instead.
The [[sublevel set|sublevel]] at height ε holds the parameters whose loss is less than ε above the minimum.
As ε goes to zero its volume shrinks as `V(ε) ∝ ε^λ`, where λ is the [[learning coefficient|llc]] (Watanabe 2009).
A smaller λ means more volume near the floor: a flatter minimum.

The theory is proved, but estimating λ for networks by Langevin sampling is recent (Lau et al. 2025).
Here λ is known exactly, so we can check the estimates against it.

## In practice

At degenerate minima, Hessian eigenvalues and parameter counts misjudge complexity.
Estimates of the learning coefficient by stochastic gradient [[Langevin dynamics|langevin]] (SGLD) depend on the step size, the localization and the temperature.
The localization is a term that keeps the sampler near the trained weights.
Report these settings and check how sensitive the estimate is to them.

## Figure caption

Above: the volume of each basin below L* + ε, on logarithmic axes.
The slopes are the learning coefficients, and a shallower line means a flatter basin.
Below: λ for each basin (outline) and the particles’ estimate ⟨L − L*⟩/T (filled).

## Try

1. Compare the [[Quartic trough|@Quartic trough]] and the [[Level valley|@Level valley]] → both have Hessian eigenvalues 20 and 0, yet their λ are ¾ and ½.
   The Hessian sees only the u² they share.
   Along v, the trough rises as v⁴ and the valley floor stays level.
2. Read ‘λ from volumes’ → 1.00, 0.75, 0.50 and 0.52.
   The ends of the level valley add volume that grows as `ε^¾`, which lifts its slope over this range of ε.
   Nearer the floor that extra volume matters less, so with smaller ε the slope would approach ½.
3. Read ‘λ̂ from particles’ → at the default [[temperature|temp]] T each lies within 0.05 of λ.
   The particles’ mean excess loss is λT here (see the Method).
4. Raise T to 0.02 → each λ̂ stays within 0.07 of λ, and the regular well reads about 1.05.
   Its curvature falls slightly further from the minimum, and the finite step adds bias.

## Background

In a regular model with d parameters fitted to n samples, the posterior is asymptotically Gaussian.
The Bayesian free energy then grows as `nL* + (d/2) log n`, which is the basis of the Bayesian information criterion (BIC).

Neural networks are [[singular|singular]].
Symmetries and redundant units make whole sets of parameters compute the same function.
For example, if a unit’s outgoing weight is zero, its incoming weights can be anything.
So the Fisher information is degenerate, and the Gaussian approximation fails (Wei et al. 2023).

Watanabe proved that the free energy of a singular model grows as `nL* + λ log n − (m − 1) log log n`.
The exponent λ is the real log canonical threshold, also called the learning coefficient.
The multiplicity of λ is m.
Equivalently, the volume of parameters within ε of the minimum scales as `ε^λ (−log ε)^(m−1)`.

Watanabe also proved that the Bayes generalization error is λ/n to leading order.
At a regular minimum λ is d/2, and at a singular one it is at most d/2 and usually less.
So 2λ acts as an effective number of parameters.
Between basins of equal loss, the posterior favours the one with smaller λ by a factor that grows as a power of n.

Watanabe (2013) estimated the free energy by sampling at inverse temperature 1/log n.
This estimate is WBIC, the widely applicable BIC.
Lau et al. defined a local learning coefficient for a trained network and estimated it with SGLD.

Hoogland et al. (2025) tracked that coefficient through transformer training and found that its changes mark developmental stages.
Grokking is generalization that arrives long after memorization.
Cullen et al. (2026, a preprint) describe it as a move from a memorizing basin to a generalizing one with smaller λ.

## Method

Each basin has local coordinates (u, v): the θ offsets divided by 0.3 and rotated.
In these coordinates the four basins are:

1. Regular well: `p = 0.9(u² + v²)`.
2. Quartic trough: `0.9(u² + v⁴)`.
3. Flat floor: `0.9(u⁴ + v⁴)`.
4. Level valley: `0.9u²` on the segment |v| ≤ 1, closed by a steep quartic beyond its ends.

Each basin after the first makes a direction quartic or level, which lowers λ.
The loss is `1.3p/(1.3 + p)`, which is within 1% of p for p &lt; 0.013.
The basins are joined by a soft minimum, so their depths agree to 10⁻¹³.

V(ε) is counted on a grid in a box fitted to each basin.
The printed λ is the least-squares slope of log V on log ε over 10⁻⁴ to 10⁻².

In each basin 24 particles run the unadjusted [[Langevin algorithm|langevin]] `θ ← θ − η∇L + √(2ηT) ξ`, with η = 0.002.
Here ξ is standard Gaussian noise.
The algorithm samples `exp(−L/T)` up to a bias of order ηλ<sub>max</sub> = 0.04.
A particle 1.6 local units out is replaced, which keeps each sample in its own basin.

After 400 steps, `λ̂ = ⟨L − L*⟩/T`.
For a volume growing as `ε^λ`, the mean excess loss ⟨L − L*⟩ is exactly λT.

## Limits

Here the estimate uses exact gradients at an exact minimum, and its bias comes only from the finite step and the temperature.
On a network, SGLD uses minibatch gradients, the localization term and an inverse temperature near 1/log n.
The trained weights are not exactly at a minimum, and the estimate depends on these choices (Lau et al. 2025).
So the sheet shows a best case, and in networks these estimates are used mainly to compare checkpoints or parts of one model.

A grid’s size grows exponentially with the dimension, so in a network with millions of parameters the volumes can only be estimated by sampling.
Lau et al. applied their SGLD estimator to deep linear networks of up to 100 million parameters, to ResNets and to transformer language models.
Wang et al. (2025) refined it to single attention heads of a small transformer.
They found that heads with different jobs develop different coefficients.

## References

- Watanabe, S. (2009). Algebraic Geometry and Statistical Learning Theory. Cambridge University Press.
  Proves the asymptotics of the free energy and the generalization error of singular models in terms of λ.
- Watanabe, S. (2013). A widely applicable Bayesian information criterion. JMLR 14.
  WBIC: the free energy from posterior samples at inverse temperature 1/log n.
- Wei, S., Murfet, D., Gong, M., Li, H., Gell-Redman, J. and Quella, T. (2023). Deep learning is singular, and that’s good. IEEE Transactions on Neural Networks and Learning Systems 34(12).
  Singular learning theory for neural networks.
- Lau, E., Furman, Z., Wang, G., Murfet, D. and Wei, S. (2025). The local learning coefficient: a singularity-aware complexity measure. AISTATS.
  Defines the local learning coefficient and its SGLD estimator.
- Hoogland, J., Wang, G., Farrugia-Roberts, M., Carroll, L., Wei, S. and Murfet, D. (2025). Loss landscape degeneracy and stagewise development in transformers. TMLR.
  Changes in the local learning coefficient mark stages of transformer development.
- Cullen, B., Estan-Ruiz, S., Danait, R. and Li, J. (2026). A basin-selection perspective on grokking via singular learning theory. arXiv:2603.01192.
  Grokking as a move to a basin with lower λ. Preprint.
- Wang, G., Hoogland, J., van Wingerden, S., Furman, Z. and Murfet, D. (2025). Differentiation and specialization of attention heads via the refined local learning coefficient. ICLR.
  Local learning coefficients restricted to single attention heads track how the heads specialize.

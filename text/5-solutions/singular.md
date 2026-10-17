# Singular minima and the learning coefficient

## Subtitle

Four minima of equal depth, with λ = 1, ¾, ½ and ½.

## Lead

Where the [[Hessian|hessian]] is singular, curvature does not say how flat a minimum is.
Singular learning theory measures it by how fast the [[sublevel set|sublevel]] volume shrinks, `V(ε) ∝ ε^λ`, where λ is the [[learning coefficient|llc]] (Watanabe 2009).
The theory is proved, but estimating λ for networks by Langevin sampling is recent (Lau et al. 2025).

## In practice

At degenerate minima, Hessian eigenvalues and parameter counts misjudge complexity.
SGLD estimates of the learning coefficient depend on step size, localization and temperature, so report them and check sensitivity.

## Figure caption

Above: the volume of each basin below L* + ε, on logarithmic axes; the slopes are the learning coefficients. Below: λ for each basin (outline) and the particles’ estimate ⟨L − L*⟩/T (filled).

## Try

1. Compare the [[Quartic trough|@Quartic trough]] and the [[Level valley|@Level valley]] → both have Hessian eigenvalues 20 and 0, yet their λ are ¾ and ½.
2. Read ‘λ from volumes’ → 1.00, 0.75, 0.50 and 0.52: the level valley’s ends add volume growing as `ε^¾`, which lifts its slope over this range of ε.
3. Read ‘λ̂ from particles’ → at the default T each lies within 0.05 of λ.
4. Raise T to 0.02 → each λ̂ stays within 0.07 of λ, and the regular well reads about 1.05: its walls flatten slightly further out, and the finite step adds bias.

## Background

In a regular model the posterior is asymptotically Gaussian and the Bayesian free energy grows as `nL* + (d/2) log n`, the basis of BIC.
Neural networks are [[singular|singular]]: symmetries and redundant units make sets of parameters compute the same function, the Fisher information is degenerate, and the Gaussian approximation fails (Wei et al. 2023).
Watanabe (2009) proved that the free energy then grows as `nL* + λ log n − (m − 1) log log n`.
The exponent λ is the real log canonical threshold, or learning coefficient, and m is its multiplicity.
Equivalently, the volume of parameters within ε of the minimum scales as `ε^λ (−log ε)^(m−1)`.
Watanabe also proved that the Bayes generalization error is λ/n to leading order. λ is d/2 at a regular minimum and smaller at a singular one, so 2λ acts as an effective number of parameters.
Between basins of equal loss, the posterior favours the one with smaller λ by a factor that grows as a power of n.
Watanabe (2013) estimated the free energy by sampling at inverse temperature 1/log n (WBIC).
Lau et al. (2025) defined a local learning coefficient for a trained network and estimated it with SGLD.
Hoogland et al. (2025) tracked it through transformer training and found its changes mark developmental stages.
Cullen et al. (2026, a preprint) describe grokking as a move from a memorizing basin to a generalizing one with smaller λ.

## Method

In local coordinates (u, v), the θ offsets divided by 0.3 and rotated, the four basins are `p = 0.9(u² + v²)`, `0.9(u² + v⁴)`, `0.9(u⁴ + v⁴)`, and `0.9u²` on the segment |v| ≤ 1, closed by a steep quartic beyond its ends.
The loss is `1.3p/(1.3 + p)`, within 1% of p for p &lt; 0.013, and the basins are joined by a soft minimum, so their depths agree to 10⁻¹⁵.
V(ε) is counted on a grid in a box fitted to each basin, and the printed λ is the least-squares slope of log V on log ε over 10⁻⁴ to 10⁻².
In each basin 24 particles run the unadjusted [[Langevin algorithm|langevin]] `θ ← θ − η∇L + √(2ηT) ξ` with η = 0.002, which samples `exp(−L/T)` up to a bias of order ηλ<sub>max</sub> = 0.04.
A particle 1.6 local units out is replaced.
After 400 steps, `λ̂ = ⟨L − L*⟩/T`: for a volume growing as `ε^λ` this mean is exactly λT.

## Caveat

Here the estimate uses exact gradients at an exact minimum, and its bias comes only from the finite step and the temperature.
On a network, SGLD uses minibatch gradients, a term that keeps the chain near the trained weights, and an inverse temperature near 1/log n.
The trained weights are not exactly at a minimum, and the estimate depends on these choices (Lau et al. 2025).

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

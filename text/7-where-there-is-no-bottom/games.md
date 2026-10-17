# Two players on one sheet

## Subtitle

Four update rules start from one point; the figure plots their distance to the equilibrium.

## Lead

A generative adversarial network trains two networks against each other, so training seeks an [[equilibrium|equil]] of a game, not a minimum.
On the [[bilinear game|bilinear]] `f = aθ₁θ₂`, simultaneous [[gradient descent–ascent|gda]] spirals away from the equilibrium at every step size, while [[extragradient|extragrad]] and [[optimistic|optimistic]] updates converge to it (Korpelevich 1976; Daskalakis et al. 2018).

## In practice

In adversarial training, the players’ interaction makes simultaneous gradient steps rotate; on a bilinear game they diverge at any step size.
Extragradient and optimistic updates converge there.

## Figure caption

Distance to the equilibrium in the latest race, on a log scale, for each update rule. Dashed: the exact rates of simultaneous descent–ascent (rising) and extragradient (falling).

## Try

1. Watch the figure at the default η = 0.1 → the simultaneous curve climbs along the rising dashed line: each step multiplies the distance by `√(1 + η²a²)`.
2. Watch the sheet → the simultaneous particles leave it after about 600 steps; the alternating particles circle, their distance from a start at 0.35 staying between 0.33 and 0.37.
3. Compare extragradient and optimistic → they fall together along the lower dashed line.
4. Raise η to 0.3 → all the rates steepen: the simultaneous particles leave within about 70 steps, and extragradient reaches the [[Equilibrium|@Equilibrium]] in about 250.

## Background

In a zero-sum game θ₁ minimizes f while θ₂ maximizes it.
A local equilibrium is a minimum of f in θ₁ and a maximum in θ₂, so it is a [[saddle point|saddle]] of f.
Near it a smooth game is approximately quadratic, and the bilinear interaction term makes the gradient field rotate around the equilibrium instead of pointing at it.
Mescheder, Nowozin and Geiger (2017) traced GAN instability to this rotation, measured by eigenvalues of the Jacobian of the gradient field with large imaginary parts.
Mescheder, Geiger and Nowozin (2018) reduced a GAN to one generator and one discriminator parameter, the Dirac-GAN, whose linearization at the equilibrium is this bilinear game.
They showed that unregularized GAN training need not converge on it.

On bilinear games each rule’s behaviour is proved.
Simultaneous gradient descent–ascent diverges for every constant step.
Alternating updates stay bounded and cycle (Gidel, Askari Hemmat et al. 2019; Bailey, Gidel and Piliouras 2020).
Extragradient (Korpelevich 1976) converges on monotone problems, which include bilinear games, and Gidel, Berard et al. (2019) carried it over to GAN training.
Optimistic gradient descent–ascent goes back to Popov (1980); Daskalakis et al. (2018) proved last-iterate convergence on bilinear games.
Mokhtari, Ozdaglar and Pattathil (2020) showed that both methods approximate the proximal point method and converge linearly on bilinear problems.

## Method

The sheet is `f(θ₁, θ₂) = aθ₁θ₂` with a = 0.6 and no texture, raised by a constant; the [[Equilibrium|@Equilibrium]] at the origin has [[Hessian|hessian]] eigenvalues ±0.6.
Central differences are exact on a bilinear function, so the gradients are exact.
Each race releases five particles per rule at one point 0.28 to 0.42 from the origin, without noise.
With e = ηa, a simultaneous step multiplies the distance by `√(1 + e²)` and an extragradient step by `√(1 − e² + e⁴)`.
An optimistic step, whose first step is a simultaneous one, contracts the slow mode by `√((1 + √(1 − 4e²))/2)`.
An alternating step has determinant 1 and, for e &lt; 2, eigenvalues on the unit circle, so the iterates stay on a closed curve.
The figure averages log₁₀ distance per rule; the dashed lines are the first two rates, drawn from the race’s nominal start.
Measured slopes agree with all three rates to four significant digits.
Particles within 0.006 of the equilibrium retire.

## Caveat

A bilinear game has no curvature in either player’s own variable.
Near a strict local equilibrium of a real game, each player’s own curvature adds contraction, and simultaneous gradient descent–ascent converges there for small enough steps.
The bilinear case isolates the rotation that makes it fail.

## References

- Korpelevich, G. M. (1976). The extragradient method for finding saddle points and other problems. Ekonomika i Matematicheskie Metody 12(4).
  Introduces extragradient and proves its convergence for monotone saddle-point problems.
- Popov, L. D. (1980). A modification of the Arrow–Hurwicz method for search of saddle points. Mathematical Notes of the Academy of Sciences of the USSR 28(5).
  The method that reuses the previous gradient as the trial step, now called optimistic gradient descent–ascent.
- Goodfellow, I., Pouget-Abadie, J., Mirza, M., Xu, B., Warde-Farley, D., Ozair, S., Courville, A. and Bengio, Y. (2014). Generative adversarial nets. NeurIPS.
  Introduces GANs, trained as a two-player game.
- Mescheder, L., Nowozin, S. and Geiger, A. (2017). The numerics of GANs. NeurIPS.
  Traces GAN instability to Jacobian eigenvalues with large imaginary parts.
- Mescheder, L., Geiger, A. and Nowozin, S. (2018). Which training methods for GANs do actually converge? ICML.
  The Dirac-GAN, whose linearization is a bilinear game; unregularized training need not converge.
- Daskalakis, C., Ilyas, A., Syrgkanis, V. and Zeng, H. (2018). Training GANs with optimism. ICLR.
  Optimistic mirror descent converges in the last iterate on bilinear games.
- Gidel, G., Askari Hemmat, R., Pezeshki, M., Le Priol, R., Huang, G., Lacoste-Julien, S. and Mitliagkas, I. (2019). Negative momentum for improved game dynamics. AISTATS.
  Alternating updates are more stable than simultaneous ones on bilinear games.
- Gidel, G., Berard, H., Vignoud, G., Vincent, P. and Lacoste-Julien, S. (2019). A variational inequality perspective on generative adversarial networks. ICLR.
  Casts GAN training as a variational inequality and adapts extragradient to it.
- Bailey, J. P., Gidel, G. and Piliouras, G. (2020). Finite regret and cycles with fixed step-size via alternating gradient descent-ascent. COLT.
  Alternating gradient descent–ascent stays bounded and cycles in zero-sum bilinear games.
- Mokhtari, A., Ozdaglar, A. and Pattathil, S. (2020). A unified analysis of extra-gradient and optimistic gradient methods for saddle point problems: proximal point approach. AISTATS.
  Both methods approximate the proximal point method and converge linearly on bilinear problems.

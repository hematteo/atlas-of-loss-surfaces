# Two players on one sheet

## Subtitle

Four update rules start from one point of a two-player game, to ask which can reach its equilibrium at all.

## Lead

A generative adversarial network (GAN; Goodfellow et al. 2014) trains two networks against each other, so training seeks an [[equilibrium|equil]] of a game, not a minimum.
At an equilibrium, neither player can improve by changing only its own variable.
The simplest case is the [[bilinear game|bilinear]] `f = aθ₁θ₂`, in which θ₁ wants f small and θ₂ wants it large.
There, simultaneous [[gradient descent–ascent|gda]] spirals away from the equilibrium at every step size, while [[extragradient|extragrad]] and [[optimistic|optimistic]] updates converge to it for small enough steps (Korpelevich 1976; Daskalakis et al. 2018).
This plate races four rules from one start, so we can compare their rates directly.

## In practice

Most GANs are trained with alternating steps for the two networks and a gradient penalty on the discriminator, such as R1 (Mescheder et al. 2018).
The penalty adds curvature in the discriminator’s own variable, which this sheet lacks.
With it, Mescheder et al. proved that gradient steps converge locally, near the equilibrium.
Without it, as here, alternating steps only circle.

## Figure caption

Distance to the equilibrium in the latest race, on a log scale, for each update rule.
Dashed: the exact rates of simultaneous descent–ascent (rising) and extragradient (falling).
On a log scale a constant factor per step is a straight line.

## Try

1. Watch the figure at the default η = 0.1 → the simultaneous curve climbs along the rising dashed line: each step multiplies the distance by `√(1 + η²a²)`.
   This is because the field points at right angles to the line from the equilibrium, so every step lands further out.
2. Watch the sheet → the simultaneous particles leave it after about 650 steps, while the alternating particles circle: from a start at 0.35, their distance stays between 0.33 and 0.37.
   An alternating step preserves area (its determinant is 1), so it can spiral neither in nor out.
3. Compare extragradient and optimistic → they fall together along the lower dashed line.
   Both approximate the same proximal point method (see the Background).
4. Raise η to 0.3 → all the rates steepen: the simultaneous particles leave within about 80 steps, and extragradient reaches the [[Equilibrium|@Equilibrium]] in about 250.

## Background

In a zero-sum game θ₁ minimizes f while θ₂ maximizes it.
A local equilibrium is a minimum of f in θ₁ and a maximum in θ₂, so it is a [[saddle point|saddle]] of f.
Near it a smooth game is approximately quadratic, and the bilinear interaction term makes the gradient field rotate around the equilibrium instead of pointing at it.
Mescheder, Nowozin and Geiger (2017) traced GAN instability to this rotation, which shows up as eigenvalues of the gradient field’s Jacobian with large imaginary parts.
Mescheder, Geiger and Nowozin (2018) reduced a GAN to one generator and one discriminator parameter, the Dirac-GAN, whose linearization at the equilibrium is this bilinear game.
They showed that unregularized GAN training need not converge on it.

On bilinear games the behaviour of each rule has been proved:

1. Simultaneous gradient descent–ascent diverges for every constant step.
2. Alternating updates stay bounded and cycle (Gidel, Askari Hemmat et al. 2019; Bailey, Gidel and Piliouras 2020).
3. Extragradient (Korpelevich 1976) converges on monotone problems, which include bilinear games, and Gidel, Berard et al. (2019) carried it over to GAN training.
4. Optimistic gradient descent–ascent goes back to Popov (1980), and Daskalakis et al. (2018) proved its last-iterate convergence on bilinear games.

Mokhtari, Ozdaglar and Pattathil (2020) showed that both methods approximate the proximal point method and converge linearly on bilinear problems.
The proximal point method steps with the gradient at its own landing point, and on a rotation that step always moves inward.

## Method

The sheet is `f(θ₁, θ₂) = aθ₁θ₂` with a = 0.6 and no texture, raised by a constant.
The [[Equilibrium|@Equilibrium]] at the origin has [[Hessian|hessian]] eigenvalues ±0.6, so f curves up in one direction and down in the other.
Central differences are exact on a bilinear function, so the gradients are exact.
Each race releases five particles per rule at one point 0.28 to 0.42 from the origin, without noise.
With e = ηa, a simultaneous step multiplies the distance by `√(1 + e²)` and an extragradient step by `√(1 − e² + e⁴)`.
For small e these are close to 1 ± e²/2, so the dashed lines rise and fall at nearly equal slopes.
An optimistic step, whose first step is a simultaneous one, contracts the slow mode by `√((1 + √(1 − 4e²))/2)`.
An alternating step has determinant 1 and, for e &lt; 2, eigenvalues on the unit circle, so the iterates stay on a closed curve.
The figure averages log₁₀ distance per rule, and the dashed lines are the first two rates, drawn from the race’s nominal start.
Measured slopes agree with all three rates to four significant digits.
Particles within 0.006 of the equilibrium retire.

## Caveat

A bilinear game has no curvature in either player’s own variable.
With θ₂ held fixed, f is a straight line in θ₁, with no bottom to fall into.
Near a strict local equilibrium of a real game, each player’s own curvature adds contraction, and simultaneous gradient descent–ascent converges there for small enough steps.
The bilinear case isolates the rotation that makes it fail.

## At scale

In any number of dimensions, the Jacobian of the game’s gradient field splits into a symmetric part, which behaves like descent on a loss, and an antisymmetric part, the rotation drawn on this sheet (Balduzzi et al. 2018).
A real GAN, with millions of parameters per player, has both parts, so its training mixes descent with the cycling seen here.
Recent GANs get convergent dynamics from the loss rather than from the update rule.
R3GAN (Huang et al. 2024) pairs a relativistic loss with gradient penalties on real and generated data, and its authors prove that it converges locally.

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
  The Dirac-GAN, whose linearization is a bilinear game; unregularized training need not converge, and the R1 gradient penalty makes it converge.
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
- Balduzzi, D., Racanière, S., Martens, J., Foerster, J., Tuyls, K. and Graepel, T. (2018). The mechanics of n-player differentiable games. ICML.
  Splits a game’s dynamics into a potential part and a rotational (Hamiltonian) part, and adjusts the update to tame the rotation.
- Huang, Y., Gokaslan, A., Kuleshov, V. and Tompkin, J. (2024). The GAN is dead; long live the GAN! A modern GAN baseline. NeurIPS.
  A relativistic GAN loss with R1 and R2 gradient penalties that has local convergence guarantees.

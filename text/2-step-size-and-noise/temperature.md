# Noise as temperature

## Subtitle

SGD with isotropic, constant noise: three ensembles spread over three wells on a bowl.

## Lead

For small η, SGD approximately follows [[gradient flow|gflow]] plus noise set by η and the [[batch size|batch]] B (Li, Tai and E 2017).
With isotropic, constant noise, its [[stationary distribution|stationary]] would be [[Boltzmann|boltzmann]] at a [[temperature|temp]] T ∝ η/B (Jastrzębski et al. 2017).
Minibatch noise is anisotropic, so only the η/B scaling is well supported.

## In practice

For SGD, η/B sets the noise scale, so scale η with the batch size.
With warmup this worked up to batches of 8,192 for ResNet-50 on ImageNet (Goyal et al. 2017); larger batches lost accuracy.

## Figure caption

Share of each well’s catchment under the Boltzmann distribution at each ensemble’s temperature (outlined) and among the ensemble’s particles over roughly the last 11 seconds (filled).

## Try

1. Wait about 20,000 steps (two minutes) → the first and third ensembles’ filled bars match their outlines within a few hundredths: both run at the same T.
2. Compare the wells → in those two ensembles the wide, shallow well [[B|@B]] holds more than the narrow, deeper [[A|@A]].
3. Watch the cold ensemble → it keeps its starting shares: at T/4 even the lowest barrier, out of B, is about 10 T, and [[crossing it|kramers]] takes millions of steps.
4. Raise σ to 14 → the cold ensemble empties B within about 100,000 steps: the barrier is then 4 T.

## Background

Li, Tai and E (2017) proved that for small η, SGD is a weak first-order approximation of the [[SDE|sde]] `dθ = −∇L dt + √(ηΣ/B) dW`, where Σ is the covariance of single-example gradients.
Mandt, Hoffman and Blei (2017) studied it near one minimum, where the loss is quadratic and the stationary distribution is Gaussian, and chose η and B so that this distribution approximates a Bayesian posterior.
Jastrzębski et al. (2017) assumed isotropic noise, obtained the Boltzmann distribution `p(θ) ∝ exp(−L(θ)/T)` with T ∝ η/B, and found that η/B sets the width of the minima SGD reaches.
Smith and Le (2018) reached the same scaling through the noise scale `ηN/B`, for a training set of size N.
It implies the linear scaling rule: multiply η by k when B is multiplied by k.
Li, Malladi and Arora (2021) give a testable necessary condition for the SDE approximation and the linear scaling rule.

Minibatch noise is neither isotropic nor constant: near a minimum its covariance is close to the Hessian (see <i>The shape of the noise</i>).
Chaudhari and Soatto (2018) showed that SGD then has a Boltzmann-like stationary distribution for a different potential, which equals L only when the noise is isotropic.
A basin’s Boltzmann weight grows with its width as well as its depth, one argument for why SGD favours flat minima.
The time to cross a barrier ΔL grows as `exp(ΔL/T)` (Kramers 1940).

## Method

Three Gaussian wells on a bowl, marked [[A|@A]], [[B|@B]] and [[C|@C]] with their loss and λ<sub>max</sub>.
Every particle runs [[SGD|sgd]] with isotropic noise, `θ ← θ − η(∇L + σξ)`, ξ ~ N(0, I).
Per step the noise moves θ with variance η²σ² per coordinate, which equals the 2Tη of a [[Langevin|langevin]] step of duration η when `T = ησ²/2`.
The ensembles are (η, σ), standing for batch B; (η, σ/2), batch 4B and T/4; and (2η, σ/√2), batch 2B and the same T.
The readouts print each T.
Each ensemble has 110 particles (50 on phones), released uniformly and never retired; one that leaves the sheet is put back at a uniform random point.
Outlined bars: the Boltzmann share of each well’s catchment under gradient flow (dash-dotted on the map), summed over the height grid.
Filled bars: the share of the ensemble’s particles in each catchment, counted every frame with exponential forgetting over about 670 frames (about 11 s).
The haze is `exp(−(L − L*)/T)` at T (rose) and at T/4 (violet).

## Caveat

The discrete update samples a slightly hotter distribution than the Boltzmann one it is compared with.
On a quadratic with curvature λ its variance is larger by the factor `1/(1 − ηλ/2)`: about 1.06 for the first ensemble in A and 1.13 for the third.
The noise here is isotropic and constant by construction: the one case in which the stationary distribution is Boltzmann in L itself.

## References

- Kramers, H. A. (1940). Brownian motion in a field of force and the diffusion model of chemical reactions. Physica 7(4).
  The time to cross a barrier ΔL at temperature T grows as exp(ΔL/T).
- Welling, M. and Teh, Y. W. (2011). Bayesian learning via stochastic gradient Langevin dynamics. ICML.
  Adds Gaussian noise to SGD steps so that the iterates sample a posterior: the update this sheet runs.
- Li, Q., Tai, C. and E, W. (2017). Stochastic modified equations and adaptive stochastic gradient algorithms. ICML.
  Proves that SGD with small η is a weak approximation of an SDE whose noise covariance is ηΣ.
- Mandt, S., Hoffman, M. D. and Blei, D. M. (2017). Stochastic gradient descent as approximate Bayesian inference. JMLR 18(134).
  Constant-step SGD near one minimum as an Ornstein–Uhlenbeck process with a Gaussian stationary distribution.
- Jastrzębski, S., Kenton, Z., Arpit, D., Ballas, N., Fischer, A., Bengio, Y. and Storkey, A. (2017). Three factors influencing minima in SGD. arXiv:1711.04623. Published as: Width of minima reached by stochastic gradient descent is influenced by learning rate to batch size ratio. ICANN 2018.
  Under isotropic noise, a Boltzmann distribution with temperature ∝ η/B; wider minima at larger η/B.
- Goyal, P., Dollár, P., Girshick, R., Noordhuis, P., Wesolowski, L., Kyrola, A., Tulloch, A., Jia, Y. and He, K. (2017). Accurate, large minibatch SGD: training ImageNet in 1 hour. arXiv:1706.02677.
  The linear scaling rule with warmup, holding up to batches of 8,192 for ResNet-50 on ImageNet.
- Smith, S. L. and Le, Q. V. (2018). A Bayesian perspective on generalization and stochastic gradient descent. ICLR.
  The noise scale ηN/B, and an optimal batch size proportional to η.
- Chaudhari, P. and Soatto, S. (2018). Stochastic gradient descent performs variational inference, converges to limit cycles for deep networks. ICLR.
  With anisotropic noise, SGD’s stationary distribution is set by a potential that differs from the loss.
- Li, Z., Malladi, S. and Arora, S. (2021). On the validity of modeling SGD with stochastic differential equations (SDEs). NeurIPS.
  A testable necessary condition for the SDE approximation and the linear scaling rule.

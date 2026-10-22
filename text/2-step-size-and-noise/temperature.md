# Noise as temperature

## Subtitle

SGD with isotropic, constant noise: three ensembles spread over three wells on a bowl, to test whether they settle into a Boltzmann distribution.

## Lead

For small η, SGD approximately follows [[gradient flow|gflow]] plus noise whose size is set by η and the [[batch size|batch]] B (Li, Tai and E 2017).
If that noise were isotropic and constant, SGD’s [[stationary distribution|stationary]] would be the [[Boltzmann distribution|boltzmann]] at a [[temperature|temp]] T ∝ η/B (Jastrzębski et al. 2017).

The Boltzmann density falls exponentially with the loss, so regions of low loss hold the most particles.
A higher temperature spreads them more evenly.

Minibatch noise is anisotropic, stronger in some directions than in others, so only the η/B scaling is well supported.
This plate builds the one case in which the theory is exact, to see what it predicts and how long that takes.

## In practice

For SGD, η/B sets the noise scale, so scale η in proportion to the batch size.
With warmup this worked up to batches of 8,192 for ResNet-50 on ImageNet (Goyal et al. 2017).
Larger batches lost accuracy.

## Figure caption

Outlined: the share of each well’s catchment under the Boltzmann distribution at each ensemble’s temperature.
Filled: the same share among the ensemble’s particles over roughly the last 11 seconds.
Where a filled bar matches its outline, that ensemble is sampling the Boltzmann distribution.

## Try

1. Wait about 20,000 steps (two minutes) → the filled bars of the first and third ensembles match their outlines to within a few hundredths.
   These two ensembles run at the same T.
   The third takes larger steps with less noise, yet ends in the same distribution, because only T enters the Boltzmann distribution.
2. Compare the wells → in those two ensembles the wide, shallow well [[B|@B]] holds more than the narrow, deeper [[A|@A]].
   A well’s Boltzmann weight counts its width as well as its depth.
   At this temperature B’s extra width outweighs A’s extra depth.
3. Watch the cold ensemble → it keeps its starting shares.
   At T/4 even the lowest barrier, the one out of B, is about 10 times the temperature.
   [[Crossing it|kramers]] takes millions of steps.
4. Raise σ to 14 → the cold ensemble empties B within about 100,000 steps.
   The barrier out of B is then only 4 times the temperature.
   The crossing time is exponential in that ratio, so a modest rise in σ shortens it a lot.

## Background

Li, Tai and E (2017) proved that for small η, SGD is a weak first-order approximation of an [[SDE|sde]].
A weak approximation matches averages over many runs rather than individual paths.
The SDE is `dθ = −∇L dt + √(ηΣ/B) dW`, where Σ is the covariance of single-example gradients.

Mandt, Hoffman and Blei (2017) studied it near one minimum, where the loss is quadratic and the stationary distribution is Gaussian.
They chose η and B so that this distribution approximates a Bayesian posterior.

Jastrzębski et al. (2017) assumed isotropic noise and obtained the Boltzmann distribution `p(θ) ∝ exp(−L(θ)/T)` with T ∝ η/B.
They found that η/B sets the width of the minima SGD reaches.
Smith and Le (2018) reached the same scaling through the noise scale `ηN/B`, for a training set of size N.

This scaling implies the linear scaling rule: multiply η by k when B is multiplied by k.
Li, Malladi and Arora (2021) gave a testable necessary condition for the SDE approximation and the linear scaling rule.

Minibatch noise is neither isotropic nor constant.
Near a minimum its covariance is close to the Hessian divided by B (see <i>The shape of the noise</i>).
Chaudhari and Soatto (2018) showed that SGD then has a Boltzmann-like stationary distribution, but for a different potential.
That potential equals L only when the noise is isotropic.

Two consequences of the Boltzmann picture matter on this sheet:

1. A basin’s Boltzmann weight grows with its width as well as its depth, since it sums exp(−L/T) over the whole basin.
   This is one argument for why SGD favours flat minima.
2. The time to cross a barrier ΔL grows as `exp(ΔL/T)` (Kramers 1940).

## Method

The sheet has three Gaussian wells on a bowl, marked [[A|@A]], [[B|@B]] and [[C|@C]] with their loss and λ<sub>max</sub>.
Every particle runs [[SGD|sgd]] with isotropic noise, `θ ← θ − η(∇L + σξ)`, with ξ ~ N(0, I).
Per step this noise moves θ with variance η²σ² per coordinate.
That equals the 2Tη of a [[Langevin|langevin]] step of duration η when `T = ησ²/2`.

The three ensembles stand for different batch sizes, since minibatch noise has standard deviation proportional to 1/√B:

1. (η, σ), standing for batch B.
2. (η, σ/2), batch 4B and T/4.
3. (2η, σ/√2), batch 2B and the same T.

The readouts print each T.
Each ensemble has 110 particles (50 on phones), released uniformly and never retired.
A particle that leaves the sheet is put back at a uniform random point.

A well’s catchment is the region that gradient flow carries into it, drawn dash-dotted on the map.
The outlined bars give the Boltzmann share of each catchment, summed over the height grid.
The filled bars give the share of the ensemble’s particles in each catchment.
They are counted every frame, with exponential forgetting over about 670 frames (about 11 s).
The haze is `exp(−(L − L*)/T)` at T (rose) and at T/4 (violet).

## Caveat

The discrete update samples a slightly hotter distribution than the Boltzmann one it is compared with.
On a quadratic with curvature λ, its variance is larger by the factor `1/(1 − ηλ/2)`.
That is about 1.06 for the first ensemble in A, and 1.13 for the third.

The noise here is isotropic and constant by construction.
That is the one case in which the stationary distribution is Boltzmann in L itself.
So with real minibatch noise, only the η/B scaling should carry over.

## At scale

A large network never reaches its [[stationary distribution|stationary]].
Language models are pretrained for about one pass over their data, far too short to equilibrate.
The cold ensemble, stuck in its starting shares, is perhaps the better picture of that regime.
In that single-epoch regime, Vyas et al. (2024) found that small-batch noise brings no measurable gain in generalization, only cheaper steps.

The linear scaling rule holds only below a [[critical batch size|cbs]].
McCandlish et al. (2018) predicted this batch size from the ratio of the gradient’s variance to its squared norm.
In language-model pretraining, the critical batch size grows mainly with the amount of data, not with model size (Zhang et al. 2025).
For [[Adam|adam]], Malladi et al. (2022) derived a different rule from the SDE: scale η with √B, not with B.

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
- McCandlish, S., Kaplan, J., Amodei, D. and the OpenAI Dota Team (2018). An empirical model of large-batch training. arXiv:1812.06162.
  The gradient noise scale predicts the critical batch size, above which larger batches stop saving steps.
- Malladi, S., Lyu, K., Panigrahi, A. and Arora, S. (2022). On the SDEs and scaling rules for adaptive gradient algorithms. NeurIPS.
  SDEs for RMSprop and Adam, and the square-root scaling rule for their learning rate.
- Vyas, N., Morwani, D., Zhao, R., Kaplun, G., Kakade, S. and Barak, B. (2024). Beyond implicit bias: the insignificance of SGD noise in online learning. ICML.
  In single-epoch training, small batches give no generalization benefit, only a computational one.
- Zhang, H., Morwani, D., Vyas, N., Wu, J., Zou, D., Ghai, U., Foster, D. and Kakade, S. (2025). How does critical batch size scale in pre-training? ICLR.
  In language-model pretraining the critical batch size grows mainly with data size, not model size.

# Weight averaging

## Subtitle

SGD in two basins, with each particle’s running average drawn as a ring.

## Lead

With a constant learning rate, SGD’s iterates keep fluctuating around a minimum, with a spread that grows with η.
Their running average fluctuates far less.
[[Averaging|iteravg]] provably reaches the best possible asymptotic rate in stochastic approximation (Polyak and Juditsky 1992); stochastic weight averaging carries it over to deep networks (Izmailov et al. 2018).

## In practice

With a constant or cyclical learning rate, evaluate an average of late iterates as well as the last: it removes much of the noise-driven excess loss.
Under BatchNorm, recompute statistics for the average.

## Figure caption

Mean excess loss L − L* against age, over all cohorts since η or σ last changed, for the particles (solid) and their running averages (dashed), each measured from the floor of its own basin.

## Try

1. Compare the ‘L − L*’ readouts → after 1,600 steps a particle is about 0.05 above the floor, its average about 0.0007, some 70 times less.
2. Lower η to 0.006 → the particles’ excess falls about fourfold, the averages’ stays below 0.001: a long average’s error depends on σ²/λ and the step count, not η.
3. Raise η to 0.04, close to 2/λ<sub>max</sub> of the [[West Basin|@West Basin]] → the particles’ excess triples and the averages’ rises to about 0.01.
4. Find the dashed line joining averages in two basins → its midpoint lies on the ridge, far above both floors.

## Background

On a quadratic, SGD with constant η and gradient noise of variance σ² reaches a [[stationary distribution|stationary]] with variance `ησ²/(λ(2 − ηλ))` along an eigendirection of curvature λ.
Its excess loss is therefore about ησ²/4 per direction and grows with η.
Ruppert (1988) and Polyak and Juditsky (1992) showed that averaging the iterates of stochastic approximation run with slowly decreasing steps attains the optimal asymptotic covariance.
Bach and Moulines (2013) proved an O(1/n) rate for averaged SGD with a constant step on least squares.

Izmailov et al. (2018) averaged SGD iterates taken with a constant or cyclical learning rate late in training (stochastic weight averaging, SWA) and improved test accuracy on CIFAR and ImageNet.
They argued that SGD’s iterates lie near the edges of a wide low-loss region and their average nearer its centre, where the loss is flatter.
Averaging is also used in pretraining: Sanyal et al. (2023) found that averaging checkpoints of language models helps more at high learning rates.
Averaging separately trained networks works only when the straight line between them has no loss barrier ([[linear mode connectivity|lmc]]).
This holds for networks fine-tuned from one pretrained model (Neyshabur, Sedghi and Zhang 2020; Wortsman et al. 2022).
It often fails for networks trained from scratch with different minibatch orders, even from the same initialization (Frankle et al. 2020).

## Method

Two elongated Gaussian wells on a bowl, the [[West Basin|@West Basin]] and the [[East Basin|@East Basin]], with a ridge between them.
On this sheet the Hessian at the West floor has eigenvalues about 10 and 45 and at the East floor about 6 and 37, so gradient descent is [[stable|stab]] in both for η below about 0.045.
Every 315 steps a [[cohort|cohort]] of eight [[SGD|sgd]] particles is released on a wall of one basin, alternately.
Each runs η = 0.02 and σ = 2 for 1,600 steps and, from step 121, keeps the uniform running average `θ̄ ← θ̄ + (θ − θ̄)/n`, drawn as a ring.
The figure shows the mean of `L − L*` by age for the particles and for their averages, over all cohorts since η or σ last changed, each measured from the floor of its own basin; the readouts are the last values.
The dashed line joins one particle’s average in each basin, and its midpoint is printed with its loss.

## Caveat

The basins here are close to quadratic, so the averages land close to the minima.
On a non-quadratic loss, the average of constant-step SGD converges to a point at a distance of order η from the minimum, not to the minimum itself (Dieuleveut, Durmus and Bach 2020).
Decaying η, or extrapolating from runs at two step sizes, removes this bias.

## References

- Ruppert, D. (1988). Efficient estimations from a slowly convergent Robbins–Monro process. Technical report 781, Cornell University.
  Iterate averaging for stochastic approximation, found independently of Polyak.
- Polyak, B. T. and Juditsky, A. B. (1992). Acceleration of stochastic approximation by averaging. SIAM Journal on Control and Optimization 30(4).
  Averaged iterates with slowly decreasing steps attain the optimal asymptotic covariance.
- Bach, F. and Moulines, E. (2013). Non-strongly-convex smooth stochastic approximation with convergence rate O(1/n). NeurIPS.
  Constant-step averaged SGD on least squares converges at rate O(1/n).
- Izmailov, P., Podoprikhin, D., Garipov, T., Vetrov, D. and Wilson, A. G. (2018). Averaging weights leads to wider optima and better generalization. UAI.
  Stochastic weight averaging for deep networks.
- Dieuleveut, A., Durmus, A. and Bach, F. (2020). Bridging the gap between constant step size stochastic gradient descent and Markov chains. Annals of Statistics 48(3).
  Constant-step SGD as a Markov chain; its average is biased by O(η) on non-quadratic losses.
- Frankle, J., Dziugaite, G. K., Roy, D. M. and Carbin, M. (2020). Linear mode connectivity and the lottery ticket hypothesis. ICML.
  Runs from one initialization with different minibatch orders are often separated by a loss barrier.
- Neyshabur, B., Sedghi, H. and Zhang, C. (2020). What is being transferred in transfer learning? NeurIPS.
  Networks fine-tuned from one pretrained model stay in one basin.
- Wortsman, M., Ilharco, G., Gadre, S. Y., Roelofs, R., Gontijo-Lopes, R., Morcos, A. S., Namkoong, H., Farhadi, A., Carmon, Y., Kornblith, S. and Schmidt, L. (2022). Model soups: averaging weights of multiple fine-tuned models improves accuracy without increasing inference time. ICML.
  Averaging fine-tuned models that share a basin improves accuracy.
- Sanyal, S., Neerkaje, A., Kaddour, J., Kumar, A. and Sanghavi, S. (2023). Early weight averaging meets high learning rates for LLM pre-training. NeurIPS Workshop on Advancing Neural Network Training (WANT).
  Checkpoint averaging during language-model pretraining helps more at high learning rates.

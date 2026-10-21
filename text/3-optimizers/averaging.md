# Weight averaging

## Subtitle

SGD in two basins, with each particle’s running average drawn as a ring, to ask how much noise averaging removes and when it fails.

## Lead

With a constant [[learning rate|lr]] η, the iterates of [[SGD|sgd]] keep fluctuating around a minimum, and the spread grows with η.
Their running average fluctuates far less, because the noise in successive steps points in different directions and largely cancels.
In stochastic approximation, [[averaging|iteravg]] the iterates provably reaches the best possible asymptotic rate (Polyak and Juditsky 1992).
Stochastic weight averaging carries the idea over to deep networks (Izmailov et al. 2018).
On this plate we can measure the gain, and see what happens when we average across two basins.

## In practice

With a constant or cyclical learning rate, evaluate an average of the late iterates as well as the last one.
The average removes much of the excess loss that gradient noise causes.
Average only within one basin: across a ridge, the average can land on the ridge itself.
Under BatchNorm, recompute the normalization statistics for the averaged weights.

## Figure caption

Mean excess loss L − L* against age, on a log scale, over all cohorts released since η or σ last changed.
The particles are solid and their running averages dashed, each measured from the floor of the basin it is nearer.
The vertical gap between the curves shows how many times lower the average sits.

## Try

1. Compare the ‘L − L*’ readouts → after 1,600 steps a particle is about 0.05 above the floor, its average about 0.0007, some 70 times less.
2. Lower η to 0.006 → the particles’ excess falls about fourfold, while the averages’ stays below 0.001.
   A long average’s error depends on σ²/λ and the step count, not η.
   A smaller η makes each iterate less noisy but more correlated with the last, and in the average the two effects cancel.
3. Raise η to 0.04, close to 2/λ<sub>max</sub> of the [[West Basin|@West Basin]] → the particles’ excess triples and the averages’ rises to about 0.01 once several cohorts have finished.
   Near that limit the factor 2 − ηλ in the Background’s variance approaches zero, so the steep direction swings widely.
4. Find the dashed line joining averages in two basins → its midpoint lies on the ridge, far above both floors.
   This is why separately trained networks need [[linear mode connectivity|lmc]] before they can be averaged.

## Background

On a quadratic, SGD with constant η and gradient noise of variance σ² reaches a [[stationary distribution|stationary]] with variance `ησ²/(λ(2 − ηλ))` along an eigendirection of curvature λ.
Its excess loss, ½λ times that variance, is about ησ²/4 per direction when ηλ is small, and grows with η.
Ruppert (1988) and Polyak and Juditsky (1992) showed that averaging the iterates of stochastic approximation run with slowly decreasing steps attains the optimal asymptotic covariance.
Bach and Moulines (2013) proved an O(1/n) rate for averaged SGD with a constant step on least squares, with n the number of steps.

Izmailov et al. (2018) averaged SGD iterates taken with a constant or cyclical learning rate late in training (stochastic weight averaging, SWA) and improved test accuracy on CIFAR and ImageNet.
They argued that SGD’s iterates lie near the edges of a wide low-loss region and their average nearer its centre, where the loss is flatter.
Averaging is also used in pretraining: Sanyal et al. (2023) found that averaging checkpoints of language models helps more at high learning rates.

Averaging separately trained networks works only when the straight line between them has no loss barrier ([[linear mode connectivity|lmc]]).
This usually holds for networks fine-tuned from one pretrained model (Neyshabur, Sedghi and Zhang 2020; Wortsman et al. 2022).
It often fails for networks trained from scratch with different minibatch orders, even from the same initialization, unless they share the first part of training (Frankle et al. 2020).

## Method

The sheet has two elongated Gaussian wells on a bowl, the [[West Basin|@West Basin]] and the [[East Basin|@East Basin]], with a ridge between them.
On this sheet the Hessian at the West floor has eigenvalues about 10 and 45 and at the East floor about 6 and 37, so gradient descent is [[stable|stab]] in both for η below about 0.045.
Every 315 steps a [[cohort|cohort]] of eight [[SGD|sgd]] particles is released on a wall of one basin, alternately.
Each runs η = 0.02 and σ = 2 for 1,600 steps.
From step 121 it keeps the uniform running average `θ̄ ← θ̄ + (θ − θ̄)/n`, drawn as a ring.
Starting late keeps the descent from the wall out of the average.
The figure shows the mean of `L − L*` by age for the particles and for their averages, over all cohorts released since η or σ last changed.
Each is measured from the floor of whichever basin, West or East, it is currently nearer.
The readouts are the last values.
The dashed line joins one particle’s average in each basin, and its midpoint is printed with its loss.

## Caveat

The basins here are close to quadratic, so the averages land close to the minima.
On a non-quadratic loss, the average of constant-step SGD converges to a point at a distance of order η from the minimum, not to the minimum itself (Dieuleveut, Durmus and Bach 2020).
Intuitively, where one wall rises more gently than the other, the iterates spread further on that side and pull the average with them.
Decaying η, or extrapolating from runs at two step sizes, removes most of this bias.

## At scale

Kaddour (2022) found that averaging the latest checkpoints also speeds up language-model pretraining.
Li et al. (2025) found that merging checkpoints taken at a constant learning rate improves models from millions to more than 100B parameters and predicts the effect of the final learning-rate decay.
Schedule-free methods build the average into the update itself (see <i>The river valley</i>).
Schedule-Free AdamW was the core of a winning entry in the self-tuning track of the AlgoPerf benchmark (Defazio et al. 2024).
In two dimensions two basins are simply separated by a ridge.
In a network, many of the barriers between separately trained solutions come from the [[permutation symmetry|permsym]] of hidden units.
Swapping two hidden units, with their weights, gives the same function at a different point.
Once the units are matched, independently trained wide ResNets on CIFAR-10 can be averaged with no barrier (see <i>Twins and re-basin</i>).

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
- Kaddour, J. (2022). Stop wasting my time! Saving days of ImageNet and BERT training with latest weight averaging. NeurIPS Workshop: Has It Trained Yet? (HITY).
  LAWA: averaging the last few checkpoints saves tens of epochs on ImageNet and RoBERTa pretraining.
- Defazio, A., Yang, X., Mehta, H., Mishchenko, K., Khaled, A. and Cutkosky, A. (2024). The road less scheduled. NeurIPS.
  Schedule-free SGD and AdamW: averaging built into the update, with no learning-rate schedule.
- Li, Y. et al. (2025). Model merging in pre-training of large language models. NeurIPS.
  Merging constant-learning-rate checkpoints improves dense and mixture-of-experts models up to more than 100B parameters and predicts the effect of annealing.

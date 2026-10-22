# Forks in the road

## Subtitle

A particle leaves the top of a dome and splits in two at step k, to ask when its final basin is decided.

## Lead

Suppose we copy a network at training step k and train both copies to the end with different minibatch orders.
Do the two copies end in the same basin?

Frankle et al. (2020) found that the answer depends on k.
Only once k passes a point early in training are the two results [[linearly mode-connected|lmc]].
That means the loss shows no barrier on the straight segment between them.
From then on the network is [[stable to SGD noise|sgdstab]], and Fort et al. (2020) reproduced the transition.

Here the split happens on a dome, and we can watch the connected share grow with k.

## In practice

Forked copies end linearly connected only if they split late enough, so branch, average or rewind after that point.
For Frankle et al.’s larger image classifiers, that point came after 1.5% to 20% of training.
For a new model, fork at a few steps and measure the barrier between the finished copies.

## Figure caption

Loss barrier on the straight line between the two halves of each fork, by the step at which it forked.
The black line is the mean; the dotted line is the threshold of 0.05, and forks below it count as connected.

## Try

1. Watch the readouts → about half the forks at step 0 end connected, over 90% at step 50 and all at step 400.
2. Follow a particle off the [[Dome|@Dome]] → by step 50 it has rolled off the top in one direction.
   By step 100 it is on average about 0.6 from the top.
   So the choice is made near the top, where the gradient is small and noise can tip the particle either way.
3. Set the noise σ to 0.5 and wait about five minutes → about two-thirds connect at step 0.
   That is long enough for some 25 experiments per k.
4. Set σ to 2 → over 90% still connect at step 50, but at step 0 only about half or a little fewer.
   Larger noise makes the first steps of the two halves less alike.
   By step 50 the particle has left the top, so even this noise rarely sends the halves to different wells.

## Background

Frankle et al. (2020) called this test instability analysis.
They measured the error [[barrier|barrier]] on the straight segment between the two copies.
That barrier is the largest error along the segment minus the mean of the two endpoint errors.
A network counts as stable at k if this barrier is below 2%.

Only LeNet on MNIST was stable at initialization.
ResNet-20 and VGG-16 on CIFAR-10 became stable after 3% and 1.5% of training.
ResNet-50 and Inception-v3 on ImageNet became stable after about 20% and 16%.

At scale, the test also explained the lottery ticket hypothesis: that a network contains a sparse subnetwork that trains alone to full accuracy.
Such subnetworks were found by iterative magnitude pruning and then rewound, i.e. reset to an earlier step’s weights and retrained.
They reached full accuracy only when rewound to a step at which they were stable.
For large networks that step is early in training rather than at initialization.

Fort et al. (2020) found a short chaotic phase in the first two to three epochs.
The neural tangent kernel governs how gradient steps change the outputs, and during this phase it changes quickly.
The phase decides the linearly connected basin in which training ends.

Neyshabur, Sedghi and Zhang (2020) found that copies fine-tuned from the same pretrained weights stay in one basin.
Copies trained from random initializations do not.
So pretrained weights behave as if already past the unstable point.

## Method

The sheet is a dome on a gentle bowl.
A Gaussian hill sits at the centre, with four Gaussian wells of different depths around it and four lower ridges between the wells.

Each experiment releases one particle at the [[Dome|@Dome]] with a jitter of 0.003.
The Dome is a local maximum, so the gradient there is zero, and at first only the noise decides which way the particle rolls.
It runs [[SGD|sgd]] with η = 0.004 and σ = 1.

At step k the particle splits: a copy starts at the same point, marked with a cross.
The step k cycles through 0, 10, 25, 50, 100, 200 and 400.
Both copies continue with independent noise until each has taken 1,100 steps.
That independent noise plays the part of a different minibatch order.

The barrier is the largest loss on 61 points of the segment between the two final iterates, minus the mean of their losses.
Frankle et al. used error rather than loss.
A pair counts as connected if the barrier is at most 0.05.

On the seeds measured, pairs in the same basin had barriers below 0.03 and pairs in different basins above 0.85.
So the threshold separates them cleanly.
The readouts give the share of connected pairs among the latest 420 experiments at k = 0, 50 and 400.

## Caveat

Here the outcome is decided while the particle rolls off a single local maximum.
Early training of a network does not start from a maximum.
The two copies of an unstable network end at different points of a high-dimensional set of low loss.
A barrier on the segment between them separates them.
So the plate shows how the test works, not what makes a real network unstable.

## At scale

The measurements above are on image classifiers.
The step at which a language model becomes [[stable to SGD noise|sgdstab]] has not been mapped the same way.

Some training methods for language models depend on that stability all the same:

1. Branch-Train-Merge (Li et al. 2022) branches expert copies from one shared seed model and later averages or ensembles them.
2. DiLoCo (Douillard et al. 2023) lets copies on separate machines train for hundreds of steps on their own before averaging their updates.

Averaging works only if copies split from a model that has already trained for a while stay in one basin.

## References

- Frankle, J., Dziugaite, G. K., Roy, D. M. and Carbin, M. (2020). Linear mode connectivity and the lottery ticket hypothesis. ICML.
  Instability analysis: networks become stable to SGD noise early in training; pruned subnetworks reach full accuracy only when stable.
- Fort, S., Dziugaite, G. K., Paul, M., Kharaghani, S., Roy, D. M. and Ganguli, S. (2020). Deep learning versus kernel learning: an empirical study of loss landscape geometry and the time evolution of the neural tangent kernel. NeurIPS.
  A chaotic phase in the first few epochs decides the final linearly connected basin.
- Neyshabur, B., Sedghi, H. and Zhang, C. (2020). What is being transferred in transfer learning? NeurIPS.
  Models fine-tuned from the same pretrained weights stay in the same basin.
- Li, M., Gururangan, S., Dettmers, T., Lewis, M., Althoff, T., Smith, N. A. and Zettlemoyer, L. (2022). Branch-Train-Merge: embarrassingly parallel training of expert language models. NeurIPS Workshop on Interpolation Regularizers and Beyond (INTERPOLATE).
  Expert language models branched from one seed model, trained apart, then ensembled or averaged.
- Douillard, A., Feng, Q., Rusu, A. A., Chhaparia, R., Donchev, Y., Kuncoro, A., Ranzato, M., Szlam, A. and Shen, J. (2023). DiLoCo: distributed low-communication training of language models. arXiv:2311.08105.
  Workers train copies for hundreds of steps between averaging, matching synchronous training with 500 times less communication.

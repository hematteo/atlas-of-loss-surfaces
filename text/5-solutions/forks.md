# Forks in the road

## Subtitle

A particle leaves the top of a dome and splits in two at step k.

## Lead

Train a network for k steps, copy it, and train both copies to the end with different minibatch order.
Frankle et al. (2020) found the two results [[linearly mode-connected|lmc]] only once k passes a point early in training, when the network has become [[stable to SGD noise|sgdstab]].
Fort et al. (2020) reproduced the transition.

## In practice

Forked copies end linearly connected only if split late enough: after 1.5% to 20% of training for Frankle et al.’s larger image classifiers.
Branch, average or rewind after that point.

## Figure caption

Loss barrier on the straight line between the two halves of each fork, by the step at which it forked. The black line is the mean; the dotted line is the threshold of 0.05.

## Try

1. Watch the readouts → about half the forks at step 0 end connected, over 90% at step 50 and all at step 400.
2. Follow a particle off the [[Dome|@Dome]] → by step 50 it has rolled off the top in one direction; by step 100 it is on average 0.55 from the top.
3. Set σ to 0.5 and wait about five minutes, for some 25 experiments per k → about two-thirds connect at step 0.
4. Set σ to 2 → over 90% still connect at step 50, but fewer than half at step 0: larger noise makes the halves’ first steps less alike.

## Background

Frankle et al. (2020) called this test instability analysis.
They measured the error [[barrier|barrier]] on the straight segment between the two copies: the largest error along it minus the mean of the two endpoint errors.
A network counts as stable at k if this barrier is below 2%.
Only LeNet on MNIST was stable at initialization.
ResNet-20 and VGG-16 on CIFAR-10 became stable after 3% and 1.5% of training, ResNet-50 and Inception-v3 on ImageNet after about 20% and 16%.
The test also explained the lottery ticket hypothesis at scale.
Subnetworks found by iterative magnitude pruning reached full accuracy only when rewound to a step at which they were stable.
For large networks that step is early in training rather than at initialization.

Fort et al. (2020) found a short chaotic phase in the first two to three epochs, during which the neural tangent kernel changes quickly.
This phase decides the linearly connected basin in which training ends.
Neyshabur, Sedghi and Zhang (2020) found that copies fine-tuned from the same pretrained weights stay in one basin, while copies trained from random initializations do not.
All three results are measurements on image classifiers.

## Method

The sheet is a dome: a Gaussian hill at the centre, four Gaussian wells of different depths around it and four lower ridges between the wells, on a gentle bowl.
Each experiment releases one particle at the top, the [[Dome|@Dome]], a local maximum, with a jitter of 0.003.
It runs [[SGD|sgd]] with η = 0.004 and σ = 1.
At step k, cycled through 0, 10, 25, 50, 100, 200 and 400, it splits: a copy starts at the same point, marked with a cross, and both continue with independent noise until each has taken 1,100 steps.
The barrier is the largest loss on 61 points of the segment between the two final iterates, minus the mean of their losses.
A pair counts as connected if the barrier is at most 0.05.
On the seeds measured, pairs in the same basin had barriers below 0.03 and pairs in different basins above 0.9, so the threshold separates them cleanly.
The readouts give the share of connected pairs among the latest 420 experiments at k = 0, 50 and 400.

## Caveat

Here the outcome is decided while the particle rolls off a single local maximum.
Early training of a network does not start from a maximum.
The two copies of an unstable network end at different points of a high-dimensional set of low loss, separated by a barrier on the segment between them.

## References

- Frankle, J., Dziugaite, G. K., Roy, D. M. and Carbin, M. (2020). Linear mode connectivity and the lottery ticket hypothesis. ICML.
  Instability analysis: networks become stable to SGD noise early in training; pruned subnetworks reach full accuracy only when stable.
- Fort, S., Dziugaite, G. K., Paul, M., Kharaghani, S., Roy, D. M. and Ganguli, S. (2020). Deep learning versus kernel learning: an empirical study of loss landscape geometry and the time evolution of the neural tangent kernel. NeurIPS.
  A chaotic phase in the first few epochs decides the final linearly connected basin.
- Neyshabur, B., Sedghi, H. and Zhang, C. (2020). What is being transferred in transfer learning? NeurIPS.
  Models fine-tuned from the same pretrained weights stay in the same basin.

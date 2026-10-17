# Mode connectivity

## Subtitle

A curve with one trained bend finds a low road around a hill between two minima.

## Lead

Two networks trained from different random initializations reach different minima, and the loss on the straight segment between them is high.
Yet a simple curve can usually join them, with the training loss along it close to its value at the ends.
This is [[mode connectivity|modeconn]] (Garipov et al. 2018; Draxler et al. 2018).

## In practice

Low-loss curves between trained networks do not license averaging their weights; that needs a low barrier on the straight segment, as between fine-tunes of one pretrained model.
Check the segment before averaging.

## Figure caption

Above: the loss along the straight segment from A to B (dashed) and along the trained curve. Below: the loss along the straight line from each recent particle’s start to its resting point, blue where it falls all the way, orange where it rises.

## Try

1. Press “Start the curve again” → in about 150 control-point updates, ‘barrier, curve’ falls below a tenth of ‘barrier, straight’: gradient steps push the bend off the hill into the trench.
2. Watch the lower figure → most lines from a particle’s start to its [[rest point|rest]] are blue: the loss falls [[monotonically|mli]] along them.
3. Look at the orange lines → most start inside the trench: the particle follows its curved floor, and the straight line back cuts through the trench wall.

## Background

Freeman and Bruna (2017) proved that for networks with one hidden layer of rectified units, the [[sublevel sets|sublevel]] of the loss become connected as the layer widens, up to a gap that shrinks with width.
Garipov et al. (2018) trained a polygonal chain with one bend, or a quadratic Bézier curve, between two independently trained networks by minimizing the loss averaged over the curve.
For VGG, ResNets and wide ResNets on CIFAR-10 and CIFAR-100, training loss and test error stayed nearly constant along the curve, while the straight segment crossed a large [[barrier|barrier]].
Draxler et al. (2018) found paths with essentially no barrier using the nudged elastic band method.
They proposed that the minima found by SGD are points on one connected low-loss set.
Straight segments between minima are the subject of <i>Forks in the road</i> and <i>Twins and re-basin</i>.

A second straight line runs from the initialization θ₀ to the trained θ<sub>T</sub>.
Goodfellow, Vinyals and Saxe (2015) found that the loss usually falls monotonically along it, which is now called [[monotonic linear interpolation|mli]].
Lucas et al. (2021) found it across many architectures, gave sufficient conditions for it under mean squared error, and produced violations by pushing the weights far from θ₀.
Vlaar and Frankle (2022) found that the shape of this path does not track test accuracy, and that a barrier on it does not mean optimization failed.
Wang et al. (2023) traced the long plateau the path often shows near θ₀ to the last-layer biases.

## Method

Two Gaussian wells, [[Minimum A|@Minimum A]] and [[Minimum B|@Minimum B]], sit at θ₁ ≈ ±0.85 on a gentle bowl, with a hill between them on the straight segment.
A trench, the low road, follows a circular arc through both minima that passes on the far side of the hill.
Inside the wells the trench is faded out, so it joins them without dipping below them.
The green curve is `φ(t) = (1−t)²A + 2t(1−t)C + t²B`.
Its control point C starts at the segment’s midpoint and takes gradient steps of size 0.02 on `E_t L(φ(t))`, t uniform on [0, 1], estimated from 12 stratified samples of t.
Each barrier readout is the largest loss on 101 points of the path minus the larger of L(A) and L(B).
Particles run [[SGD|sgd]] with η = 0.004 and σ = 0.3, and every third [[cohort|cohort]] starts in the trench.
For each distinct run, the line from its start to its rest point counts as monotone if the loss on 61 points never rises more than 0.002 above its lowest earlier value.

## Caveat

The low road was built into this sheet.
In two dimensions, two minima are usually separated by a ridge with no way around it.
In networks the low-loss curves are found by training in millions of dimensions, and their existence has been attributed to overparameterization (Freeman and Bruna 2017; Draxler et al. 2018).

## References

- Goodfellow, I. J., Vinyals, O. and Saxe, A. M. (2015). Qualitatively characterizing neural network optimization problems. ICLR.
  The loss usually falls monotonically on the straight line from initialization to solution.
- Freeman, C. D. and Bruna, J. (2017). Topology and geometry of half-rectified network optimization. ICLR.
  Sublevel sets of one-hidden-layer ReLU networks become connected as width grows; low-loss paths measured with a string method.
- Garipov, T., Izmailov, P., Podoprikhin, D., Vetrov, D. and Wilson, A. G. (2018). Loss surfaces, mode connectivity, and fast ensembling of DNNs. NeurIPS.
  Trains polygonal chains and Bézier curves between independent solutions; loss and error stay nearly constant along them.
- Draxler, F., Veschgini, K., Salmhofer, M. and Hamprecht, F. A. (2018). Essentially no barriers in neural network energy landscape. ICML.
  Near-flat paths between minima of ResNets and DenseNets, found with the nudged elastic band method.
- Lucas, J., Bae, J., Zhang, M. R., Fort, S., Zemel, R. and Grosse, R. (2021). On monotonic linear interpolation of neural network parameters. ICML.
  Monotonic linear interpolation holds widely; violations arise when the weights move far from initialization.
- Vlaar, T. J. and Frankle, J. (2022). What can linear interpolation of neural network loss landscapes tell us? ICML.
  The shape of the interpolation path does not track test accuracy or the success of optimization.
- Wang, X., Wang, A. N., Zhou, M. and Ge, R. (2023). Plateau in monotonic linear interpolation: a “biased” view of loss landscape for deep networks. ICLR.
  The plateau near initialization on the interpolation path comes from the last-layer biases.

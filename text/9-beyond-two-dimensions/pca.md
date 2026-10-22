# Trajectories in PCA

## Subtitle

A random walk and two runs of SGD in 2,000 dimensions, each recorded for 300 steps and drawn on its first two principal components.

## Lead

A training run moves through millions of dimensions, so it is often drawn by [[principal component analysis|pca]] of the recorded parameters (Lorch 2016).
PCA finds the directions in which the recorded iterates vary most, and the plot shows the path along the first two.
Such plots usually look smooth and orderly, with much of the variation in the first two components (Lorch 2016; Li et al. 2018).

Antognini and Sohl-Dickstein (2018) showed that a pure [[random walk|randwalk]] in many dimensions gives the same picture.
Its k-th component follows `cos(kπt/T)` over the T recorded steps.
The first component alone explains `6/π² ≈ 61%` of the variance.
So a smooth arch on the first two components is not, by itself, evidence of structure in the loss.

This plate records three processes in 2,000 dimensions and runs PCA on each.
We can then see which parts of the picture noise alone produces, and where SGD on a quadratic loss departs from it.

## In practice

Before reading a PCA plot of training, compare its [[explained variance|explvar]] with the random walk’s `6/(π²k²)`, and its components with cosines.
On this plate the shapes barely tell descent from noise.
The explained variance separates them better.

## Figure caption

Top: the share of the variance explained by each of the first ten components (dots), against the random walk’s `6/(π²k²)` (dashed), on a log scale.
Bottom: PC1 and PC2 over the 300 steps, scaled so that a pure cosine has amplitude 1, against `cos(πt/T)` and `cos(2πt/T)` (dashed).

## Try

1. Wait a moment while the random walk is recorded → the path is a smooth arch, and PC1 and PC2 explain about 60% and 16%.
   The prediction `6/(π²k²)` gives 60.8% and 15.2%.
   A walk varies mostly slowly, and in 2,000 dimensions each slow mode has a direction of its own, so PCA returns the modes in order.
2. Read the figure → the ten dots sit on the dashed line, and PC1 and PC2 overlap their cosines at 1.000 and 0.998.
   Every step of the walk is independent noise.
   The arch, the cosines and the fast fall of the explained variance all come from summing that noise.
3. Choose SGD starting far from the minimum → the arch turns lopsided, and PC1 explains about 77%, against the walk’s 61%.
   PC1 and PC2 still overlap their cosines at about 0.98 and 0.94.
   The loss falls from about 6.6 to 1.16, still far above its stationary 0.25, so the descent adds a drift that lasts the whole recording.
4. Choose SGD at stationarity → PC1 explains about 56%, and both overlaps are above 0.99, as for the walk.
   Here 1,700 of the 2,000 directions take longer than 300 steps to [[relax|relax]], so within the recording they drift like a random walk.
   They hold most of the variance: ηλ along PC1 is about 0.0015, below the mean of 0.0041.
5. Look at the bowl under that path → its lowest point lies inside the arch, but the plane’s lowest loss is about 0.20.
   The quadratic’s minimum has loss 0, and the iterates stay near 0.25.
   PCA fits the plane to the iterates, and nothing makes it pass through the minimum.
6. Drag SGD’s slowest relaxation down to 20 steps → PC1 falls to about 14% and PC2 to 12%, and the arch breaks up into a ragged loop.
   Every direction now relaxes many times within the recording, so the iterates sample SGD’s [[stationary distribution|stationary]].
   Their variance then spreads more evenly over many components.
7. With the relaxation at 20 steps, choose SGD starting far from the minimum → the path runs straight from Start, then tangles, and PC1 explains about 25%.
   The loss reaches its stationary level in about 45 steps, so descent and diffusion come one after the other.
   PC1 now follows the run, not a cosine: its overlap drops to about 0.6.

## Background

Lorch (2016) introduced PCA plots of training for small networks on CIFAR-10 and MNIST.
In every run that trained well, PC1 changed monotonically.
PC2 rose and then fell, usually turning near the halfway point.
Li et al. (2018) drew optimizer paths on PCA directions over the contours of the loss.
Between 40% and 90% of the variation lay in two components, which they took as evidence that the paths are low-dimensional.

Antognini and Sohl-Dickstein (2018) worked out what a random walk gives.
When the dimension d is much larger than the number of steps T, the walk’s T × T Gram matrix becomes nearly circulant as T grows.
So its eigenvectors are Fourier modes, and for large T the k-th explains `6/(π²k²)` of the variance.
The first two components explain about 80% of it, and the first twelve about 95%.
Projected onto any two components, the path is a [[Lissajous curve|lissajous]].

They also studied a random walk in a quadratic bowl, the Ornstein–Uhlenbeck process, which is SGD with constant noise on a quadratic loss.
When the curvatures spread over many scales, PCA is dominated by the directions of lowest curvature.
Those directions have not relaxed within the recording, so they still look like a random walk.

They then compared real training.
In the middle of training, a linear model on CIFAR-10 and ResNet-50 on ImageNet gave projected paths almost identical to a random walk’s.
The first component held more of the variance, as in a walk with a steady drift.
At the start of training, the linear model’s path was more directed than a walk.

## Method

The plate records one of three processes in `d = 2,000` dimensions for `T = 300` steps, `θ₁ … θ₃₀₀`:

1. A random walk from the origin, `θ ← θ − ησξ` with `ξ ~ N(0, I)`: SGD with the gradient left out.
2. [[SGD|sgd]] on the quadratic `L(θ) = ½ Σ λᵢθᵢ²`, stepping `θ ← θ − η(∇L + σξ)`.
   It starts three times as far from the minimum as the distance at which its noise holds it at stationarity.
3. The same SGD started from a draw of its exact stationary distribution, with variance `ησ²/(λᵢ(2 − ηλᵢ))` in direction i.

The curvatures follow a power law, `ηλᵢ = 1/i` from 1 down to 1/2,000.
The instrument puts a floor of `1/τ` under them, so the slowest direction relaxes in τ steps.
The noise term `ησξ` has length about 1, and all three processes draw the same `ξ`, so only the process differs.

PCA works on the 300 × 300 Gram matrix of the iterates, built as they arrive and then centred.
Subspace iteration on 20 vectors, with a Rayleigh–Ritz step each time, finds its top ten eigenpairs to a residual below 10⁻¹⁰.
The explained variance of component k is its eigenvalue over the trace.
The overlap is `|u·c|/(‖u‖‖c‖)` between the component’s time course u and `c = cos(kπ(t − ½)/T)`.
The work is spread over about 60 frames, at about 2 ms each.

The map draws the path at `(√λ₁u₁(t), √λ₂u₂(t))`, with one scale on both axes so it keeps its shape.
Each component’s sign is chosen to match its cosine.
A stick man replays the projected path, one recorded step per step.

For SGD the sheet is the loss on the plane through the recording’s mean, spanned by PC1 and PC2.
Its heights are shifted and rescaled to the atlas’s usual range, and the readouts give the loss itself.
The walk has no loss, so its sheet is flat.

## Limits

This sheet’s SGD runs on a quadratic, with isotropic noise and a constant learning rate.
In a network the curvature changes along the path, and the noise is larger along the sharp directions (see <i>The shape of the noise</i>).
The recording is also short and narrow: 300 steps in 2,000 dimensions.
The `6/(π²k²)` law needs d much larger than T, which a real network meets easily.

PCA ranks directions by how far the iterates move along them, and that need not be where the gradient points.
On this plate, with the full spectrum, ηλ along PC1 and PC2 stays below 0.01, over a hundred times below the largest.
In networks, Gur-Ari, Roberts and Dyer (2018) found that the gradient soon lies mostly in the span of the Hessian’s top eigenvectors.
Song, Ahn and Yun (2025) then found that the part of the update in that subspace barely lowers the loss.
The loss falls through the remaining directions.

## References

- Lorch, E. (2016). Visualizing deep network training trajectories with PCA. ICML Workshop on Visualization for Deep Learning.
  Introduces PCA plots of training trajectories; PC1 changes monotonically and PC2 rises and falls once.
- Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018). Visualizing the loss landscape of neural nets. NeurIPS.
  Draws optimizer paths on PCA directions over loss contours; two components hold 40% to 90% of the variation.
- Antognini, J. M. and Sohl-Dickstein, J. (2018). PCA of high dimensional random walks with comparison to neural network training. NeurIPS.
  A random walk’s components are cosines explaining `6/(π²k²)`; in a quadratic, PCA is dominated by the flattest directions.
- Gur-Ari, G., Roberts, D. A. and Dyer, E. (2018). Gradient descent happens in a tiny subspace. arXiv:1812.04754.
  The gradient soon lies mostly in the span of the Hessian’s top eigenvectors, about one per class.
- Song, M., Ahn, K. and Yun, C. (2025). Does SGD really happen in tiny subspaces? ICLR.
  Updates projected onto that subspace barely lower the loss; removing them trains about as well.

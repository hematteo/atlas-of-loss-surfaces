# What a slice hides

## Subtitle

A saddle in 4,000 dimensions, cut by three planes, and particles that descend in all 4,000 dimensions.

## Lead

Pictures of a network’s loss surface are [[slices|slice]]: the loss on a line or a plane through parameter space.
A plane is spanned by two chosen directions, and the slice says nothing about the other directions.

Along a random direction, the curvature is a weighted average of the [[Hessian|hessian]]’s eigenvalues, close to their mean `tr(H)/d` (Li et al. 2018).
When most eigenvalues are small and positive, that mean is positive.
So a random slice through a [[saddle|saddle]] with a few directions of negative curvature looks like a bowl (Böttcher and Wheeler 2024).

A slice is often the only picture we have of a loss surface, so this matters.
Its lowest point can look like a minimum while the loss keeps falling along directions the plane leaves out.
This plate cuts one loss in 4,000 dimensions three ways, and shows particles sinking below the lowest point of each slice.

## In practice

Read a bowl-shaped random slice as a statement about the average curvature, not as evidence of a minimum.
To look for ways down, slice along Hessian eigenvectors, the most negative one included, or measure the [[spectrum|spectrum]] itself (Böttcher and Wheeler 2024).
Large language models show the same gap: their basins are broad along random perturbations and sharp along worst-case directions (Chen et al. 2026).

## Figure caption

Top: the Hessian’s 4,000 eigenvalues on a signed log scale, the curvature along each axis of the slice, and their mean `tr(H)/d`.
Bottom: the cohort’s mean loss against step, in all 4,000 dimensions (red) and on the slice (blue); dashed, the slice’s lowest point.

## Try

1. Release a cohort on the random slice → the particles confined to the slice come [[to rest|rest]] in the [[Bowl of Averages|@Bowl of Averages]], at L 1.572.
   The particles that descend in all 4,000 dimensions pass below that after about 90 steps, and reach about 0.02 by step 600.
   The bottom of the bowl, the [[Hidden Saddle|@Hidden Saddle]], is a saddle with 17 directions down, and none of them lies in the plane.
2. Watch where the red particles stand → partway up the slope, where the slice’s loss is about 1.6 and theirs is near 0.
   Their position on the map is a projection, not a point of the plane.
   Most of their starting offset along the plane lies in directions of almost zero curvature, which gradient descent hardly shrinks.
3. Compare the readouts → the curvatures along θ₁ and θ₂ are 0.125 and 0.124, close to `tr(H)/d` = 0.131 ± 0.008.
   The largest eigenvalue is 12.7, and 17 of the 4,000 eigenvalues are negative, down to −0.54.
   A random direction weights all 4,000 eigenvalues about equally, so the 10 outliers and the 17 negative ones are drowned by the bulk.
4. Slice along the top two eigenvectors → the map is again a bowl, now with curvatures 12.7 and 7.46.
   One map unit along θ₁ is now 0.272 instead of 2.72, so the map has zoomed in tenfold to fit the steeper bowl.
   The red particles still pass below its bottom at L 1.572, after about 95 steps.
   The sharpest directions show how fast the loss rises, but not where it falls.
5. Slice along the top and the most negative eigenvectors → the origin becomes a [[saddle|@Saddle]] between two wells at L 1.275.
   The blue particles stop in the wells, and the red ones pass below 1.275 after about 190 steps.
   This slice shows the steepest way down, but only one of 17.
   Its wells are 0.30 deep, out of the 1.57 that the full loss can lose.

## Background

Li et al. (2018) worked out what a random two-dimensional slice can and cannot show.
Its curvatures are weighted averages of the Hessian’s eigenvalues, with random weights.
So a slice that curves down in some direction proves that the full loss does too.
The converse fails: a slice that curves up everywhere only says that the positive eigenvalues outweigh the negative ones on average.

For a random unit vector u, the curvature along u is `uᵀHu = Σᵢ λᵢuᵢ²`.
Each weight `uᵢ²` is about 1/d, so the curvature is close to the mean eigenvalue, `tr(H)/d`.
Its spread shrinks like 1/√d, so in millions of dimensions every random slice sees almost exactly the mean.
Böttcher and Wheeler (2024) found that random projections rarely show saddles as saddles, and proposed slicing along the Hessian’s dominant eigenvectors instead.

The Hessians of trained networks have spectra like this plate’s.
There is a bulk of eigenvalues near zero and a few large outliers (Sagun et al. 2018; Ghorbani, Krishnan and Xiao 2019).
Papyan (2020) tied the outliers to the classes.
Ghorbani et al. found that the large negative eigenvalues present at initialization disappear within the first 1% of training steps.
At the end of training on ImageNet, though, a notable negative part of the spectrum remained.

A line is a slice too.
Along the straight line from initialization to the trained weights, the loss usually falls monotonically (Goodfellow, Vinyals and Saxe 2015).
Lucas et al. (2021) found that this fails when the weights travel far from initialization.
Either way, a line shows the loss along one direction and nothing about the others.

This is why a minimum seen on a slice can keep sinking when more dimensions are added.
Its lowest point is a minimum of the slice only.
In the full space it can be a saddle, and gradient descent leaves it along directions the slice never contained.

## Method

The loss has d = 4,000 parameters and is written in the eigenbasis of its Hessian at the origin:
`L(θ) = L₀ + Σᵢ [½λᵢθᵢ² + (κ/4)θᵢ⁴]`, with κ = 0.25.
The quartic term keeps the loss bounded below.
Each coordinate with `λᵢ < 0` has its lowest loss at `θᵢ = ±√(|λᵢ|/κ)`, which lowers L by `λᵢ²/(4κ)`.
The constant L₀ is the sum of these drops, so that the global minimum is exactly 0.

The spectrum is drawn from the sheet’s seed:

1. 10 outliers between 1.5 and the largest eigenvalue, which lies between 12 and 16.
2. Between 12 and 18 negative eigenvalues, down to between −0.45 and −0.6.
3. A bulk of all the others, drawn from an exponential distribution with mean 0.12 and cut at 1.2.

The origin is then a saddle with as many directions down as there are negative eigenvalues, 17 on the default sheet.
Each sign pattern of the negative coordinates gives a global minimum at L = 0, so there are 2¹⁷ of them.

On the plane `θ = a·u + b·v`, the loss is a polynomial of degree four in a and b with eight coefficients.
The plate computes them once per slice, so the map costs no more than any other sheet.
The random directions are Gaussian vectors scaled to unit length, with v made orthogonal to u.

Each axis of the map is stretched so that the loss along it rises by 1.2 at map distance 1.6.
So every slice fills the sheet, as published slices are scaled to fill their frame.
The readouts give one map unit along each axis in the units of θ.
The relief model is built up from L = 0, so the slab under the slice is the loss the slice hides.

Both optimizers use η = 0.05, and ηλ<sub>max</sub> is about 0.63, below the [[stability threshold|stab]] 2.
Each cohort starts at a point of the plane, nudged off it by `0.01ξ` with `ξ ~ N(0, I)` in all 4,000 coordinates.
The red particles take [[gradient descent|gd]] steps in all 4,000 dimensions.
Each is drawn at its projection onto the plane, but every loss reported for it is the full loss.
The blue particles take gradient descent steps confined to the plane: `(a, b) ← (a, b) − η(uᵀ∇L, vᵀ∇L)`.

The spread printed after `tr(H)/d` is the standard deviation of `uᵀHu` over random unit vectors u.
It is `√(2/(d+2))` times the standard deviation of the eigenvalues.

## Limits

The loss here is separable, so its Hessian has the same eigenvectors everywhere and each coordinate descends on its own.
In a network the Hessian changes along the path of training, and its eigenvectors turn.
The spectrum is also made by hand, and real outliers stand much further above the bulk.

The negative eigenvalues here are fixed, and gradient descent from near the saddle always finds them.
In trained networks they are mostly small, and the evidence above suggests that how many remain depends on the dataset.
So a random slice can hide a saddle, but it does not follow that every bowl in a published slice is one.

At scale the averaging only gets stronger.
With d in the millions, every random slice of the same network sees nearly the same curvature, whatever its two directions.
Filter normalization (Li et al. 2018) rescales the random directions filter by filter, but the slice still sees a weighted average of curvatures.
In large language models, Chen et al. (2026) measured basins that are wide along random perturbations and sharp along worst-case directions.

## References

- Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018). Visualizing the loss landscape of neural nets. NeurIPS.
  Random two-dimensional slices; their curvatures are weighted averages of the Hessian’s eigenvalues, so a convex-looking slice need not be convex.
- Goodfellow, I. J., Vinyals, O. and Saxe, A. M. (2015). Qualitatively characterizing neural network optimization problems. ICLR.
  The loss along the straight line from initialization to solution usually falls monotonically.
- Lucas, J., Bae, J., Zhang, M. R., Fort, S., Zemel, R. and Grosse, R. (2021). On monotonic linear interpolation of neural network parameters. ICML.
  The monotonic fall along the line from initialization is common but fails when the weights travel far.
- Sagun, L., Evci, U., Güney, V. U., Dauphin, Y. and Bottou, L. (2018). Empirical analysis of the Hessian of over-parametrized neural networks. ICLR Workshop Track.
  The Hessian spectrum after training: a bulk near zero and a few outliers.
- Ghorbani, B., Krishnan, S. and Xiao, Y. (2019). An investigation into neural net optimization via Hessian eigenvalue density. ICML.
  Tracks the whole spectrum through training: large negative eigenvalues vanish early, but some negative density remains at the end on ImageNet.
- Papyan, V. (2020). Traces of class/cross-class structure pervade deep learning spectra. JMLR 21(252).
  The Hessian’s outlier eigenvalues are organized by the classes, above a bulk near zero.
- Böttcher, L. and Wheeler, G. (2024). Visualizing high-dimensional loss landscapes with Hessian directions. Journal of Statistical Mechanics: Theory and Experiment 2024, 023401.
  Random projections see the normalized trace of the Hessian and rarely show saddles as saddles; Hessian directions do.
- Chen, H., Wei, Z., Huang, Y., Zhang, Y., Dong, Y. and Zhu, J. (2026). Unveiling the basin-like loss landscape in large language models. ICLR.
  Language models sit in basins that are broad along random perturbations and sharp along worst-case directions.

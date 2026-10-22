# A sheet of your own

## Subtitle

A gentle bowl with a few low features, where we dig wells and raise hills to see how the optimizers respond.

## Lead

Each click digs a well or raises a hill, and the sheet is rebuilt.
Its [[critical points|crit]] are found again and named by the rules of <i>Survey of a loss surface</i>.

A narrow brush makes a sharp well and a wide brush a flat one.
Two wells close together have a [[saddle|saddle]] between them, at the highest point of the lowest path from one to the other.
So we can build each landform on its own and test the optimizers on it.

## Figure caption

Where particles came to rest, by the loss of their minimum.
Columns are tinted by optimizer and stacked.

## Try

1. Dig one spot three times with brush width r = 0.06, and a wide well nearby at r = 0.3 → the narrow one is named Sharp Minimum.
   Its label reads 2/λ ≈ 0.008.
   Three narrow strokes make λ large and 2/λ small.
2. Release a [[cohort|cohort]] into it and raise η past 0.008 → [[SGD|sgd]] bounces across the well.
   SGD here is gradient descent plus noise, so it inherits gradient descent’s limit: [[stable|stab]] at a minimum only if `η < 2/λ_max`.
3. Raise η to about 0.03, near four times 2/λ → SGD leaves the narrow well and comes [[to rest|rest]] in the wide one.
   The same η is stable in the wide well, so the step size has chosen the flat minimum.
4. Smooth the sheet and repeat with a single narrow stroke beside the wide well → the label rises to 2/λ ≈ 0.023.
   At η = 0.03, SGD now stays in the narrow well.
   Here η is only a little above 2/λ: enough to make particles bounce, but not to throw them out.

## Method

Each stroke adds `±0.3 exp(−|θ − c|²/2r²)` at the clicked point c, with r the brush width (0.05 to 0.4).
At the bottom of a new well, the curvature is about 0.3/r² plus that of the surface beneath.
So halving r makes a well about four times as sharp.
A sheet holds up to 45 strokes.
Undo removes the last stroke and Smooth removes them all.

Critical points are found by Newton’s method and classified by the Hessian.
The prominence of a minimum is its depth below its lowest pass.
Among minima with prominence above 0.08, the one whose smaller Hessian eigenvalue is largest is named Sharp Minimum.
Of the rest, the one with the smallest λ<sub>max</sub> is the Flat Basin.

[[SGD|sgd]], the [[heavy ball|hb]] and [[Adam|adam]] are released automatically, or at any point clicked with the release tool.

## Limits

The names are assigned by curvature alone.
Here the Saddle of Hesitation is the saddle whose descending direction is least curved, so the one that particles leave most slowly.
The Col of Symmetry Breaking is the most sharply curved downward of the saddles more than 0.5 away from it.
Neither involves a plateau or a symmetry.

A two-dimensional slice of a network’s loss has limits of its own: a random one almost never contains the directions that dominate the gradient.
Gur-Ari, Roberts and Dyer (2018) found that the gradient soon lies mostly in the span of the Hessian’s top eigenvectors, about one per class.
Even so, most of the decrease in loss comes from the small part of the step outside that span (see <i>The edge of stability</i>).

Sharpness also depends on the parametrization: the same function can sit at minima of very different curvature (see <i>Sharp and flat minima</i>).
So a slice like this one shows the kinds of feature a loss can have, not how sharp a trained network’s minimum is.

## References

- Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018). Visualizing the loss landscape of neural nets. NeurIPS.
  Two-dimensional slices of real loss surfaces, which sheets like this one imitate.
- Gur-Ari, G., Roberts, D. A. and Dyer, E. (2018). Gradient descent happens in a tiny subspace. arXiv:1812.04754.
  After a short time the gradient lies in the span of the top Hessian eigenvectors, about one per class.

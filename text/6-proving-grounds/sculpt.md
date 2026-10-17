# A sheet of your own

## Subtitle

A gentle bowl with a few low features, for you to finish.

## Lead

Each click digs a well or raises a hill, and the sheet is rebuilt: [[critical points|crit]] are found again and named by the rules of <i>Survey of a loss surface</i>.
A narrow brush makes a sharp well and a wide brush a flat one.
Two wells close together have a [[saddle|saddle]] between them.

## Figure caption

Where particles came to rest, by the loss of their minimum. Columns are tinted by optimizer.

## Try

1. Dig one spot three times at r = 0.06, and a wide well nearby at r = 0.3 → the narrow one is named Sharp Minimum, labelled 2/λ ≈ 0.008.
2. Release a [[cohort|cohort]] into it and raise η past 0.008 → [[SGD|sgd]] bounces across the well: gradient descent is [[stable|stab]] at a minimum only if `η < 2/λ_max`.
3. Raise η to about 0.03, near four times 2/λ → SGD leaves the narrow well and comes [[to rest|rest]] in the wide one.
4. Try a single narrow stroke → no η on the slider empties it: it is too shallow.

## Method

Each stroke adds `±0.3 exp(−|θ − c|²/2r²)` at the clicked point c, with r the brush width (0.05 to 0.4); at the bottom of a new well the curvature is about 0.3/r² plus that of the ground beneath.
After each stroke [[critical points|crit]] are found by Newton’s method and classified by the Hessian.
Among minima with prominence above 0.08, the one whose smaller Hessian eigenvalue is largest is named Sharp Minimum, and of the rest the one with the smallest λ<sub>max</sub> is the Flat Basin.
A sheet holds up to 45 strokes; Undo removes the last, Smooth removes all.
[[SGD|sgd]], the [[heavy ball|hb]] and [[Adam|adam]] are released automatically, or wherever you click with the release tool.
The figure is a histogram of the loss at which particles came to rest.

## Caveat

The names are assigned by curvature alone.
On your sheet the Saddle of Hesitation is the saddle whose descending direction is flattest.
The Col of Symmetry Breaking is the one whose descending direction is steepest.
Neither involves a plateau or a symmetry.

## References

- Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018). Visualizing the loss landscape of neural nets. NeurIPS.
  Two-dimensional slices of real loss surfaces, which sheets like this one imitate.

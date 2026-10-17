# Himmelblau’s four minima

## Subtitle

Gradient descent, the heavy ball and Adam race from shared starts to four equally deep minima.

## Lead

Himmelblau’s 1972 test function, `f(u, v) = (u² + v − 11)² + (u + v² − 7)²`, has four global minima with f = 0, one in each quadrant.
They surround a single maximum at (−0.27, −0.92).
Which one a run reaches depends only on where it starts and how the optimizer moves.

## In practice

Equal loss does not mean the same solution.
The optimizer and the step size choose among equally deep minima, and a large η excludes the sharpest.
Compare solutions, not only losses.

## Try

1. Let the races run → in 600 races, the minimum where most of [[Adam|adam]]’s particles came to rest differed from [[gradient descent|gd]]’s in one race in twelve, and the [[heavy ball|hb]]’s in one race in 120.
2. Click the peak → gradient descent’s six particles split, almost always between C and D, which lie along the peak’s direction of fastest descent.
3. Click the peak again and watch Adam’s particles → they usually reach three or four minima (54 of 60 clicks), because Adam’s first steps, of about η·sign(∇L), send each particle diagonally into the quadrant it starts in.
4. Raise η above 0.038, which is 2/λ<sub>max</sub> at D, the sharpest minimum → gradient descent’s count at D stops growing, because particles there oscillate without coming [[to rest|rest]], while A, B and C stay [[stable|stab]].

## Background

Himmelblau (1972) used the function as a test problem in his textbook on nonlinear programming.
It is a standard check that a method can find several minima.
All four are global, so the question on f is not which minimum is best but which one a run reaches.
[[Gradient flow|gflow]] divides the plane into four [[basins of attraction|basin]].
Their boundaries run from the maximum through the four [[saddle points|saddle]], and near them a small change of start changes the minimum reached.

The minima are equally deep but not equally curved: in the units of this sheet λ<sub>max</sub> is 32, 31, 41 and 52 at A, B, C and D.
Gradient descent can converge only to minima with `λ_max < 2/η`, so a large step size excludes the sharpest minima even among minima of equal loss (Wu, Ma and E 2018; see <i>Stability and catapults</i>).
Adam’s update depends on the orientation of the coordinate axes, so its paths, and the basins it effectively sees, differ from those of gradient flow.

Networks have the same property on a far larger scale.
Permuting the h hidden units of a layer leaves the function unchanged, so every minimum has up to h! exact copies (see <i>Twins and re-basin</i>).

## Method

The window is u ∈ [−5.76, 5.76], v ∈ [−3.6, 3.6], with A = 1.8, H = 60 and η = 0.02.
The sheet has nine [[critical points|crit]]: the minima A (3, 2), B (−2.81, 3.13), C (3.58, −1.85) and D (−3.78, −3.28); four saddles with f = 13.3, 67.7, 104.0 and 178.3; and the maximum, f = 181.6.
The Hessian eigenvalues at the maximum are −1.09 and −0.39.
Races start at random points on high ground, one every 900 steps.
A particle retires when it comes to rest or after 1,600 steps.
The figure shows, for each optimizer, how its particles that came to rest divide among the four minima, counted over all races since the plate opened; the readouts give the counts.
Particles that leave the sheet or are still moving at 1,600 steps are not counted.

## Caveat

B and D lie 0.47 and 0.32 from the top and bottom edges of the window.
The heavy ball, which gathers speed on the long descent, can overshoot them and leave the sheet.
This happens to 1% of its particles from random starts (47 of 3,600 in 600 races) and to 28% of those released at the peak.
On f itself it would turn back and settle.

## At scale

In networks the equally deep minima are not isolated wells.
Minima of independently trained networks are joined by curves of low loss (see <i>Mode connectivity</i>), and many become linearly connected once their hidden units are matched (see <i>Twins and re-basin</i>).
The rule that a large η excludes the sharpest minima also works differently there, because full-batch training raises λ<sub>max</sub> to about 2/η and holds it there while the loss keeps falling (see <i>The edge of stability</i>).

## References

- Himmelblau, D. M. (1972). Applied Nonlinear Programming. McGraw-Hill.
  Introduces the function as a test problem with four minima.
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS.
  Among minima of equal loss, gradient descent can converge only to those with λ<sub>max</sub> &lt; 2/η.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
  Definitions, usual domains and minima of the standard test functions.

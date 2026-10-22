# Himmelblau’s four minima

## Subtitle

Gradient descent, the heavy ball and Adam race from shared starts to four equally deep minima, to ask what decides which one each reaches.

## Lead

Himmelblau’s 1972 test function is `f(u, v) = (u² + v − 11)² + (u + v² − 7)²`.
It is a sum of squares, so f = 0 is as low as it can go, reached where both squares vanish.
That happens at four points, one in each quadrant, so f has four global minima with f = 0.
They surround a single maximum, the peak, at (−0.27, −0.92).

Which minimum a run reaches depends only on where it starts and how the optimizer moves.
This plate shows three optimizers making that choice.

## In practice

Equal loss does not mean the same solution.
The optimizer and the step size choose among equally deep minima, and a large η excludes the sharpest.
So compare where runs end, as well as how low.

## Try

1. Let the races run → in 600 races, the minimum where most of [[Adam|adam]]’s particles came to rest differed from [[gradient descent|gd]]’s in one race in twelve.
   For the [[heavy ball|hb]] it differed in one race in 120.
2. Click the peak → gradient descent’s six particles split, almost always between C and D, which lie along the peak’s direction of fastest descent.
   Near the peak, small offsets grow fastest along the direction of most negative curvature.
3. Click the peak again and watch Adam’s particles → they usually reach three or four minima (54 of 60 clicks).
   Adam’s first steps are about η·sign(∇L), so each particle moves diagonally into the quadrant it starts in.
   A sign step has full size however small the gradient, so slightly separated particles part at once.
4. Raise η above 0.038 → gradient descent’s count at D stops growing, while A, B and C stay [[stable|stab]].
   The value 0.038 is 2/λ<sub>max</sub> at D, the sharpest minimum.
   Near D, each step multiplies the offset along its steepest direction by 1 − ηλ<sub>max</sub>.
   Above 0.038 this factor is below −1, so particles at D oscillate without coming [[to rest|rest]].

## Background

Himmelblau used it as a test problem in his textbook on nonlinear programming.
It is a standard check that a method can find several minima.
With all four global, the question is which one a run reaches, rather than which is best.

That question is answered by the four [[basins of attraction|basin]] of [[gradient flow|gflow]], one per minimum.
Their boundaries run from the maximum through the four [[saddle points|saddle]].
Near a boundary, a small change of start changes the minimum reached.
All four boundaries meet at the peak, which is why a release there splits.
Adam’s update depends on the orientation of the coordinate axes, so its paths, and the basins it effectively sees, differ from those of gradient flow.

The minima are equally deep but not equally curved.
In the units of this sheet, λ<sub>max</sub> is 32, 31, 41 and 52 at A, B, C and D.
Gradient descent can converge only to minima with `λ_max < 2/η` (Wu, Ma and E 2018; see <i>Stability and catapults</i>).

Networks have the same property on a far larger scale.
Permuting the h hidden units of a layer, together with their incoming and outgoing weights, leaves the function unchanged.
So every minimum has up to h! exact copies (see <i>Twins and re-basin</i>).

## Method

The window is u ∈ [−5.76, 5.76], v ∈ [−3.6, 3.6], with A = 1.8, H = 60 and η = 0.02.
The sheet has nine [[critical points|crit]].
The minima are A (3, 2), B (−2.81, 3.13), C (3.58, −1.85) and D (−3.78, −3.28).
The four saddles have f = 13.3, 67.7, 104.0 and 178.3, and the maximum has f = 181.6.
The Hessian eigenvalues at the maximum are −1.09 and −0.39.

Races start every 900 steps, and particles retire after 1,600.
Particles that leave the sheet or are still moving when they retire are not counted.

## Limits

B and D lie 0.47 and 0.32 from the top and bottom edges of the window.
The heavy ball, which gathers speed on the long descent, can overshoot them and leave the sheet.
This happens to 1% of its particles from random starts (47 of 3,600 in 600 races) and to 28% of those released at the peak.
On f itself it would turn back and settle, so its counts at B and D here may be slightly low.

On this sheet the four minima are isolated wells, but in networks equally deep minima are not.
Minima of independently trained networks are joined by curves of low loss (see <i>Mode connectivity</i>).
Many become [[linearly connected|lmc]] once their hidden units are matched (see <i>Twins and re-basin</i>).

The rule that a large η excludes the sharpest minima also works differently there.
Full-batch training raises λ<sub>max</sub> to about 2/η and holds it there, so the final sharpness mostly records η (see <i>The edge of stability</i>).

## References

- Himmelblau, D. M. (1972). Applied Nonlinear Programming. McGraw-Hill.
  Introduces the function as a test problem with four minima.
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS.
  Among minima of equal loss, gradient descent can converge only to those with λ<sub>max</sub> &lt; 2/η.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
  Definitions, usual domains and minima of the standard test functions.

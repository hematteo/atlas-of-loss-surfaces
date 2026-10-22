# Rosenbrock’s valley

## Subtitle

Gradient descent, the heavy ball and Adam race along a curved, ill-conditioned valley floor from the same starts, to see what slows each one down.

## Lead

A valley is [[ill-conditioned|cond]] when its walls are far steeper than its floor.
So a step size that is safe across the valley is slow along it.

Rosenbrock (1960) built `f(u, v) = (1 − u)² + 100(v − u²)²` to test minimization methods.
It is still the standard example of a curved, ill-conditioned valley.
The global minimum, f(1, 1) = 0, lies at the end of a parabolic valley with a nearly flat floor.
The condition number κ of the [[Hessian|hessian]] is the ratio of the curvature across the valley to the curvature along it.
At the minimum, κ ≈ 2,500.

This plate lets us watch each optimizer reach the floor and then follow it.

## In practice

A diagonal [[preconditioner|precond]] such as Adam’s rescales each coordinate separately.
So how much it helps depends on how well a valley lines up with the coordinate axes.
And no fixed linear change of coordinates straightens a curved valley.

## Try

1. Watch the race from the classic start (−1.2, 1) → [[gradient descent|gd]] reaches the floor within about 10 steps.
   [[Adam|adam]] reaches it within about 30, and the [[heavy ball|hb]], which overshoots it once, within about 40.
2. Wait → the heavy ball comes [[to rest|rest]] by about step 900, and Adam between about steps 1,000 and 2,700.
   Following the floor is the slow part.
3. Watch gradient descent → it does not come to rest within the 3,000-step race.
   The curvature along the floor is λ<sub>min</sub>.
   Near the minimum, each step removes only ηλ<sub>min</sub> ≈ 0.06% of the remaining distance along the floor.
   This is the condition number at work: the steep walls cap η far below what the floor needs.
4. Raise η to 0.006 → gradient descent stops near (0.84, 0.70) and bounces across the valley.
   This η is above the [[stability threshold|stab]] 2/λ<sub>max</sub> ≈ 0.0043 at the minimum.
   It stops there because the curvature across the valley has grown to about 2/η.

## Background

Rosenbrock (1960) introduced the function to test his method of rotating coordinates, a search that turns its directions to follow a valley.
Moré, Garbow and Hillstrom (1981) made it the first problem of their test set, started from (−1.2, 1).

Reaching the floor is easy.
Following it is hard, because the floor bends along the parabola v = u².
So no fixed linear change of coordinates straightens it.
Lining the floor up with an axis at one point leaves it askew farther along.

Near the minimum f is close to a quadratic whose Hessian has eigenvalues 1,001.6 and 0.40, so κ = 2,508.
Polyak (1964) proved the heavy ball’s rate near a minimum.
With tuned η and β, it shrinks the error by a factor of about (√κ − 1)/(√κ + 1) per step.
Gradient descent with its best fixed step shrinks it by (κ − 1)/(κ + 1).

For κ = 2,508 these factors are 0.961 and 0.9992.
So the heavy ball shrinks the error in about √κ steps by as much as gradient descent does in about κ steps.
The tuned β is 0.92, close to the β = 0.9 used here.

Adam divides each coordinate’s step by a running root mean square of that coordinate’s recent gradients.
This preconditioner is diagonal, so it removes ill-conditioning only when the valley’s long axis lies along a coordinate axis (see <i>Adam, sign descent and the axes</i>).
At the minimum the floor runs at 63° to the u axis, along neither axis, so there Adam’s rescaling cannot fully remove the ill-conditioning.

## Method

The window is u ∈ [−2, 2], v ∈ [−0.25, 2.25], with A = 1.8 and H = 6.
At the minimum the Hessian of L has eigenvalues λ<sub>max</sub> = 469 and λ<sub>min</sub> = 0.19.
These are the eigenvalues of f, rescaled by the cap and by the sheet’s units.

The step size is η = 0.003 = 1.4/λ<sub>max</sub>.
This lies inside the [[stability threshold|stab]] of gradient descent (2/λ<sub>max</sub>) and of the heavy ball (2(1 + β)/λ<sub>max</sub>).

The first four races start at (−1.2, 1), (1.5, 2.2), (−1.6, 2) and (0.4, −0.2).
Later races start at random points of high loss, one every 3,100 steps.
A particle retires when it comes to rest or after 3,000 steps.

The figure plots log₁₀(L − L*) against step, averaged over each optimizer’s particles still moving.
A line ends when all of them have come to rest.
The readouts give the lowest L − L* each optimizer reached in the latest race.

## Caveat

The cap slows descent on the walls.
At the classic start f = 24.2, and the gradient of L there is 0.012 times the gradient of f, against 0.3 near the minimum.
This slows gradient descent and the heavy ball, whose steps scale with the gradient, more than Adam, whose step does not.
Comparisons run on f itself spend relatively fewer steps on the walls, so the step counts here apply only to this sheet.

## At scale

In more dimensions the valley is not the only trap.
The n-dimensional form is a sum of n − 1 such terms.
From n = 4 on, it has a second local minimum near (−1, 1, …, 1), with f between 3.7 and 4.0.
Kok and Sandrock (2009) found only these two minima up to n = 100, but many saddles.

The heavy ball’s √κ speed-up also assumes exact gradients (see <i>Momentum</i>).
In a network the curvature is not fixed either: full-batch training drives λ<sub>max</sub> up to about 2/η (see <i>The edge of stability</i>).

## References

- Rosenbrock, H. H. (1960). An automatic method for finding the greatest or least value of a function. The Computer Journal 3(3).
  Introduces the function, as a test for a search that rotates its directions to follow a valley.
- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5).
  Introduces the heavy ball and proves its rate (√κ − 1)/(√κ + 1) near a minimum.
- Moré, J. J., Garbow, B. S. and Hillstrom, K. E. (1981). Testing unconstrained optimization software. ACM Transactions on Mathematical Software 7(1).
  Rosenbrock’s function, started from (−1.2, 1), as the first problem of a standard test set.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
  Definitions, usual domains and minima of the standard test functions.
- Kok, S. and Sandrock, C. (2009). Locating and characterizing the stationary points of the extended Rosenbrock function. Evolutionary Computation 17(3).
  In up to 100 dimensions, two local minimizers and many saddle points.

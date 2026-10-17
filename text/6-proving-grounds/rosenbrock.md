# Rosenbrock’s valley

## Subtitle

Gradient descent, the heavy ball and Adam race along the valley floor from the same starts.

## Lead

Rosenbrock (1960) built `f(u, v) = (1 − u)² + 100(v − u²)²` to test minimization methods.
It is still the standard example of a curved, [[ill-conditioned|cond]] valley.
The global minimum, f(1, 1) = 0, lies at the end of a parabolic valley with a nearly flat floor.
At the minimum the [[Hessian|hessian]] has condition number κ ≈ 2,500.

## In practice

How much a diagonal [[preconditioner|precond]] such as Adam’s helps depends on how well a valley lines up with the coordinate axes.
And no fixed linear change of coordinates straightens a curved valley.

## Try

1. Watch the race from the classic start (−1.2, 1) → [[gradient descent|gd]] reaches the floor within about 10 steps, [[Adam|adam]] within about 30, and the [[heavy ball|hb]], which overshoots it once, within about 40.
2. Wait → the heavy ball comes [[to rest|rest]] by about step 900, and Adam between about steps 1,000 and 2,700.
3. Watch gradient descent → it does not come to rest within the 3,000-step race: near the minimum each step removes only ηλ<sub>min</sub> ≈ 0.06% of the remaining distance along the floor, where λ<sub>min</sub> is the curvature along it.
4. Raise η to 0.006, above the [[stability threshold|stab]] 2/λ<sub>max</sub> ≈ 0.0043 at the minimum → gradient descent stops near (0.84, 0.70) and bounces across the valley, because there the curvature across the valley has grown to about 2/η.

## Background

Rosenbrock (1960) introduced the function to test his method of rotating coordinates, a search that turns its directions to follow a valley.
Moré, Garbow and Hillstrom (1981) made it the first problem of their test set, started from (−1.2, 1).
Reaching the floor is easy.
Following it is hard, because the floor bends along the parabola v = u², so no fixed linear change of coordinates straightens it.

Near the minimum f is close to a quadratic whose Hessian has eigenvalues 1,001.6 and 0.40, so κ = 2,508.
Polyak (1964) proved that near a minimum the heavy ball with tuned η and β shrinks the error by a factor of about (√κ − 1)/(√κ + 1) per step.
Gradient descent with its best fixed step shrinks it by (κ − 1)/(κ + 1).
For κ = 2,508 these factors are 0.961 and 0.9992.
The tuned β is 0.92, close to the β = 0.9 used here.

Adam divides each coordinate’s step by a running root mean square of that coordinate’s recent gradients.
This preconditioner is diagonal, so it removes ill-conditioning only when the valley’s long axis lies along a coordinate axis (see <i>Adam, sign descent and the axes</i>).
At the minimum the floor runs at 63° to the u axis.

## Method

The window is u ∈ [−2, 2], v ∈ [−0.25, 2.25], with A = 1.8 and H = 6.
At the minimum the Hessian of L has eigenvalues λ<sub>max</sub> = 469 and λ<sub>min</sub> = 0.19.
η = 0.003 = 1.4/λ<sub>max</sub>, inside the [[stability threshold|stab]] of gradient descent (2/λ<sub>max</sub>) and of the heavy ball (2(1 + β)/λ<sub>max</sub>).
The first four races start at (−1.2, 1), (1.5, 2.2), (−1.6, 2) and (0.4, −0.2), later ones at random points on high ground, one every 3,100 steps.
A particle retires when it comes to rest or after 3,000 steps.
The figure plots log₁₀(L − L*) against step, averaged over each optimizer’s particles still moving; a line ends when all of them have come to rest.
The readouts give the lowest L − L* each optimizer reached in the latest race.

## Caveat

The cap slows descent on the walls.
At the classic start f = 24.2, and the gradient of L there is 0.012 times the gradient of f, against 0.3 near the minimum.
Comparisons run on f itself spend relatively fewer steps on the walls, so the step counts here apply only to this sheet.

## At scale

In more dimensions the valley is not the only trap.
The n-dimensional form, a sum of n − 1 such terms, has a second local minimum near (−1, 1, …, 1) from n = 4 on, with f between 3.7 and 4.0.
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

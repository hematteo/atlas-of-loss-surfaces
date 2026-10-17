# Newton’s method and saddles

## Subtitle

Newton, saddle-free Newton and gradient descent start from the same points on three hills and three hollows.

## Lead

Newton’s method steps to the stationary point of the local quadratic model, `θ ← θ − H⁻¹∇L`.
It converges to any nondegenerate [[critical point|crit]], so [[saddles|saddle]] and maxima attract it as well as minima (Nocedal and Wright 2006).
Dauphin et al. (2014) proposed [[saddle-free Newton|sfn]], which uses |H| and is repelled by saddles.

## In practice

Do not take raw Newton steps on a non-convex loss: they are drawn to saddles and maxima.
Use a positive-semidefinite curvature model, such as Gauss–Newton or |H|, or a trust region.

## Figure caption

The kind of critical point at which each optimizer’s particles came to rest, as shares of its rings. Particles that never came to rest are not counted.

## Try

1. Leave α at 0.1 → almost all Newton rings are at saddles (114 of 118 in the first minute on this seed).
2. Compare saddle-free Newton and [[gradient descent|gd]] → all their rings are at minima: along negative curvature the Newton step moves toward the critical point, and |H| reverses that component.
3. Watch Newton’s particles → on this seed about two in three never come to rest.
4. Raise α to 1 → Newton’s rings spread over minima, saddles and summits: a full step can jump past the nearest critical point into another’s basin of attraction.

## Background

Newton’s method solves `H s = −∇L` and steps to θ + s.
Near a critical point with nonsingular Hessian, full steps converge quadratically, whatever the signs of the eigenvalues.
In the eigenbasis of H the step along eigenvector i is `−g_i/λ_i`; when λ<sub>i</sub> &lt; 0 it moves toward the critical point, which is uphill.
For minimization the method is therefore used with a modified Hessian or a trust region that keeps the model convex (Nocedal and Wright 2006, chapters 3 and 4).
For deep networks, Martens (2010) used a Hessian-free method built on the Gauss–Newton matrix, which is positive semidefinite.

Dauphin et al. (2014) argued, from results on random Gaussian fields and from experiments, that in high dimensions most critical points of high loss are saddles, and that their neighbourhoods slow down first-order methods.
They proposed the saddle-free Newton method: replace H by |H|, the matrix with the same eigenvectors and the absolute values of the eigenvalues.
Each direction is rescaled by 1/|λ<sub>i</sub>| and the step always descends.
Using a Krylov-subspace approximation, they reported faster escape from saddles than SGD in deep and recurrent networks.
Gradient descent converges to a strict saddle only from a set of starting points of measure zero (Lee et al. 2016).
It can still take exponentially long to pass a sequence of saddles (Du et al. 2017).

## Method

The sheet is a bowl with three Gaussian hills, three Gaussian hollows and a faint texture.
Its critical points are found by Newton’s method from a grid and classified by the signs of the Hessian’s eigenvalues.
Newton and saddle-free Newton take damped steps `θ ← θ − αH⁻¹∇L` (|H| for saddle-free Newton), with the Hessian from finite differences, no noise, and each step capped at length 0.02.
Where |det H| &lt; 10⁻⁹ they take a small gradient step instead.
Saddle-free Newton floors each |λ<sub>i</sub>| at 0.5.
Gradient descent uses η = 0.004.
A Newton particle can come [[to rest|rest]] at any critical point, the others only at a minimum.
The kind of point is read from the Hessian at the particle’s 60-step average position.
Particles that never come to rest are retired after 2475 steps without a ring.
The readouts count Newton’s rings by kind; the figure shows the shares for all three optimizers.

## Caveat

Where det H = 0 the Newton step is undefined, and near such a curve it is very long.
With the cap at 0.02, Newton particles near it chatter back and forth across the curve until they are retired.
Saddle-free Newton avoids this only through its floor on |λ<sub>i</sub>|.

## References

- Nocedal, J. and Wright, S. J. (2006). Numerical Optimization, 2nd edition, chapters 3 and 4. Springer.
  Newton’s method, its quadratic convergence, Hessian modification and trust regions.
- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS.
  Argues that high-loss critical points are mostly saddles; proposes saddle-free Newton, using |H|.
- Martens, J. (2010). Deep learning via Hessian-free optimization. ICML.
  Trains deep autoencoders with a truncated-Newton method that uses the positive semidefinite Gauss–Newton matrix.
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49.
  From random initialization, gradient descent converges to a strict saddle with probability zero.
- Du, S. S., Jin, C., Lee, J. D., Jordan, M. I., Singh, A. and Póczos, B. (2017). Gradient descent can take exponential time to escape saddle points. NeurIPS.
  A function on which gradient descent needs exponential time to pass a sequence of saddles.

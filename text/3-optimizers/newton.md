# Newton’s method and saddles

## Subtitle

Newton, saddle-free Newton and gradient descent start from the same points on three hills and three hollows.

## Lead

[[Newton’s method|newton]] steps to the stationary point of the local quadratic model, `θ ← θ − H⁻¹∇L`, where H is the [[Hessian|hessian]].
From close enough, it converges to any nondegenerate [[critical point|crit]], so [[saddles|saddle]] and maxima attract it as well as minima (Nocedal and Wright 2006).
Dauphin et al. (2014) proposed [[saddle-free Newton|sfn]], which uses |H|, the Hessian with each eigenvalue replaced by its absolute value, and is repelled by saddles.

## In practice

Do not take raw Newton steps on a non-convex loss: they are drawn to saddles and maxima.
Use a positive-semidefinite curvature model, such as Gauss–Newton or |H|, or a trust region.

## Figure caption

The kind of critical point at which each optimizer’s particles came to rest, as shares of its rings. Particles that never came to rest are not counted.

## Try

1. Leave the step size α at 0.1 → almost all Newton rings are at saddles (114 of 120 in the first minute on this seed).
2. Compare saddle-free Newton and [[gradient descent|gd]] → all their particles come to rest at minima, the only points where they can rest: along negative curvature the Newton step moves toward the critical point, and |H| reverses that component.
3. Watch Newton’s particles → on this seed about two in three never come to rest.
4. Raise α to 1 → saddles still take most of Newton’s rings, and the shares shift only a little toward minima and summits (over four minutes on this seed, about 27% at minima, 60% at saddles and 13% at summits, against 20%, 70% and 10% at α = 0.1).
   Because steps are capped at 0.02, the two step sizes differ only where the Newton step is shorter than 0.2, close to a critical point.

## Background

Newton’s method solves `H s = −∇L` and steps to θ + s.
Near a critical point with nonsingular Hessian, full steps converge quadratically, whatever the signs of the eigenvalues.
In the eigenbasis of H the step along eigenvector i is `−g_i/λ_i`.
When λ<sub>i</sub> &lt; 0 it moves toward the critical point, which is uphill.
For minimization the method is therefore used with a modified Hessian that keeps the model convex, or with a trust region that bounds the step (Nocedal and Wright 2006, chapters 3 and 4).
For deep networks, Martens (2010) used a Hessian-free method built on the Gauss–Newton matrix, which is positive semidefinite.

Dauphin et al. (2014) argued, from results on random Gaussian fields and from experiments, that in high dimensions most critical points of high loss are saddles, and that their neighbourhoods slow down first-order methods.
They proposed the saddle-free Newton method: replace H by |H|, the matrix with the same eigenvectors and the absolute values of the eigenvalues.
Each direction is rescaled by 1/|λ<sub>i</sub>| and the step always descends.
Using a Krylov-subspace approximation, they reported faster escape from saddles than SGD in deep and recurrent networks.
Gradient descent with a small enough step converges to a [[strict saddle|strictsaddle]] only from a set of starting points of measure zero (Lee et al. 2016).
It can still take exponentially long to pass a sequence of saddles (Du et al. 2017).

## Method

The sheet is a bowl with three Gaussian hills, three Gaussian hollows and a faint texture.
Its critical points are found by Newton’s method from a grid and classified by the signs of the Hessian’s eigenvalues.
Newton and saddle-free Newton take damped steps `θ ← θ − αH⁻¹∇L` (|H| for saddle-free Newton), with the Hessian from finite differences, no noise, and each step capped at length 0.02.
Where |det H| &lt; 10⁻⁹ they take a small gradient step instead.
Saddle-free Newton floors each |λ<sub>i</sub>| at 0.5.
Gradient descent uses η = 0.004.
A Newton particle can come [[to rest|rest]] at any critical point, the others only at a minimum.
The kind of point is read from the Hessian at the particle’s position averaged exponentially over about its last 60 steps.
Particles that never come to rest are retired after 2475 steps without a ring.
The readouts count Newton’s rings by kind; the figure shows the shares for all three optimizers.
The counts restart, and particles in flight are retired, whenever α or η changes.

## Caveat

Where det H = 0 the Newton step is undefined, and near such a curve it is very long.
With the cap at 0.02, Newton particles near it chatter back and forth across the curve until they are retired.
Saddle-free Newton avoids this only through its floor on |λ<sub>i</sub>|.

## At scale

A network with millions of weights has a Hessian with millions of rows, which no one forms, let alone inverts.
Its spectrum is mostly a bulk near zero with a few large outliers (see <i>Survey of a loss surface</i>).
At that scale, second-order methods use positive-semidefinite or clipped approximations to the curvature, layer by layer or diagonal, as [[preconditioners|precond]].
Examples are K-FAC (Martens and Grosse 2015), Shampoo (Gupta, Koren and Singer 2018) and Sophia (Liu et al. 2024).
Escaping saddles is then left to gradient noise, as for SGD (see <i>Saddle points</i>).

## References

- Nocedal, J. and Wright, S. J. (2006). Numerical Optimization, 2nd edition, chapters 3 and 4. Springer.
  Newton’s method, its quadratic convergence, Hessian modification and trust regions.
- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS.
  Argues that high-loss critical points are mostly saddles; proposes saddle-free Newton, using |H|.
- Martens, J. (2010). Deep learning via Hessian-free optimization. ICML.
  Trains deep autoencoders with a truncated-Newton method that uses the positive semidefinite Gauss–Newton matrix.
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49.
  From random initialization, gradient descent converges to a strict saddle with probability zero.
- Du, S. S., Jin, C., Lee, J. D., Jordan, M. I., Póczos, B. and Singh, A. (2017). Gradient descent can take exponential time to escape saddle points. NeurIPS.
  A function on which gradient descent needs exponential time to pass a sequence of saddles.
- Martens, J. and Grosse, R. (2015). Optimizing neural networks with Kronecker-factored approximate curvature. ICML.
  K-FAC: approximates each layer’s block of the Fisher matrix by a Kronecker product of two small matrices.
- Gupta, V., Koren, T. and Singer, Y. (2018). Shampoo: preconditioned stochastic tensor optimization. ICML.
  A preconditioner with one matrix per side of each weight matrix, tractable at network scale.
- Liu, H., Li, Z., Hall, D., Liang, P. and Ma, T. (2024). Sophia: a scalable stochastic second-order optimizer for language model pre-training. ICLR.
  A clipped diagonal-curvature preconditioner for language-model pretraining.

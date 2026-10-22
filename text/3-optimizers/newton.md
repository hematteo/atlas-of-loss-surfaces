# Newton’s method and saddles

## Subtitle

Newton, saddle-free Newton and gradient descent start from the same points on three hills and three hollows, to ask which critical points draw each one.

## Lead

[[Newton’s method|newton]] fits a quadratic model to the loss and steps to that model’s stationary point.
With H the [[Hessian|hessian]] of the loss, the step is `θ ← θ − H⁻¹∇L`.

That stationary point may be a minimum, a maximum or a saddle, and Newton’s method does not ask which.
So from close enough it converges to any nondegenerate [[critical point|crit]].
[[Saddles|saddle]] and maxima attract it as well as minima (Nocedal and Wright 2006).

Dauphin et al. (2014) proposed [[saddle-free Newton|sfn]], which is repelled by saddles.
It uses |H|, the Hessian with each eigenvalue replaced by its absolute value.
On this plate we can count how often each method ends at a saddle.

## In practice

Do not take raw Newton steps on a non-convex loss: they are drawn to saddles and maxima.
Use a positive-semidefinite curvature model, such as Gauss–Newton or |H|, or a trust region.
With no negative curvature in the model, its stationary point is a minimum, so the step descends.

## Figure caption

The kind of critical point at which each optimizer’s particles came to rest, as shares of its rings.
Particles that never came to rest are not counted.

## Try

1. Leave the step size α at 0.1 → Newton’s rings fall about evenly on minima, saddles and summits.
   On this seed, over the first 10,800 steps (four minutes at the default speed), 82 are at minima, 87 at saddles and 78 at summits.
   So two rings in three are at points that are not minima.
   This is the attraction described in the Lead.
2. Compare saddle-free Newton and [[gradient descent|gd]] → all their particles come to rest at minima.
   Minima are the only points where these two methods can rest.
   Along negative curvature the Newton step moves toward the critical point, and |H| reverses that component.
3. Watch Newton’s particles → on this seed about seven in ten never come to rest.
   Some of them chatter near a curve where det H = 0 (see Limits).
4. Raise α to 1 → the saddles’ share falls by about a third, mostly in favour of minima.
   Over the same 10,800 steps on this seed, 43% are at minima, 22% at saddles and 35% at summits, against 33%, 35% and 32% at α = 0.1.
   Steps are capped at 0.02, so the two step sizes differ only where the Newton step is shorter than 0.2.
   That happens close to a critical point, so α changes mostly the last stretch of each approach.

## Background

From close enough, full Newton steps converge quadratically, whatever the signs of the eigenvalues.
In the eigenbasis of H, the step along eigenvector i is `−g_i/λ_i`.
On a quadratic, g<sub>i</sub> is λ<sub>i</sub> times the distance to the critical point along that eigenvector.
So this step cancels the distance, whatever the sign of λ<sub>i</sub>.
When λ<sub>i</sub> &lt; 0 it moves toward the critical point, which is uphill.

So for minimization the method is used with a safeguard (Nocedal and Wright, chapters 3 and 4).
Either a modified Hessian keeps the model convex, or a trust region bounds the step.
For deep networks, Martens (2010) used a Hessian-free method built on the Gauss–Newton matrix, which is positive semidefinite.

Dauphin et al. also argued that in high dimensions most critical points of high loss are saddles (see <i>Saddle points</i>).
With |H|, each direction is rescaled by 1/|λ<sub>i</sub>|, and the step always descends.
Using a Krylov-subspace approximation, they reported faster escape from saddles than SGD in deep and recurrent networks.

Gradient descent with a small enough step converges to a [[strict saddle|strictsaddle]] only from a set of starting points of measure zero (Lee et al. 2016).
It can still take exponentially long to pass a sequence of saddles (Du et al. 2017).

## Method

The sheet is a bowl with three Gaussian hills, three Gaussian hollows and a faint texture.
Its critical points are found by Newton’s method from a grid.
Each is classified by the signs of the Hessian’s eigenvalues: both positive at a minimum, both negative at a summit, mixed at a saddle.

Newton and saddle-free Newton take damped steps `θ ← θ − αH⁻¹∇L`, with |H| in place of H for saddle-free Newton.
The Hessian comes from finite differences, and there is no noise.
Where |det H| &lt; 10⁻⁹ they take a small gradient step instead.
Saddle-free Newton floors each |λ<sub>i</sub>| at 0.5.
Gradient descent uses η = 0.004.

A Newton particle can come [[to rest|rest]] at any critical point.
Gradient descent and saddle-free Newton are rung only at minima, since those are the only points where they can rest.
So Try 2 really tests whether their particles come to rest at all, and on this seed every one of them does.
The kind of point is read from the Hessian at the particle’s position averaged exponentially over about its last 60 steps.
Particles that never come to rest are retired after 2475 steps without a ring.

The readouts count Newton’s rings by kind.
The counts restart, and particles in flight are retired, whenever α or η changes.

## Limits

Where det H = 0 the Newton step is undefined.
Near such a curve the step is very long, since it divides by an eigenvalue close to zero.
With steps capped, Newton particles near it chatter back and forth across the curve until they are retired.
Saddle-free Newton avoids this only through its floor on |λ<sub>i</sub>|.

In a real network, with millions of weights, the Hessian has millions of rows, which no one forms, let alone inverts.
Its spectrum is mostly a bulk near zero with a few large outliers (see <i>Survey of a loss surface</i>).

At that scale, second-order methods act as [[preconditioners|precond]].
They use positive-semidefinite or clipped approximations to the curvature, either layer by layer or diagonal.
Examples are K-FAC (Martens and Grosse 2015), Shampoo (Gupta, Koren and Singer 2018) and Sophia (Liu et al. 2024).
Because their curvature is never negative, none of them is drawn to saddles, and escape is left to gradient noise, as for SGD (see <i>Saddle points</i>).

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

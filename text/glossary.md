# Glossary

## loss: Loss surface

The training loss `L(θ)` as a function of the parameters θ, also called the loss landscape.
Each plate has two parameters, θ₁ and θ₂, so the whole surface can be drawn as a map.

## gd: Gradient descent

Stepping the parameters θ against the gradient of the full training loss, `θ ← θ − η∇L(θ)`, with step size η.
Also called full-batch gradient descent.

## sgd: Stochastic gradient descent (SGD)

Gradient descent with the full gradient replaced by that of a random minibatch, an unbiased but noisy estimate.
Most sheets model it as `g̃ = ∇L + σξ`, `ξ ~ N(0, I)`: the full gradient plus Gaussian noise of scale σ.
<i>The shape of the noise</i> changes its shape, and <i>The tails of the noise</i> its tails.

## lr: Learning rate η

The step size η: the factor that multiplies the gradient, or the optimizer’s update direction, at each step.

## hb: Heavy ball (Polyak momentum)

Gradient descent with momentum: `v ← βv − η∇L`, `θ ← θ + v`.
The velocity v is a running sum of past gradients, decaying by a factor β per step (β = 0.9 is typical).

## adam: Adam

An optimizer that divides each coordinate’s step by an estimate of its gradient magnitude.
It keeps running averages of the gradient, m, and of its elementwise square, v, corrects both for starting at zero (m̂, v̂), and steps `θ ← θ − η m̂ / (√v̂ + ε)`.

## hessian: Hessian H

The matrix of second derivatives of the loss, `H = ∇²L(θ)`.
Its eigenvalues are the curvatures along its eigenvectors, and at a minimum none of them is negative.

## sharpness: Sharpness λ<sub>max</sub>

The curvature of the loss along the direction in which it curves up most steeply: the largest eigenvalue of the Hessian, along its top eigenvector.
It is the most common single measure of how sharp a minimum is, though in a network it describes one direction out of millions.
Andriushchenko et al. (2023) found that neither it nor trace-based or adaptive variants track generalization reliably.

## stab: Stability threshold

A minimum is linearly stable for gradient descent with step size η only if its top curvature satisfies `λ_max < 2/η`.
On a quadratic with curvature λ, each step multiplies the distance to the minimum by `|1 − ηλ|`, so gradient descent converges only if `η < 2/λ`.

## crit: Critical point

A point where the gradient is zero.
It is a minimum (a well) if all Hessian eigenvalues are positive, a maximum (a summit) if all are negative, and a saddle point (a pass) if there are some of each.
If an eigenvalue is zero, the test decides nothing: the point is degenerate, as at the singular minima of <i>Singular minima and the learning coefficient</i>.

## saddle: Saddle point

A critical point that is neither a local minimum nor a local maximum: the loss rises along some directions and falls along others, as at a mountain pass.
At a nondegenerate saddle the Hessian has eigenvalues of both signs; a degenerate saddle, such as the origin of `x² + y³`, can have none negative.

## strictsaddle: Strict saddle

A saddle point at which the Hessian has at least one negative eigenvalue, so some direction leads downhill to second order.
The theorems that gradient descent avoids saddles (Lee et al. 2016) and escapes them quickly with noise (Ge et al. 2015; Jin et al. 2017) assume every saddle is strict.
Deep networks also have saddles that are not strict, such as the origin of a deep linear network of depth three or more.

## plateau: Plateau

A region where the gradient is close to zero and the curvature is small, so gradient steps are tiny and progress stalls.
Near a saddle the gradient is also small, though the curvature need not be, and training stalls there in the same way.

## cond: Ill-conditioning

Curvature that differs greatly between directions, measured by the condition number `κ = λ_max / λ_min`, the largest Hessian eigenvalue over the smallest.
Since stability requires `η < 2/λ_max`, gradient descent moves slowly along low-curvature directions.
In a network λ<sub>min</sub> is near zero or negative, so κ is usually taken over the top eigenvalues only.

## basin: Basin of attraction

The set of starting points from which gradient flow ends at a given minimum.

## gflow: Gradient flow

The path that gradient descent follows as its step size η → 0: the continuous-time limit `dθ/dt = −∇L(θ)`.

## sublevel: Sublevel set

The parameters at which the loss is less than δ above a minimum’s loss L*, `{θ : L(θ) < L* + δ}`.
The volume (here an area) of its connected piece around the minimum is one measure of how flat that minimum is.

## epssharp: ε-sharpness

The largest rise of the loss within a small neighbourhood of size ε around a minimum, often divided by `1 + L`.
Keskar et al. (2017) used a box-shaped neighbourhood; sharpness-aware minimization uses a ball of radius ρ.

## reparam: Reparametrization

A change of the coordinates θ that leaves the function the model computes unchanged.
Measures such as λ<sub>max</sub> change under it, so they describe the parametrization as well as the function.

## gengap: Generalization gap

The difference between the loss (or error) on held-out data and on the training data.

## particle: Particle

One run of an optimizer, whose position is its iterate `θ_t` after t steps.
Seen up close, each particle is drawn as a stick man.

## cohort: Cohort

Particles released together from one point, the same number for each optimizer.

## rest: At rest

A particle is counted as at rest when its average position over about its last 60 steps sits on a minimum.
That is, a Newton step from that average is shorter than 0.03, and the particle and its average over the last dozen steps both lie within 0.03 of the longer average.
The test has to pass at four checks 15 steps apart.
For Newton’s method any critical point counts, saddles and maxima included.
A particle bouncing in a small cycle inside a well also counts, unless the plate’s Method gives a stricter test.

## batch: Batch size B

The number of examples whose gradients are averaged in one SGD step.
The variance of the gradient estimate falls roughly as 1/B.

## nag: Nesterov momentum

Heavy-ball momentum with the gradient taken at the look-ahead point θ + βv, where momentum alone would carry θ: `v ← βv − η∇L(θ + βv)`, `θ ← θ + v`.
This is Sutskever et al.’s (2013) form of Nesterov’s (1983) accelerated gradient method.
Looking ahead corrects the velocity before it overshoots.

## rmsprop: RMSprop

An optimizer that divides each coordinate of the gradient g by the root of a running average s of its square: `s ← βs + (1−β)g²`, `θ ← θ − η g/(√s + ε)`.
Tieleman and Hinton (2012) proposed it in lecture notes with β = 0.9.
Here β = 0.99 and s is bias-corrected as in Adam, `ŝ = s/(1−β^t)`, so this RMSprop is Adam without the running average of the gradient.

## adamw: AdamW

Adam with decoupled weight decay of strength λ (Loshchilov and Hutter 2019).
The decay shrinks the weights directly, `θ ← θ − η(m̂/(√v̂ + ε) + λθ)`, instead of being added to the gradient, where Adam’s normalization would rescale it.
Here, as in PyTorch, the decay is multiplied by the learning rate, so each step shrinks θ by the factor `1 − ηλ`.
In the paper’s algorithm it is multiplied only by the schedule factor.

## lion: Lion

A sign-based optimizer found by program search that moves every coordinate by exactly η per step, apart from weight decay (Chen et al. 2023).
With momentum m and gradient g, it steps `θ ← θ − η(sign(β₁m + (1−β₁)g) + λθ)`, then `m ← β₂m + (1−β₂)g`, with β₁ = 0.9 and β₂ = 0.99.
The step uses a short average of the gradient, the stored momentum a longer one.

## signsgd: Sign descent (signSGD)

An optimizer that moves each coordinate by η against the sign of its gradient g, whatever the gradient’s size: `θ ← θ − η sign(g)` (Bernstein et al. 2018).
It is normalized steepest descent in the ℓ<sub>∞</sub> norm.
Adam with β₁ = β₂ = 0 and ε = 0 reduces to it.

## sam: Sharpness-aware minimization (SAM)

Approximately minimizes the largest loss within distance ρ of θ (Foret et al. 2021).
Each step looks a distance ρ uphill along the normalized minibatch gradient, `ε = ρ g/‖g‖`, and steps from θ with the gradient found there: `θ ← θ − η∇L(θ + ε)`.
Both gradients use the same minibatch, here the same noise sample.

## newton: Newton’s method

Rescaling the gradient by the inverse Hessian before stepping: `θ ← θ − α H⁻¹∇L`, where α is a step-size factor.
With α = 1 a quadratic is solved in one step.
Along a direction of negative curvature the step points uphill, so Newton’s method is attracted to saddles and maxima as well as minima.
Here each step is capped at length 0.02.

## sfn: Saddle-free Newton

Newton’s method with the Hessian H replaced by |H|, the matrix with the same eigenvectors and the absolute values of its eigenvalues: `θ ← θ − α|H|⁻¹∇L` (Dauphin et al. 2014).
It keeps Newton’s rescaling but moves away from saddles along directions of negative curvature.
Here eigenvalues smaller than 0.5 in magnitude are raised to 0.5 (the paper adds a damping term instead), and each step is capped at length 0.02.

## sf: Schedule-free SGD

Replaces the learning-rate schedule of SGD with averaging (Defazio et al. 2024).
SGD steps a base sequence z with step size γ, `z ← z − γ∇L(y)`.
The sequence x is a running average of z, `x ← (1−c)x + cz` with `c = γ_t²/Σγ_i²` (1/t once warmup ends).
The gradient is taken at `y = (1−β)z + βx`, with β = 0.9.
The particle is drawn at y and its loss is reported at x.

## clip: Gradient clipping

Shrinking the gradient g whenever its norm exceeds a threshold c: `g ← g · min(1, c/‖g‖)`.
The direction is kept, so an SGD step is at most ηc long.
Pascanu, Mikolov and Bengio (2013) introduced norm clipping for recurrent networks, whose loss has steep cliffs.
Mikolov (2012) had earlier clipped each coordinate separately.

## langevin: Langevin dynamics

Gradient descent plus Gaussian noise set by a temperature T: `θ ← θ − η∇L + √(2ηT) ξ`, `ξ ~ N(0, I)`.
For small η, its stationary distribution is `p(θ) ∝ exp(−L(θ)/T)`.
With minibatch gradients it is stochastic gradient Langevin dynamics (Welling and Teh 2011).
SGD with isotropic gradient noise σ has the same form with `T = ησ²/2`.

## labelnoise: Label-noise SGD

SGD in which fresh noise is added to the regression targets at every step, `y ← y + ε`, so the gradient noise points along the gradient of the model’s output.
Near a manifold of global minima, this noise produces a slow drift that lowers the trace of the Hessian (Blanc et al. 2020; Damian, Ma and Lee 2021).
The result is an implicit bias toward flat minima.

## normgd: Normalized gradient descent

Gradient descent with steps of fixed length η in the direction of steepest descent: `θ ← θ − η∇L/‖∇L‖₂`.
For linear models with the exponential loss on separable data, the weight direction converges to the ℓ₂ max-margin separator.
Step sizes that grow as the gradient vanishes, as here, raise the rate from `1/log t` to `log t/√t` (Nacson et al. 2019).

## gda: Gradient descent–ascent

The first player descends f(θ₁, θ₂) in θ₁ and the second ascends it in θ₂.
In simultaneous steps both use the gradient at the current point, `θ₁ ← θ₁ − η∂₁f`, `θ₂ ← θ₂ + η∂₂f`; in alternating steps the second player uses the first player’s new position.
On `f = aθ₁θ₂`, simultaneous steps spiral outward by a factor `√(1 + η²a²)` per step, while alternating steps stay on a bounded orbit when `ηa < 2`.

## pg: Policy gradient (softmax)

Gradient ascent on the expected reward `J = Σ_a π(a) r(a)` of a softmax policy `π(a) ∝ exp(θ_a)`, where r(a) is action a’s reward.
Its exact gradient is `∂J/∂θ_a = π(a)(r(a) − J)`.
REINFORCE (Williams 1992) estimates it from sampled actions.
Mei et al. (2020a) proved an `O(1/t)` rate for the exact version, and a linear rate when an entropy bonus `τH(π)` is added to J.

## npg: Natural policy gradient

Policy gradient preconditioned by the inverse of the policy’s Fisher information F, `θ ← θ + ηF⁺∇J` (Kakade 2001).
For a softmax policy over actions this is `θ_a ← θ_a + η r(a)` up to a constant shared by all logits, so `π ← π·exp(ηr)/Z`, with Z normalizing, a multiplicative-weights update (Agarwal et al. 2021).
Unlike the plain gradient, its step does not shrink as an action’s probability goes to zero.

## catapult: Catapult

A phase of training at a learning rate somewhat above 2/λ<sub>max</sub>, in which the loss first grows while the curvature falls.
Once λ<sub>max</sub> &lt; 2/η, training converges in a flatter region (Lewkowycz et al. 2020).

## progsharp: Progressive sharpening

The steady rise of the sharpness λ<sub>max</sub> during full-batch training of neural networks, until it reaches about 2/η (Cohen et al. 2021).

## eos: Edge of stability

The regime of full-batch gradient descent in which the sharpness λ<sub>max</sub> hovers at or just above 2/η (Cohen et al. 2021).
The iterate oscillates along the top eigenvector of the Hessian, and the loss still decreases over long times, though not monotonically.
In a network several top eigenvalues can sit at 2/η together.
For SGD the full-batch λ<sub>max</sub> usually stays below 2/η, and a minibatch measure, batch sharpness, sits at the edge instead (Andreyev and Beneventano 2024).

## centralflow: Central flow

A differential equation for the time-averaged trajectory of an optimizer at the edge of stability.
For gradient descent it is gradient flow projected so that λ<sub>max</sub> never exceeds 2/η (Cohen, Damian et al. 2025).

## modloss: Modified loss

A loss L̃ whose gradient flow tracks a discrete optimizer’s iterates more closely than the flow of L does, found by backward error analysis.
For gradient descent, `L̃ = L + (η/4)‖∇L‖²` up to terms of order η², a penalty on large gradients.

## manifold: Manifold of minimizers

A connected set of parameters that all attain the minimum loss.
In overparameterized models the global minima form such sets, along which the loss is flat.

## psharp: Preconditioned sharpness

The largest eigenvalue of the Hessian after scaling by the optimizer’s [[preconditioner|precond]] P, `λ_max(PH)`.
For Adam, `P = diag(1/(√v̂ + ε))`.
It takes the place of λ<sub>max</sub> in the stability threshold of adaptive methods.
The threshold changes too: for Adam it is `(2 + 2β₁)/((1 − β₁)η)`, 38/η at β₁ = 0.9 (Cohen et al. 2022).

## boltzmann: Boltzmann distribution

The distribution `p(θ) ∝ exp(−L(θ)/T)` at temperature T, the stationary distribution of Langevin dynamics `dθ = −∇L dt + √(2T) dW`.
A basin’s share grows with its depth and with its width.
Near a minimum in d dimensions, with Hessian eigenvalues λᵢ, the width enters as `∏ᵢ (2πT/λᵢ)^½`, so in high dimension width can outweigh depth by a factor exponential in d.

## temp: Temperature T

The strength of the noise in a Langevin model of an optimizer.
For SGD with gradient noise of variance σ² per coordinate, `T = ησ²/2`.
Since σ² ∝ 1/B for minibatches of size B, T ∝ η/B.
In a network the noise is anisotropic, larger along the sharp directions, so no single temperature describes it (see <i>The shape of the noise</i>).

## stationary: Stationary distribution

A distribution of the iterate that one step of a noisy optimizer leaves unchanged.
Run long enough, an ensemble of particles forgets where it started and samples from it.

## sde: SDE approximation

For small η, SGD behaves like the stochastic differential equation `dθ = −∇L dt + √(ηΣ/B) dW` (Li, Tai and E 2017).
Here Σ is the covariance of single-example gradients, B the batch size, and k steps last time ηk.

## kramers: Kramers’ law

The law for the mean time noise takes to carry a particle over a barrier of height ΔL.
For gradient flow with Gaussian noise at temperature T, this time grows as `exp(ΔL/T)`, times a factor set by the curvatures at the minimum and the saddle.
Also called the Arrhenius or Eyring–Kramers law.
It assumes isotropic Gaussian noise; with anisotropic noise, or noise that shrinks with the loss, escape times also depend on the curvature and can follow a power law instead.

## gradcov: Gradient noise covariance

The covariance of minibatch gradients around the full gradient, `Σ/B`, where Σ is the covariance of single-example gradients and B the batch size.
Near a minimum, Σ is close to the empirical Fisher and, for a model whose predictions match the data distribution, to the Fisher information and the Hessian (Kunstner, Balles and Hennig 2019).

## km: Kaplan–Meier estimate

An estimate of the fraction of runs still surviving after time t (here, still inside a well) that also uses the runs still in progress.
Each such run counts as at risk up to its current age and is then dropped (censored), instead of being ignored or treated as finished.

## stable: α-stable law, tail index α

A family of distributions, indexed by a tail index α, for which sums of independent copies have the same distribution up to shift and scale.
For α &lt; 2 the tails fall as a power, `P(|ξ| > r) ∝ r^−α`, and the variance is infinite; α = 2 is the Gaussian.
Normalized sums of variables with power-law tails of index α &lt; 2 tend to α-stable laws (the generalized central limit theorem).

## iteravg: Iterate averaging

Using the mean of the iterates, `θ̄_n = (1/n) Σ θ_k`, in place of the last one.
Also called Polyak–Ruppert averaging.
Stochastic weight averaging (SWA) applies it to deep networks.

## lmc: Linear mode connectivity

Two solutions are linearly mode-connected when the loss along the straight line between them has no barrier.
Their average then also has low loss.

## index: Index of a critical point

The number of negative eigenvalues of the Hessian at a critical point: the number of independent directions in which the loss falls.
A minimum has index 0.
Dauphin et al. (2014) use the fraction of negative eigenvalues instead.

## stablemfd: Stable manifold

The set of starting points from which gradient flow converges to a given critical point.
For a nondegenerate saddle of index k ≥ 1 in n dimensions it has dimension n − k, so it has zero volume.
A degenerate saddle with no negative eigenvalue can attract a set of positive volume.

## divide: Divide

A boundary between two basins of attraction, like a watershed.
On a two-parameter surface it is made of the stable manifolds of saddle points: the gradient-flow paths that run into a saddle.

## vanish: Vanishing gradients

Gradients that shrink geometrically as they are propagated back through many layers or time steps, so the early layers, or long-range dependencies, are learned very slowly.

## explode: Exploding gradients

Gradients whose norm grows geometrically as they are propagated back through many layers or time steps, because the Jacobians they are multiplied by have singular values above 1.
One step can then move the parameters very far.

## relsmooth: Relaxed smoothness

A smoothness condition that lets the curvature grow with the norm of the gradient: `‖∇²L‖ ≤ L₀ + L₁‖∇L‖`.
Zhang et al. (2020) observed it in LSTM training.
Under it, clipped gradient descent can converge much faster than gradient descent with any fixed step.

## critdamp: Critical damping

For the heavy ball on a quadratic with curvature λ, the momentum `β* = (1 − √(ηλ))²` that separates oscillating from non-oscillating decay.
Above β* the error oscillates and shrinks by √β per step (underdamped); below it, it decays without oscillating (overdamped, for ηλ &lt; 1); at β* it shrinks fastest, by `1 − √(ηλ)` per step.

## precond: Preconditioner

A matrix P that rescales the gradient step, `θ ← θ − ηP∇L`.
Newton’s method uses `P = H⁻¹`.
Adam and RMSprop use a diagonal P, `diag(1/(√v̂ + ε))`, built from running averages of squared gradients, so they rescale each coordinate separately.

## scaleinv: Scale invariance

A loss is scale-invariant in θ if `L(cθ) = L(θ)` for every c &gt; 0, as for the weights feeding a batch or layer normalization.
Its gradient is then perpendicular to θ and scales as 1/‖θ‖.

## efflr: Effective learning rate

For a scale-invariant loss, the ratio `η/‖θ‖²`, with ‖θ‖ the weight norm.
The angle θ turns per step scales with it, so this ratio, not η alone, sets how fast the function changes.

## angupd: Angular update

The angle between θ before and after one optimizer step.
For SGD with weight decay on a scale-invariant loss, at equilibrium it is about `√(2ηλ)` radians per step.

## warmup: Learning-rate warmup

Raising η from near zero to its peak value over the first steps of training, usually linearly.

## wsd: Warmup–stable–decay (WSD)

A learning-rate schedule with a short warmup, a long phase at constant η and a short final decay, often over the last 10–20% of training.
Unlike cosine, it does not fix the length of training in advance.

## lazy: Kernel (lazy) regime

Training in which the parameters move so little that the network stays close to its linearization at initialization and behaves like a kernel method.
Large initializations lead to it; small ones lead to the rich regime, in which features change.
Width matters too: wide networks in the standard (NTK) parametrization are lazy, while mean-field or μP scaling keeps them rich.

## llc: Learning coefficient λ

How fast the volume V(ε) of parameters whose loss is within ε of a minimum shrinks as ε → 0: the exponent λ in `V(ε) ∝ ε^λ (−log ε)^{m−1}`, where m is the multiplicity of λ.
Also called the real log canonical threshold.
It is d/2 at a regular minimum in d dimensions and at most d/2, usually less, at a degenerate one.
Its local version at a trained network is estimated by SGLD.

## singular: Singular model

A model whose map from parameters to functions is not one-to-one, or whose Fisher information is degenerate at the optimum.
Continuous families of equivalent parameters, such as rescalings and dead or duplicated units, make the Fisher degenerate, and the posterior is then not asymptotically Gaussian.
Neural networks are singular.

## cbs: Critical batch size

The batch size beyond which a larger batch no longer cuts the number of steps needed in proportion, so extra samples per step are mostly wasted.

## modeconn: Mode connectivity

Two minima are mode-connected when some path joins them along which the loss stays close to its value at the ends.
The path may be curved; when the straight segment works, the connectivity is linear.

## barrier: Loss barrier

How far the loss along a path rises above its value at the ends.
For the straight segment, Frankle et al. (2020) and Ainsworth et al. (2023) use `max_α L((1−α)θ_A + αθ_B) − ½(L(θ_A) + L(θ_B))`.
Entezari et al. (2022) subtract the linear interpolation of the end losses instead.
Frankle et al. measure it on the error rather than the loss.

## mli: Monotonic linear interpolation

The property that the loss falls monotonically along the straight line from the initialization θ₀ to the trained parameters θ<sub>T</sub>: `L((1−α)θ₀ + αθ_T)` decreases as α goes from 0 to 1.

## sgdstab: Stability to SGD noise

A network at training step k is stable to SGD noise if two copies trained on from step k with different minibatch order and data augmentation end linearly mode-connected (Frankle et al. 2020).
The error barrier between the two endpoints is its instability.

## permsym: Permutation symmetry

Reordering the hidden units of a layer, together with their incoming and outgoing weights, leaves the function unchanged.
A layer of n units has n! orderings.
For odd activations such as tanh, flipping the signs of a unit’s incoming and outgoing weights is a further symmetry.

## anneal: Simulated annealing

A noisy search whose temperature T is lowered during the run, so that it crosses barriers early and settles late.
Convergence to a global minimum is guaranteed only for very slow, logarithmic schedules.

## equil: Equilibrium (of a game)

In a zero-sum game in which θ₁ minimizes f and θ₂ maximizes it, a point where neither player can improve by changing only its own variable.
It is a minimum in θ₁ and a maximum in θ₂, and so a saddle point of f in the minimax sense.
Not every saddle of a surface is an equilibrium.

## bilinear: Bilinear game

A game with `f(θ₁, θ₂) = θ₁ᵀAθ₂` for a matrix A, linear in each player’s variable when the other is held fixed.
Its descent–ascent field `(−∂₁f, ∂₂f)` rotates around the equilibrium at the origin, which is the only one when A is invertible.

## extragrad: Extragradient

Takes a trial step, then steps from the original point with the gradient found at the trial point (Korpelevich 1976).
The two steps are `θ̃ = θ − ηF(θ)` and `θ ← θ − ηF(θ̃)`, where for a two-player game `F = (∂₁f, −∂₂f)`.
On the bilinear game `f = aθ₁θ₂`, each step multiplies the distance to the equilibrium by `√(1 − η²a² + η⁴a⁴)`, which is below 1 when ηa &lt; 1.

## optimistic: Optimistic gradient descent–ascent

Descent–ascent in which each step extrapolates from the last two gradients, `θ ← θ − η(2F(θ_t) − F(θ_{t−1}))`, with F as for extragradient (Popov 1980; Daskalakis et al. 2018).
The previous gradient stands in for the trial step of extragradient, so each step needs one new gradient.
With a small enough η it converges on bilinear games, where simultaneous descent–ascent diverges.

## softmaxpol: Softmax policy

Picks action a with probability `π(a) = exp(θ_a) / Σ_b exp(θ_b)`, one logit per action.
Adding the same constant to every logit leaves π unchanged.

## maxmargin: Maximum-margin separator

The widest-margin separating direction: for labelled data `zₙ = yₙxₙ`, the w with `‖w‖ ≤ 1` that maximizes the smallest margin `minₙ ⟨w, zₙ⟩`.
With the ℓ₂ norm it is the hard-margin support vector machine; other norms give other directions.

## implicit: Implicit bias

The preference of an optimization algorithm for particular solutions among the many that minimize, or nearly minimize, the loss, with no explicit regularizer.

## dpo: Direct preference optimization (DPO)

Fine-tunes a policy on pairs of a chosen and a rejected answer by minimizing `−log σ(βm)`, with σ the sigmoid (Rafailov et al. 2023).
The margin m is the chosen answer’s log-probability ratio to a frozen reference model minus the rejected answer’s.

## rlvr: RLVR

Reinforcement learning from verifiable rewards: the reward is usually 1 when an automatic checker, such as an answer key or a unit test, accepts the output and 0 otherwise.

## grpo: GRPO

Group relative policy optimization (Shao et al. 2024).
It samples a group of outputs per prompt, gives each the advantage `(r − mean)/std` within its group, and updates the policy with a clipped policy-gradient objective and a KL penalty to a reference policy, without a value network.

## passk: pass@k

The probability that at least one of k independent samples is correct.
For a problem solved with probability q per sample, `pass@k = 1 − (1 − q)^k`.

## entropy: Policy entropy

A policy’s randomness, `H(π) = −Σ_a π(a) log π(a)` in nats: log 3 ≈ 1.10 for a uniform choice among three actions, 0 for a deterministic policy.

## kl: KL divergence

How far a distribution p is from q, `KL(p ‖ q) = Σ p log(p/q)`: zero only when p = q, and not symmetric.
The forward divergence `KL(π₀ ‖ π)` from a base policy π₀ is infinite when π gives zero probability to an answer π₀ allows.
The reverse divergence `KL(π ‖ π₀)` is then finite, but it is infinite when π puts probability on an answer π₀ rules out.

## iproj: I-projection

The distribution in a given set that minimizes `KL(π ‖ π₀)` for a base policy π₀.
Onto the set of policies that always succeed, it is π₀ restricted to the successful answers and renormalized, at `KL = −log π₀(success)`.

## sft: Supervised fine-tuning (SFT)

Fine-tuning by maximizing the log-likelihood of given target outputs y, `θ ← θ + η∇log π(y)`.

## asr: Attack success rate

The fraction of harmful requests in a benchmark that a model complies with instead of refusing.

## st-established: Established

Replicated widely, and proved where the card says so.

## st-contested: Contested

The evidence, or what it shows, is disputed in the literature.

## st-open: Open

An active question without a settled answer.

# Saddle points

## Subtitle

A saddle of index 1, with gradient descent, perturbed gradient descent and SGD started an offset δ from its divide, to time how long each lingers.

## Lead

A [[critical point|crit]] is a point where the gradient is zero.
A [[saddle point|saddle]] is a critical point at which the loss falls in some directions and rises in others, like a mountain pass.
Dauphin et al. (2014) argued that in high dimensions, most high-loss critical points are saddles.

Gradient descent almost never converges to a saddle (Lee et al. 2016).
But it can linger near one, where the gradient is small.
Noise shortens the stay (Jin et al. 2017).
This plate times that stay, starting particles ever closer to the line that leads straight into the saddle.

## In practice

Dauphin et al. argued that when the loss stalls at a high value, the parameters are more likely near a saddle than in a bad local minimum.
Later work found the evidence for this weaker than it looked (Frye et al. 2021).
Even with noise, escape is slow where the negative curvature is weak.

## Figure caption

Steps each particle spent within r = 0.12 of the saddle, against its starting offset δ from the divide.
The dashed line is the linear estimate ln(r/δ) / ln(1 + η|λ₋|) for gradient descent, where λ₋ is the saddle’s negative Hessian eigenvalue.

## Try

1. Watch the figure fill → for δ ≤ 10⁻⁴, gradient descent’s stay near the [[saddle|@Saddle]] grows by about 60–75 steps per tenfold drop in δ.
   That is close to the dashed line’s slope of 63.
2. Look at δ ≥ 10⁻³ → particles leave far sooner than the dashed line says.
   At these offsets the sheet’s texture makes the loss fall faster along θ₁.
3. Compare SGD and perturbed gradient descent → their stay hardly depends on δ.
   Noise replaces the initial offset.
4. Set the noise σ to 0 → SGD matches gradient descent exactly.
   Its noise term σξ is then zero.
   Perturbed gradient descent still leaves in about 70 steps from δ ≤ 10⁻⁵, because its kicks do not depend on σ.
   Gradient descent takes 120 steps on average from δ = 10⁻⁵ and 190 from δ = 10⁻⁶.

## Background

Near a critical point θ*, the loss is close to `L* + ½ uᵀHu`, with `u = θ − θ*`.
Along an eigenvector of the [[Hessian|hessian]] with eigenvalue λ, gradient descent multiplies the offset by `1 − ηλ` per step.
For λ &lt; 0 the factor is `1 + η|λ|`, so an offset δ grows to size r in about `ln(r/δ) / ln(1 + η|λ|)` steps.
So every tenfold drop in δ adds the same number of steps: the stay grows only logarithmically, but without limit.

Started on the saddle’s [[stable manifold|stablemfd]], gradient descent converges to the saddle.
Here that manifold is the divide between the two hills, and it has zero volume.

A [[strict saddle|strictsaddle]] is a saddle that has a negative eigenvalue.
Lee et al.’s proof assumes a random start and a small step, and covers strict saddles only.
It says nothing about time.

Ge et al. (2015) had proved that noisy SGD escapes strict saddles in polynomial time.
Without noise, escape can take far longer.
Du et al. (2017) built functions on which gradient descent takes time exponential in the dimension to pass a chain of strict saddles.
Perturbed gradient descent adds a small random kick when the gradient is small.
Jin et al. proved that it needs a number of steps that grows only polylogarithmically with the dimension.

Dauphin et al. related the loss at a critical point to its eigenvalues, drawing on results for random Gaussian fields and on measurements in small networks.
The higher the loss, the larger the fraction of negative eigenvalues.
They argued that saddles surrounded by [[plateaus|plateau]] slow training.
They also argued that Newton’s method is attracted to saddles (see <i>Newton’s method and saddles</i>).
Newton’s method divides the gradient along each direction by its curvature, so where the curvature is negative it steps uphill, towards the saddle.

## Method

The sheet is mirror symmetric in θ₁.
It has two hills on the θ₂ axis, two equal basins on either side and the saddle between them.
So the [[divide|divide]] is exactly the line θ₁ = 0, and each particle’s offset from it is exactly δ.

Each release starts all three optimizers at θ₁ = ±δ, 0.4 north or south of the saddle.
The offset δ cycles through 10⁻¹ … 10⁻⁶.
So each particle first runs down to the saddle and then must drift off the divide.

Perturbed gradient descent follows Jin et al., with kicks drawn uniformly from a disc of radius 0.003 whenever `‖∇L‖ < 0.05`.
A kick also requires that none was given in the last 40 steps, so there is none in the first 40.
SGD adds isotropic noise σξ, the same size in every direction, to every gradient.

The dashed line’s linear estimate holds only within about 0.001 of the saddle.
At θ₁ = 0.003 the gradient is already 5 times `|λ₋|θ₁`, and at θ₁ = 0.02 it is 12 times.

The readouts give λ₋ and η|λ₋|.
On the default sheet λ₋ is −0.93, against 19.4 for the positive eigenvalue.
Without the texture it would be about −7.5.
The texture has its own dimple at the saddle, and that dimple is what makes λ₋ weak.

## Limits

The [[index|index]] of a saddle is the number of independent directions in which the loss falls.
This saddle has index 1, and its one falling direction is in plain view.
In a network the negative eigenvalues can be few and small, or absent.
Absent ones make the saddle non-strict, and then the Background’s theorems do not apply.

In deep linear networks with more than one hidden layer, some saddles have no negative eigenvalue (Kawaguchi 2016).
The origin is such a saddle.
With two or more hidden layers, the output is a product of three or more weight matrices.
So near the origin the loss is flat to second order: it changes only at third order or higher.
Training from a small initialization starts near the origin and then passes from one saddle to the next (see <i>Saddle to saddle</i>).

The critical points behind the evidence relating index to loss were found with Newton-type methods.
Frye et al. showed that in networks these methods often stop in gradient-flat regions that are not critical points at all.

## References

- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS.
  The higher the loss at a critical point, the larger its index; high-loss critical points are mostly saddles.
- Ge, R., Huang, F., Jin, C. and Yuan, Y. (2015). Escaping from saddle points: online stochastic gradient for tensor decomposition. COLT.
  Noisy SGD escapes strict saddles in polynomial time.
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49.
  From a random start, gradient descent with a small step almost surely avoids strict saddles.
- Jin, C., Ge, R., Netrapalli, P., Kakade, S. M. and Jordan, M. I. (2017). How to escape saddle points efficiently. ICML.
  Perturbed gradient descent escapes saddles with only polylogarithmic dependence on the dimension.
- Du, S. S., Jin, C., Lee, J. D., Jordan, M. I., Póczos, B. and Singh, A. (2017). Gradient descent can take exponential time to escape saddle points. NeurIPS.
  Without noise, a chain of saddles can delay gradient descent exponentially in the dimension.
- Kawaguchi, K. (2016). Deep learning without poor local minima. NeurIPS.
  In deep linear networks every local minimum is global, but networks with more than one hidden layer have saddles with no negative eigenvalue.
- Frye, C. G., Simon, J., Wadia, N. S., Ligeralde, A., DeWeese, M. R. and Bouchard, K. E. (2021). Critical point-finding methods reveal gradient-flat regions of deep network losses. Neural Computation 33(6).
  The methods used to find critical points of network losses often stop at gradient-flat points instead.

# Saddle points

## Subtitle

One saddle of index 1; gradient descent, perturbed gradient descent and SGD start an offset δ from its divide.

## Lead

A [[saddle point|saddle]] is a [[critical point|crit]] where the loss falls in some directions and rises in others.
Dauphin et al. (2014) argued that in high dimensions most high-loss critical points are saddles.
Gradient descent almost never converges to one (Lee et al. 2016) but can linger; noise shortens the stay (Jin et al. 2017).

## In practice

A loss stalled at a high value more likely sits near a saddle than in a bad local minimum, as Dauphin et al. (2014) argued.
Noise speeds escape, but slowly where the negative curvature is weak.

## Figure caption

Steps each particle spent within r = 0.12 of the saddle, against its starting offset δ from the divide. The dashed line is the linear estimate ln(r/δ) / ln(1 + η|λ₋|) for gradient descent.

## Try

1. Watch the figure fill → for δ ≤ 10⁻⁴, gradient descent’s stay near the [[saddle|@Saddle]] grows about 65–75 steps per tenfold drop in δ, close to the dashed line’s slope.
2. Look at δ ≥ 10⁻³ → particles leave far sooner than the dashed line says: the texture makes the loss fall faster along θ₁.
3. Compare SGD and perturbed gradient descent → their stay hardly depends on δ: noise replaces the initial offset.
4. Set σ to 0 → SGD matches gradient descent exactly; perturbed gradient descent, whose kicks ignore σ, still leaves in about 70 steps from δ ≤ 10⁻⁵, gradient descent in 120–190.

## Background

Near a critical point θ* the loss is close to `L* + ½ uᵀHu`, with `u = θ − θ*`.
Along an eigenvector of the [[Hessian|hessian]] with eigenvalue λ, gradient descent multiplies the offset by `1 − ηλ` per step.
For λ &lt; 0 the factor is `1 + η|λ|`, so an offset δ grows to size r in about `ln(r/δ) / ln(1 + η|λ|)` steps.
Started on the saddle’s [[stable manifold|stablemfd]], gradient descent converges to the saddle, but that set has zero volume.
Lee et al. (2016) proved that from a random start, gradient descent with a small step almost surely does not converge to a saddle that has a negative eigenvalue.
This says nothing about time.
Du et al. (2017) built functions on which gradient descent takes time exponential in the dimension to pass a chain of saddles.
Ge et al. (2015) proved that noisy SGD escapes such saddles in polynomial time.
Jin et al. (2017) proved that perturbed gradient descent, which adds a small random kick when the gradient is small, needs a number of steps that grows only polylogarithmically with the dimension.

Dauphin et al. (2014) drew on results for random Gaussian fields and on measurements in small networks: the higher the loss at a critical point, the larger the fraction of negative eigenvalues.
They argued that saddles surrounded by [[plateaus|plateau]] slow training and can look like local minima, and that Newton’s method is attracted to saddles (see <i>Newton’s method and saddles</i>).

## Method

The sheet is mirror symmetric in θ₁: two hills on the θ₂ axis, two equal basins on either side and the saddle between them, so the [[divide|divide]] is exactly the line θ₁ = 0.
The readouts give λ₋, the negative Hessian eigenvalue at the saddle (−0.93 on the default sheet, against 19.4 for the positive one), and η|λ₋|.
Each release starts all three optimizers at θ₁ = δ, 0.4 north or south of the saddle, with δ cycling through 10⁻¹ … 10⁻⁶.
The figure counts the steps each particle spends within r = 0.12 of the saddle.
Perturbed gradient descent, after Jin et al. (2017), adds a kick drawn uniformly from a disc of radius 0.003 whenever `‖∇L‖ < 0.05` and no kick has been given in the last 40 steps.
SGD adds isotropic noise σξ to every gradient.
The dashed line is `ln(r/δ) / ln(1 + η|λ₋|)`.
This linear estimate holds only within about 0.01 of the saddle.
Beyond that, the sheet’s fine texture makes the loss fall faster along θ₁: at θ₁ = 0.02 the gradient is 12 times `|λ₋|θ₁`.

## Caveat

This saddle has [[index|index]] 1, one direction in which the loss falls, and that escape direction is in plain view.
In a network the negative eigenvalues can be few and small.

## References

- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS.
  The higher the loss at a critical point, the larger its index; high-loss critical points are mostly saddles.
- Ge, R., Huang, F., Jin, C. and Yuan, Y. (2015). Escaping from saddle points: online stochastic gradient for tensor decomposition. COLT.
  Noisy SGD escapes strict saddles in polynomial time.
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49.
  From a random start, gradient descent with a small step almost surely avoids strict saddles.
- Jin, C., Ge, R., Netrapalli, P., Kakade, S. M. and Jordan, M. I. (2017). How to escape saddle points efficiently. ICML.
  Perturbed gradient descent escapes saddles with only polylogarithmic dependence on the dimension.
- Du, S. S., Jin, C., Lee, J. D., Jordan, M. I., Singh, A. and Póczos, B. (2017). Gradient descent can take exponential time to escape saddle points. NeurIPS.
  Without noise, a chain of saddles can delay gradient descent exponentially in the dimension.

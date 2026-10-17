# Label noise and the flattest solution

## Subtitle

Gradient descent and label-noise SGD start on wa = 1, the hyperbola of minima of a two-parameter network.

## Lead

In an overparameterized model the global minima form a [[manifold|manifold]], and gradient descent started on it stays put.
SGD with [[label noise|labelnoise]] drifts along it toward the minimizers with the smallest `tr H`.
Blanc et al. (2020), Damian, Ma and Lee (2021) and Li, Wang and Arora (2022) proved this under assumptions.

## In practice

Training past zero loss can still change the solution: label-noise SGD drifts slowly, over order 1/η² steps, toward a local minimum of tr H, while gradient descent stops.

## Figure caption

Mean w² + a² (the trace of the Hessian) of each optimizer over the latest run. The dashed line is its minimum on the floor, 2, at the balanced points.

## Try

1. Leave ε at 0.3 → the green particles slide along the [[valley floor|@Valley of Equivalent Solutions]] toward the balanced points, and the red ones stay put.
2. Watch ‘w² + a², label noise’ → it falls from 3.67 to about 2.1 by step 2,000 and 2.0 by step 4,000.
3. Set ε to 0.6 → the drift runs about four times faster: the regularizer’s strength grows as ε².
4. Set ε to 1.2 → about a third leave the sheet; the noise holds the rest off the floor at `wa < 1`, which brings the mean below 2.

## Background

When a model can fit its training data in many ways, its minimizers form a manifold, and the point training reaches is set by the optimizer’s implicit bias.
Blanc et al. (2020) showed that SGD with fresh label noise at every step, near a zero-loss point, fluctuates across the manifold like an Ornstein–Uhlenbeck process.
They showed that these fluctuations make it decrease `Σᵢ ‖∇_θ f(xᵢ; θ)‖²`.
For the squared loss at a global minimum this sum is `tr H`.
Damian, Ma and Lee (2021) proved that label-noise SGD converges to a stationary point of `L + λR`.
The regularizer R penalizes sharp minimizers and reduces to tr H for small η; λ depends on the step size, the noise strength and the batch size.
Li, Wang and Arora (2022) extended the analysis from about η<sup>−1.6</sup> steps to η<sup>−2</sup> steps.
They showed that, for small η, the iterate then follows a flow along the manifold that decreases tr H.
HaoChen et al. (2021) showed that the shape of the noise matters.
In a quadratically parameterized linear model, label noise recovers the sparse solution, while Gaussian noise of the same size and plain gradient descent do not.

## Method

The sheet is the loss of <i>Implicit gradient regularization</i>, `L = ½(wa − y)²` with target y = 1, scaled by 0.247; a step η = 0.15 on the sheet is a step `η′ = 0.083` on `½(wa − y)²`.
Its Hessian has trace `w² + a²` everywhere.
On the floor `wa = 1` this is λ<sub>max</sub>, and it is smallest, 2, at the balanced points `w = a = ±1`.
Each run starts three noiseless [[gradient descent|gd]] particles and three label-noise SGD particles at each of six points on the floor, with `w² + a²` from 2.5 to 4.9 (mean 3.67).
At every step a label-noise particle draws a new target `y = 1 + εξ`, `ξ ~ N(0, 1)`, which adds `η′εξ(a, w)` to its step, along the normal to the floor.
The readouts and the figure give the mean `w² + a²` of each optimizer over the run of 5,000 steps.

## Caveat

Above about ε = 1 the noise is no longer small: particles are thrown across the hyperbola or off the sheet, and the small-noise theory no longer describes the motion.
With one data point and one flat direction, the drift has a single destination on each branch of the hyperbola.

## References

- Blanc, G., Gupta, N., Valiant, G. and Valiant, P. (2020). Implicit regularization for deep neural networks driven by an Ornstein–Uhlenbeck like process. COLT.
  Near a zero-loss point, label-noise SGD decreases Σ‖∇<sub>θ</sub>f‖², which equals tr H there.
- HaoChen, J. Z., Wei, C., Lee, J. D. and Ma, T. (2021). Shape matters: understanding the implicit bias of the noise covariance. COLT.
  Label noise recovers sparse solutions where Gaussian noise does not.
- Damian, A., Ma, T. and Lee, J. D. (2021). Label noise SGD provably prefers flat global minimizers. NeurIPS.
  Label-noise SGD converges to stationary points of the loss plus a sharpness penalty.
- Li, Z., Wang, T. and Arora, S. (2022). What happens after SGD reaches zero loss? A mathematical framework. ICLR.
  A global analysis over η<sup>−2</sup> steps; label-noise SGD then decreases tr H along the manifold of minimizers.

# Label noise and the flattest solution

## Subtitle

Gradient descent and label-noise SGD start on wa = 1, the hyperbola of minima of a two-parameter network, to see what noise does there.

## Lead

In an overparameterized model the global minima form a [[manifold|manifold]].
The gradient is zero everywhere on it, so gradient descent started on the manifold stays put.

SGD with [[label noise|labelnoise]] draws fresh noise for the targets at every step.
This noise makes it drift along the manifold toward the minimizers whose [[Hessian|hessian]] has the smallest trace, `tr H`.
The trace sums the curvatures in all directions, so this is a drift toward the flattest solution in one specific sense.

Blanc et al. (2020) showed this locally.
Damian, Ma and Lee (2021) and Li, Wang and Arora (2022) proved it under assumptions.
On this sheet we can watch which of the two optimizers moves along the manifold.

## In practice

Training past zero loss can still change the solution.
Label-noise SGD drifts slowly toward a local minimum of tr H, over a number of steps of order 1/η².
So halving η should make the drift take about four times as many steps.

## Figure caption

Mean w² + a² (the trace of the Hessian) of each optimizer over the latest run.
The dashed line is its minimum on the floor, 2, at the balanced points.
A curve falling toward it belongs to particles moving toward the flattest minimizers.

## Try

1. Leave the label-noise scale ε at 0.3 → the green label-noise particles slide along the [[valley floor|@Valley of Equivalent Solutions]], and the red gradient-descent particles stay put.
   The label-noise particles head toward the balanced points w = a = ±1, the minimizers with the smallest tr H.
2. Watch ‘w² + a², label noise’ → it falls from 3.67 to about 2.1 by step 2,000 and to 2.0 by step 4,000.
   The drift slows near the balanced points, where the gradient of tr H along the floor goes to zero.
3. Set ε to 0.6 → the drift runs about four times faster.
   The strength of the implicit regularizer grows as ε².
4. Set ε to 1.2 → a third to a half of the label-noise particles leave the sheet.
   The noise holds the rest off the floor at `wa < 1`, which brings the mean below 2.
   This is possible because w² + a² is at least 2wa, so it can fall below 2 only where wa &lt; 1.

## Background

The optimizer’s [[implicit bias|implicit]] decides which point on the manifold training reaches.

Blanc et al. showed that near a zero-loss point, label-noise SGD fluctuates across the manifold like an Ornstein–Uhlenbeck process.
That is a random walk pulled back toward a centre.
These fluctuations make it decrease `Σᵢ ‖∇_θ f(xᵢ; θ)‖²`, where f is the model’s output.
For the squared loss at a global minimum this sum is `tr H`.

Intuitively, the noise keeps each iterate hovering just off the manifold of minima.
Its average loss there is larger where the curvature across the manifold is higher, so it drifts toward where that curvature is lowest.

Damian, Ma and Lee (2021) proved that label-noise SGD converges to a stationary point of `L + λR`.
The regularizer R penalizes sharp minimizers and reduces to tr H for small η.
Here λ is not a curvature but R’s weight, which depends on the step size, the noise strength and the batch size.

Li, Wang and Arora (2022) extended the analysis from about η<sup>−1.6</sup> steps to η<sup>−2</sup> steps.
They showed that, for small η, the iterate then follows a flow along the manifold that decreases tr H.

HaoChen et al. (2021) showed that the shape of the noise matters.
In a quadratically parameterized linear model, label noise recovers the sparse solution from an arbitrary initialization.
Gaussian noise and plain gradient descent instead overfit to dense solutions of large norm.

## Method

The sheet is the loss of <i>Implicit gradient regularization</i>, `L = ½(wa − y)²` with target y = 1, scaled by 0.247.
So a step η = 0.15 on the sheet is a step `η′ = 0.083` on `½(wa − y)²`.

Its Hessian has trace `w² + a²` everywhere.
On the floor `wa = 1` this trace is λ<sub>max</sub>, since the other eigenvalue, along the floor, is zero.

Each run starts three noiseless [[gradient descent|gd]] particles and three label-noise SGD particles at each of six points on the floor.
These points have `w² + a²` from 2.5 to 4.9, with mean 3.67.
At every step a label-noise particle draws a new target `y = 1 + εξ`, with `ξ ~ N(0, 1)`.
This adds `η′εξ(a, w)` to its step, along the normal to the floor.
Each run lasts 5,000 steps.

## Limits

Above about ε = 1 the noise here is no longer small.
Particles are thrown across the hyperbola, and the small-noise theory no longer describes their motion.
With one data point and one flat direction, the drift also has a single destination on each branch of the hyperbola.

In a network the drift needs a manifold of exact minimizers.
Language-model pretraining never fits its data exactly, so the result applies to models trained past zero loss, not to pretraining.

Andriushchenko et al. (2023) studied the large step sizes used in practice.
They found that the iterates bounce across the valley, and that the bouncing amplifies the noise.
The amplified noise drives the weights toward sparse features.
The longer the large step is kept, the sparser they get.

## References

- Blanc, G., Gupta, N., Valiant, G. and Valiant, P. (2020). Implicit regularization for deep neural networks driven by an Ornstein–Uhlenbeck like process. COLT.
  Near a zero-loss point, label-noise SGD decreases Σ‖∇<sub>θ</sub>f‖², which equals tr H there.
- HaoChen, J. Z., Wei, C., Lee, J. D. and Ma, T. (2021). Shape matters: understanding the implicit bias of the noise covariance. COLT.
  From an arbitrary initialization, label noise recovers sparse solutions where Gaussian noise and gradient descent do not.
- Damian, A., Ma, T. and Lee, J. D. (2021). Label noise SGD provably prefers flat global minimizers. NeurIPS.
  Label-noise SGD converges to stationary points of the loss plus a sharpness penalty.
- Li, Z., Wang, T. and Arora, S. (2022). What happens after SGD reaches zero loss? A mathematical framework. ICLR.
  A global analysis over η<sup>−2</sup> steps; label-noise SGD then decreases tr H along the manifold of minimizers.
- Andriushchenko, M., Varre, A. V., Pillaud-Vivien, L. and Flammarion, N. (2023). SGD with large step sizes learns sparse features. ICML.
  Large steps make the iterates bounce across the valley, and with the noise this biases training toward sparse predictors.

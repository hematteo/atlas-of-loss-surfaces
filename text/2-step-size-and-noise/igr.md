# Implicit gradient regularization

## Subtitle

Gradient descent, gradient flow and the modified flow on the two-parameter network L = ½(wa − 1)².

## Lead

Finite-step [[gradient descent|gd]] does not follow [[gradient flow|gflow]].
Backward error analysis proves that, to second order in η, it follows the flow of a [[modified loss|modloss]] `L̃ = L + (η/4)‖∇L‖²`, which penalizes large gradients (Barrett and Dherin 2021).
How much this bias explains the benefit of large learning rates is debated.

## In practice

Changing η changes where gradient descent ends, not just how fast it gets there.
To leading order, larger steps add a penalty on the squared gradient norm that biases runs toward flatter regions.

## Figure caption

Each release gives two points: gradient descent’s final w² − a² against the prediction of gradient flow (black rings) and of the flow of L̃ (green dots). The green dots lie nearer the diagonal, but gradient descent goes further toward balance than either flow predicts.

## Try

1. Keep η = 0.42 and compare the readouts after each release → gradient descent’s final `w² − a²` goes past the modified flow’s prediction toward balance, but lies closer to it than to gradient flow’s.
2. Compare starting points → from starts where `η′λ_max` stays above 1, so that gradient descent overshoots the floor on every step, it changes `w² − a²` 3.6 to 3.8 times as much as L̃ predicts.
   From the other starts the factor is 1.4 to 2.2.
3. Lower η to 0.2 → the three readouts draw together and the factor falls to 1.2–1.8, because L̃ is only the first term of an expansion in η.
4. Raise η to 0.55 → the gap between the black and green rings widens.

## Background

Backward error analysis comes from numerical integration (Hairer, Lubich and Wanner 2006).
Instead of measuring how far a discrete method strays from an ODE, it finds a modified ODE that the method follows more closely.
For gradient descent with step η it gives the gradient flow of L̃, whose error per step is of order η³ instead of η² (Barrett and Dherin 2021).
The added term, implicit gradient regularization, slows descent where the gradient is large.
Barrett and Dherin used this same model, `f(x) = wax` fitted to one point, and found that larger steps end at minima of smaller norm, nearer the flattest point.
In deep networks they found that a larger implicit regularization strength went with higher test accuracy.
Smith et al. (2021) extended the analysis to SGD, whose modified loss also penalizes the mean squared norm of the minibatch gradients.

On this model the bias can be written exactly.
Gradient flow conserves `w² − a²`, so it ends where its hyperbola of constant `w² − a²` meets the floor.
This is the two-layer case of the layer balancing proved by Du, Hu and Lee (2018).
With η′ the step on `½(wa − 1)²` (see Method), one step of gradient descent multiplies `w² − a²` by `1 − η′²r²`, with `r = wa − 1`.
The flow of L̃ shrinks it at the matching rate, `d(w² − a²)/dt = −η′r²(w² − a²)`.
Both move toward the [[Balanced point|@Balanced point]] `w = a`, where λ<sub>max</sub> = `w² + a²` is smallest on the floor.

## Method

The sheet is `L = ½(wa − 1)²` with `w = 1.5θ₁` and `a = 1.5θ₂`, scaled by 0.247 to fit the relief.
So a step η on the sheet is a step `η′ = 0.555η` on `½(wa − 1)²`; the formulas on this card use η′.
The minima form the hyperbola `wa = 1` (blue), with balanced points `w = a = ±1`.
The dotted lines are hyperbolas of constant `w² − a²`, the paths of gradient flow.
Each release starts one noiseless gradient-descent particle at one of eight fixed points.
From the same point it integrates, by fourth-order Runge–Kutta, the gradient flow of L (black path and ring) and of L̃ (green path and ring).
From starts where `η′λ_max` stays above 1, gradient descent overshoots the floor on every step.
The readouts give `w² − a²` at the end of each of the three for the latest release.
The figure plots gradient descent’s final value against each prediction, one pair per release.

## At scale

The expansion assumes ηλ well below 1.
But gradient descent on networks usually reaches the [[edge of stability|eos]], where ηλ<sub>max</sub> ≈ 2 and the expansion breaks down.
The factor of 3.6 to 3.8 on this sheet already shows it failing.
Two models are built for that regime: the principal flow, which follows the oscillation (Rosca et al. 2023), and the [[central flow|centralflow]], which follows its time average (Cohen, Damian et al. 2025).
For full-batch [[Adam|adam]], Cattaneo, Klusowski and Shigida (2024) used backward error analysis to find a different bias, one that typically rewards, rather than penalizes, a perturbed 1-norm of the gradient.

## References

- Barrett, D. G. T. and Dherin, B. (2021). Implicit gradient regularization. ICLR.
  Backward error analysis gives the modified loss L + (η/4)‖∇L‖²; uses this two-parameter model.
- Smith, S. L., Dherin, B., Barrett, D. G. T. and De, S. (2021). On the origin of implicit regularization in stochastic gradient descent. ICLR.
  The modified loss of SGD, which also penalizes the norms of minibatch gradients.
- Du, S. S., Hu, W. and Lee, J. D. (2018). Algorithmic regularization in learning deep homogeneous models: layers are automatically balanced. NeurIPS.
  Gradient flow conserves the differences between the squared norms of consecutive layers.
- Hairer, E., Lubich, C. and Wanner, G. (2006). Geometric Numerical Integration, 2nd edition, chapter IX. Springer.
  Backward error analysis of numerical integrators.
- Rosca, M., Wu, Y., Qin, C. and Dherin, B. (2023). On a continuous time model of gradient descent dynamics and instability in deep learning. TMLR.
  The principal flow, a continuous-time model that captures gradient descent’s oscillation and divergence.
- Cattaneo, M. D., Klusowski, J. M. and Shigida, B. (2024). On the implicit bias of Adam. ICML.
  Backward error analysis for RMSprop and Adam: their implicit term involves a 1-norm of the gradient and can anti-regularize.
- Cohen, J. M., Damian, A., Talwalkar, A., Kolter, J. Z. and Lee, J. D. (2025). Understanding optimization in deep learning with central flows. ICLR.
  An ODE for the time-averaged trajectory of an optimizer at the edge of stability.

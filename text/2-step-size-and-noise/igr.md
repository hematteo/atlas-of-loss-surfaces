# Implicit gradient regularization

## Subtitle

Gradient descent, gradient flow and the modified flow on the two-parameter network L = ½(wa − 1)², to see which flow finite steps follow.

## Lead

[[Gradient flow|gflow]] is the limit of [[gradient descent|gd]] as the step size goes to zero.
Gradient descent with a finite step does not follow it.
Each step moves in a straight line where the flow would curve, and the small errors add up to a systematic bias.

Backward error analysis describes this bias.
It proves that, to second order in η, gradient descent follows the flow of a [[modified loss|modloss]] (Barrett and Dherin 2021).
That loss is `L̃ = L + (η/4)‖∇L‖²`, which penalizes large gradients.
How much this bias explains the benefit of large learning rates is debated.

On this sheet we can test the prediction exactly.
If it holds, gradient descent should end where the flow of L̃ ends, and not where the flow of L does.

## In practice

Changing η changes where gradient descent ends, as well as how fast it gets there.
To leading order, larger steps add a penalty on the squared gradient norm that biases runs toward flatter regions.

## Figure caption

Each release gives two points, each plotting gradient descent’s final w² − a² against a prediction.
Black rings use the prediction of gradient flow, and green dots that of the flow of L̃.
A perfect prediction lies on the diagonal.

## Try

1. Keep η = 0.42 and compare the readouts after each release → gradient descent ends closer to the modified flow’s prediction than to gradient flow’s.
   Its final `w² − a²` goes past that prediction, toward balance.
   So L̃ captures most of the bias, but not all of it.
2. Compare starting points → from some starts, gradient descent changes `w² − a²` 3.4 to 3.7 times as much as L̃ predicts.
   These are the starts where `η′λ_max` stays above 1, so gradient descent overshoots the floor on every step.
   From the other starts the factor is 1.2 to 2.1.
   The expansion behind L̃ assumes small steps, and a step that overshoots every time is not small.
3. Lower η to 0.2 → the three readouts draw together, and the factor falls to between 0.9 and 1.7.
   L̃ is only the first term of an expansion in η.
   The terms it leaves out shrink faster with η than the term it keeps.
4. Raise η to 0.55 → the gap between the black and green rings widens.
   The penalty in L̃ grows in proportion to η.

## Background

Backward error analysis comes from numerical integration (Hairer, Lubich and Wanner 2006).
Instead of measuring how far a discrete method strays from an ODE, it finds a modified ODE that the method follows more closely.
For gradient descent that ODE is the flow of L̃, whose error per step is of order η³ instead of η².
The added term in L̃ is called implicit gradient regularization.

Barrett and Dherin used this same model: `f(x) = wax`, fitted to one point.
They found that larger steps end at minima of smaller norm, nearer the flattest point.
In deep networks they found that a larger implicit regularization strength went with higher test accuracy.
Smith et al. (2021) extended the analysis to SGD, whose modified loss also penalizes the mean squared norm of the minibatch gradients.

On this model the bias can be written exactly.
With `r = wa − 1` the residual, gradient flow changes w² and a² at the same rate, −2rwa.
So gradient flow conserves `w² − a²`, and ends where its hyperbola of constant `w² − a²` meets the floor.
This is the two-layer case of the layer balancing proved by Du, Hu and Lee (2018).

Finite steps break this conservation.
With η′ the step on `½(wa − 1)²` (see Method), one step of gradient descent multiplies `w² − a²` by `1 − η′²r²`.
The flow of L̃ shrinks it at the matching rate, `d(w² − a²)/dt = −η′r²(w² − a²)`.
Over a time η′, that rate multiplies it by about the same factor.

Both dynamics move toward the [[Balanced point|@Balanced point]] `w = a`, where λ<sub>max</sub> = `w² + a²` is smallest on the floor.
So both predict that larger steps end nearer balance.

## Method

The sheet is `L = ½(wa − 1)²` with `w = 1.5θ₁` and `a = 1.5θ₂`, scaled by 0.247 to fit the relief.
So a step η on the sheet is a step `η′ = 0.555η` on `½(wa − 1)²` (0.247 × 1.5²).
The formulas on this card use η′.

The minima form the hyperbola `wa = 1` (blue), with balanced points `w = a = ±1`.
The dotted lines are hyperbolas of constant `w² − a²`, the paths of gradient flow.

Each release starts one noiseless gradient-descent particle at one of eight fixed points.
From the same point, fourth-order Runge–Kutta integrates the gradient flow of L (black path and ring) and of L̃ (green path and ring).
The readouts give `w² − a²` at the end of all three paths for the latest release.

## Limits

The expansion behind L̃ assumes ηλ well below 1.
But gradient descent on networks usually reaches the [[edge of stability|eos]], where ηλ<sub>max</sub> ≈ 2 and the expansion breaks down (see <i>The edge of stability</i>).

Two models are built for that regime:

1. The principal flow, which follows the oscillation (Rosca et al. 2023).
2. The [[central flow|centralflow]], which follows its time average (Cohen, Damian et al. 2025).

For full-batch [[Adam|adam]], Cattaneo, Klusowski and Shigida (2024) used backward error analysis to find a different bias.
It typically rewards, rather than penalizes, a perturbed 1-norm of the gradient.

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

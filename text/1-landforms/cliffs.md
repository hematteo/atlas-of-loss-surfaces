# Cliffs and exploding gradients

## Subtitle

A terrace ending in a cliff whose face is about a hundred times steeper.

## Lead

In a recurrent network the gradient contains products of many Jacobians, and its norm can grow exponentially with sequence length.
Pascanu, Mikolov and Bengio (2013) linked these [[exploding gradients|explode]] to steep walls in the loss, where one step can throw the parameters far away, and proposed [[clipping|clip]] the gradient’s norm.
Clipping is widely used.

## In practice

Clip the global gradient norm when single steps can be huge, as in recurrent networks.
Norm clipping, unlike elementwise clipping, keeps the direction and alters only steps above the threshold.

## Figure caption

Histogram of step lengths, with both axes logarithmic. SGD’s long tail is its throws off the cliff face; the dashed line is ηc, the longest step clipped SGD can take.

## Try

1. Watch particles reach the edge → SGD is thrown up to about 0.25 in one step, always to lower loss: on the face ‖∇L‖ reaches 63.
2. Read ‘clipped, longest’ → it equals ηc = 0.0048 exactly, so clipped SGD descends the face in a few steps.
3. Watch Adam → its longest step stays within a few η, at most 1.9η in our runs: it divides by a running magnitude of the gradient.
4. Raise η to 0.02 → SGD’s throws reach about 1.3 and some SGD particles leave the sheet, while the clipped steps grow only to ηc = 0.024.

## Background

Training a recurrent network back-propagates through every time step, so the gradient contains products of the recurrent Jacobian over long spans.
Hochreiter (1991) and Bengio, Simard and Frasconi (1994) showed that these products make the long-term components of the gradient vanish or explode.
Pascanu, Mikolov and Bengio (2013) gave a sufficient condition on the recurrent weights for vanishing and a necessary one for exploding.
They described the loss surface near an explosion as having steep walls: a step that hits a wall jumps across the valley and can leave it.
They hypothesized that where the gradient explodes the curvature does too, so a short step along the gradient is safe, and proposed rescaling the gradient to norm c whenever its norm exceeds c.
Mikolov (2012) had clipped the gradient elementwise.

Zhang et al. (2020) made the hypothesis precise as [[relaxed smoothness|relsmooth]] and observed it while training LSTM language models.
They proved that clipped gradient descent can then converge arbitrarily faster than gradient descent with any fixed step.
Adam’s step is also bounded, by about `η(1 − β₁)/√(1 − β₂)` per coordinate (Kingma and Ba 2015), but it adapts over many steps rather than at once.

## Method

The cliff is a logistic step of height H = 0.5 and width w = 0.0022 (before the sheet is scaled), laid along a sinuous line.
Its face has slope `H/4w`, about 63 after scaling, against 0.57 on the terrace above, which tilts toward the edge.
On the face `|L″| ≤ |L′|/w`, so it satisfies relaxed smoothness with `L₁ = 1/w`.
Particles start on the [[terrace|@Terrace]] at least 0.18 from the edge.
SGD’s step on the face is `η‖∇L‖`.
Clipped SGD rescales the noisy gradient g̃ to norm c = 1.2 whenever it is longer, so no step exceeds ηc.
Steps longer than 0.05 are drawn as arcs.
The readouts give the longest step of SGD and of clipped SGD, ηc, and the number of SGD and Adam particles that left the sheet.
The figure is a histogram of step lengths; its vertical axis is `log₁₀(1 + count)`.

## Caveat

Here the face drops toward lower ground, so the danger shown is the throw’s distance, up to leaving the sheet.
In Pascanu et al.’s picture the wall rises from a valley floor, and a throw can carry the parameters out of the valley to higher loss.
In a recurrent network the walls are not marked; they appear where the network’s dynamics change abruptly as the weights cross a bifurcation.

## References

- Hochreiter, S. (1991). Untersuchungen zu dynamischen neuronalen Netzen. Diploma thesis, Technische Universität München.
  First analysis of vanishing and exploding error signals in recurrent networks.
- Bengio, Y., Simard, P. and Frasconi, P. (1994). Learning long-term dependencies with gradient descent is difficult. IEEE Transactions on Neural Networks 5(2).
  Long-term gradient components vanish or the dynamics lose robustness to noise.
- Mikolov, T. (2012). Statistical language models based on neural networks. PhD thesis, Brno University of Technology.
  Clips gradient components elementwise to train recurrent language models.
- Pascanu, R., Mikolov, T. and Bengio, Y. (2013). On the difficulty of training recurrent neural networks. ICML.
  Conditions for exploding and vanishing gradients, steep walls in the loss surface, and gradient-norm clipping.
- Goodfellow, I., Bengio, Y. and Courville, A. (2016). Deep Learning, sections 8.2.4 and 10.11.1. MIT Press.
  Textbook treatment of cliffs, exploding gradients and clipping.
- Zhang, J., He, T., Sra, S. and Jadbabaie, A. (2020). Why gradient clipping accelerates training: a theoretical justification for adaptivity. ICLR.
  Relaxed smoothness, observed in LSTM training, under which clipped gradient descent converges faster than any fixed step.
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR.
  Bounds Adam’s step by about η(1 − β₁)/√(1 − β₂) per coordinate.

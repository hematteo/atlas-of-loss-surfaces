# Cliffs and exploding gradients

## Subtitle

A terrace ending in a cliff whose face is about a hundred times steeper, to ask how far one huge gradient throws each optimizer.

## Lead

In a recurrent network the gradient contains products of many Jacobians, one per time step.
So its norm can grow exponentially with sequence length.
Pascanu, Mikolov and Bengio (2013) linked these [[exploding gradients|explode]] to steep walls in the loss, where one step can throw the parameters far away.

As a remedy they proposed [[clipping|clip]] the gradient’s norm, which is now widely used.
Any gradient longer than a threshold is shrunk to that length.
This plate builds a cliff and compares how far SGD, clipped SGD and Adam are thrown off it.

## In practice

When single steps can be huge, as in recurrent networks, clip the global gradient norm.
That norm is the length of the whole gradient over all parameters.
Norm clipping keeps the gradient’s direction and alters only steps above the threshold.
Elementwise clipping instead cuts large components more than small ones, which turns the step.

## Figure caption

Histogram of step lengths, with both axes logarithmic.
SGD’s long tail comes from its throws off the cliff face.
The dashed line is ηc, the longest step clipped SGD can take.

## Try

1. Watch particles reach the edge → SGD is thrown up to about 0.25 in one step, always to lower loss.
   SGD’s step is η times the gradient, and on the face ‖∇L‖ reaches 63.
   That is about a hundred times the gradient on the terrace.
2. Read ‘clipped, longest’ → it equals ηc = 0.0048 exactly.
   No clipped step can exceed ηc, so clipped SGD descends the face in a few steps.
3. Watch Adam → its longest step is about 3η, near its bound `η(1 − β₁)/√(1 − β₂)` ≈ 3.2η.
   The bound holds because Adam divides by a running magnitude of the gradient.
   After a calm stretch, a sudden gradient g enters Adam’s running averages as (1 − β₁)g and (1 − β₂)g².
   Dividing the first by the root of the second cancels the size of g.
4. Raise η to 0.02 → SGD’s throws reach about 1.3, and some SGD particles leave the sheet.
   The clipped steps grow only to ηc = 0.024.

## Background

Hochreiter (1991) and Bengio, Simard and Frasconi (1994) showed that these Jacobian products make the long-term components of the gradient vanish or explode.
If the Jacobian shrinks vectors, the product shrinks geometrically; if it stretches them, the product grows geometrically.
Pascanu et al. gave a sufficient condition on the recurrent weights for vanishing and a necessary one for exploding.

Before them, Mikolov (2012) had clipped the gradient elementwise.
Pascanu et al. hypothesized that where the gradient explodes the curvature does too, so a short step along the gradient is safe.

Zhang et al. (2020) made this hypothesis precise as [[relaxed smoothness|relsmooth]], and observed it while training LSTM language models.
They proved that clipped gradient descent can then converge arbitrarily faster than gradient descent with any fixed step.
A fixed step must be small enough for the steepest point the run might reach.
A clipped step shrinks only where the gradient is large.

Unlike clipping, Adam adapts its step over many iterations rather than at once (Kingma and Ba 2015).

## Method

The cliff is a logistic step laid along a sinuous line.
Before the sheet is scaled, its height is H = 0.5 and its width w = 0.0022.
Its face has slope `H/4w`, about 63 after scaling, against about 0.6 on the terrace above, which tilts toward the edge.
On the face `|L″| ≤ |L′|/w`, so it satisfies relaxed smoothness with `L₁ = 1/w`.

Particles start on the [[terrace|@Terrace]] at least 0.18 above the edge.
Clipped SGD rescales the noisy gradient g̃ to norm c = 1.2 whenever it is longer.

Steps longer than 0.05 are drawn as arcs.
The readouts give the longest step of SGD and of clipped SGD, ηc, and the number of SGD and Adam particles that left the sheet.
The figure’s vertical axis is `log₁₀(1 + count)`.

## Limits

Here the face drops toward lower loss, so the danger shown is how far a throw goes, which can be off the sheet.
In Pascanu et al.’s picture the wall instead rises from a valley floor.
There a throw can carry the parameters out of the valley to higher loss.

In a recurrent network the walls are not marked.
They appear where the network’s dynamics change abruptly, as the weights cross a bifurcation.
At a bifurcation, a small change in the weights changes the network’s long-run behaviour.

In large transformers trained with Adam, clipping the global gradient norm at 1 is routine, yet loss spikes still occur.
The loss of PaLM’s largest model spiked about 20 times with clipping on.
Chowdhery et al. (2023) handled each spike by restarting from a checkpoint about 100 steps earlier and skipping 200 to 500 batches.

Molybog et al. (2023) traced such spikes to Adam reaching a state where its update is large and nearly uncorrelated with the descent direction.
Spikes have also been traced to attention and output logits that grow during training.
The usual remedies for these spikes control the logits rather than clip the gradient (see <i>The pull of softmax</i>).
Examples are qk-layernorm, which normalizes queries and keys, and a z-loss, a penalty on the log of the softmax’s normalizer.

Because Adam already bounds each coordinate’s step, global clipping matters most when the gradient jumps after a calm stretch, as at this cliff.

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
- Chowdhery, A. et al. (2023). PaLM: scaling language modeling with pathways. JMLR 24(240).
  Loss spikes in the largest model despite gradient clipping, handled by restarting from an earlier checkpoint and skipping batches.
- Molybog, I. et al. (2023). A theory on Adam instability in large-scale machine learning. arXiv:2304.09871.
  Explains loss spikes in large language-model training by Adam updates that grow large and lose their correlation with the descent direction.

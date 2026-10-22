# Learning rates across widths

## Subtitle

One small network at seven widths and in two parametrizations, to ask whether its best learning rate stays put as it widens.

## Lead

Tuning the [[learning rate|lr]] of a large network is expensive, so we would like to tune it on a narrow copy and reuse it.
In the [[standard parametrization|sp]] (SP) this fails, because the best learning rate shrinks as the network widens.
Yang et al. (2021) found that under [[μP|mup]], which rescales each layer’s initialization and learning rate with width, the best learning rate stays put.

The [[sharpness|sharpness]] λ<sub>max</sub> gives one account of why.
Gradient descent becomes unstable once η passes about 2/λ<sub>max</sub> (see <i>Stability and catapults</i>).
Under SP, λ<sub>max</sub> grows roughly in proportion to width, so the learning rates that train shrink with it.
Under μP it stays of order one, and Noci et al. (2024) found it independent of width throughout training, which they call [[super consistency|supercons]].

This plate trains one two-layer network at widths 16 to 1024 in both parametrizations.
We can watch the best learning rate follow λ<sub>max</sub> down under SP and stay in place under μP.

## In practice

Under μP, a learning rate tuned on a narrow model can be reused on a wide one, which is called [[μTransfer|transfer]].
Yang et al. (2021) tuned a 40-million-parameter model this way and beat the published results of the 6.7-billion-parameter GPT-3.
Under SP, a learning rate tuned at one width can diverge at a larger one unless it is shrunk.
Transfer can fail with some common architecture choices (Lingle 2024), so a short sweep at a second width is a cheap check.

## Figure caption

Top and middle: the loss after 100 steps of full-batch gradient descent from one initialization, against η, for widths 16 (lightest) to 1024 (darkest).
Each curve ends where its runs diverge, dots mark each width’s best η, the current width is thicker, and the dashed line is the slider’s η.
Bottom: λ<sub>max</sub> at initialization (solid) and where the best run ended (dashed), and the best η, against width, for SP (red) and μP (blue).

## Try

1. Set width 16 under SP with η = 0.3 → λ<sub>max</sub> and the best η read the same under both parametrizations, 4.31 and 0.68.
   The lightest curves of the two panels coincide, and the particles at η and 2η reach losses of 5.5×10⁻³ and 7.1×10⁻⁴.
   μP is defined relative to width 16, so at this width the two are the same network.
2. Keep η = 0.3 and set width 1024 → λ<sub>max</sub> is now 255, so 2/λ<sub>max</sub> is 0.0078 and η is 38 times that.
   Every particle leaves the map at its first step and diverges within three.
   Under SP the readout’s curvature is a sum over its 1024 features, so it grows with width.
3. Switch to μP → λ<sub>max</sub> reads 4.47, and the same η = 0.3 trains.
   The particles at η and 2η end at 4.7×10⁻³ and 1.1×10⁻³, close to their losses at width 16.
   The learning rate tuned at width 16 has transferred to width 1024.
4. Return to SP at width 1024 and set η = 0.01, just above 2/λ<sub>max</sub> → the particle at η leaves the map at step 7.
   Its loss peaks at 3317 and still ends at 0.013 after 100 steps.
   This is a [[catapult|catapult]], and it carried the parameters far outside this plane.
   The particle at 2η diverges at step 7, which is why the SP curve for width 1024 ends at 0.010.
5. Read the bottom panels → under SP, λ<sub>max</sub> grows from 4.31 at width 16 to 255 at 1024, and the best η falls from 0.68 to 0.010.
   Under μP, λ<sub>max</sub> stays between 3.89 and 4.88, and the best η is 0.68 at every width except 32, where it is 0.46.
   Where the best run ended, μP’s λ<sub>max</sub> lies between 2.51 and 2.97 from width 64 to 1024, a small version of super consistency.

## Background

Yang and Hu (2021) asked how each layer’s initialization, multiplier and learning rate should scale with width.
They proved that in SP, training stays stable as width grows only if the learning rate shrinks like 1/width.
With such a learning rate, the infinite-width limit is in the [[kernel regime|lazy]] and learns no features.
μP is their alternative, whose infinite-width limit learns features in every layer.

In a two-layer network the curvature shows why SP needs the smaller step.
Each readout weight multiplies a hidden feature of order one, so the readout’s part of the Hessian sums n such terms.
So its largest eigenvalue grows like n, and a learning rate below 2/λ<sub>max</sub> must shrink like 1/n.
μP multiplies the readout by √(16/n), which divides that sum by n/16 and keeps λ<sub>max</sub> of order one.

Yang et al. (2021) turned the theory into a recipe: tune a narrow model under μP, then copy its hyperparameters to a wide one.
Vyas et al. (2023) found that μP networks of realistic width also behave alike in their representations and edge-of-stability dynamics.
Noci et al. (2024) tracked λ<sub>max</sub> through training and found it settles near 2/η at every width under μP.
Under the NTK parametrization, by contrast, it fell as width grew, and they traced the difference to feature learning.

## Method

The data are 24 points x<sub>i</sub> on [−1, 1] with targets `y = 0.8 sin(2.5x + φ)`, where the phase φ comes from the seed.
The network is `f(x) = β Σⱼ vⱼ tanh(α(wⱼ₀x + wⱼ₁))`, with n hidden units and 3n parameters.
Its loss is `L = (1/2m) Σᵢ (f(xᵢ) − yᵢ)²` over the m = 24 points, minimized by full-batch gradient descent with one η for every parameter.

Under SP, α = β = 1, the input weights start with variance 1/2, and the readout weights v<sub>j</sub> start with variance 1/n.
Under μP with base width 16, let r = n/16.
Then α = √r, β = 1/√r, and the input weights start with variance 1/(2r).
This is μP’s rule for SGD in Yang et al. (2021), with base width 16, written as multipliers so that one η serves every parameter.
Both parametrizations use the same random draws, so at width 16 they are the same network.

Since one η acts on all 3n parameters, λ<sub>max</sub> of their Hessian is the curvature that bounds η.
It comes from 20 Lanczos iterations with exact Hessian–vector products.

The sweep runs 100 steps from the initialization at 22 learning rates, six per decade from 0.001 to 3.2.
A run counts as diverged when its loss passes 10⁶.
The best η gives the lowest loss after 100 steps, and λ<sub>max</sub> is computed again where that run ended.
The sweep runs a little each frame, smallest widths first, so the curves fill in over several seconds.

The map is a plane through the initialization θ₀ at the current width, `θ₀ + 0.5(θ₁u₁ + (θ₂ + 0.6)u₂)`.
Here u₁ is the top eigenvector of the Hessian at θ₀, signed so that +θ₁ is downhill.
The direction u₂ is the readout part of the negative gradient, with its component along u₁ removed, so θ₂ moves only the readout weights.
Along θ₂ the loss is then exactly quadratic, which lets the plane be computed at any width.
The height is `0.5 log₁₀ L`, shifted so that the lowest point sits at 0.03, so 0.5 of height is a factor of ten in loss.
The hover reads this height, not the loss.

Each particle carries all 3n parameters and starts at the point of the plane where it was released.
It takes 100 full-batch steps at η/2, η or 2η, and is drawn at its projection onto the plane.
Its readout gives its own loss, and a particle that leaves the map keeps training off the map until its 100 steps are done.
Phones release only the particles at η and 2η.

## Limits

The sheet simplifies in three ways:

1. It has one hidden layer, 24 points, the squared loss and 100 steps of full-batch gradient descent.
2. Each curve falls until it ends, so the best η is the largest one that does not diverge.
   That ties the best η closely to 2/λ<sub>max</sub>, and the plate does not test whether this holds over longer training.
3. The map shows 2 of 3n directions, so a particle that leaves it has left the plane, not necessarily diverged.

In real networks the scaling depends on the loss, the optimizer and the depth.
With the squared loss, Haas et al. (2025) also measured SP’s largest stable learning rate falling like 1/width.
With cross-entropy it fell only like 1/√width, because the logits can grow without the training diverging.
μP for Adam scales the learning rates differently from SGD (Yang et al. 2021), and depth needs its own rule (Bordelon et al. 2024).
Everett et al. (2024) found that with a tuned learning rate for each layer, every parametrization they tried could transfer.

Transfer under μP worked in most of Lingle’s (2024) tests, but failed with trainable normalization gains and with coupled weight decay.
Kosson et al. (2026) argued that later in training, weight decay rather than μP keeps the updates stable across widths.

The sharpness account itself is debated.
Noci et al. (2024) presented consistent sharpness as the reason for transfer, and noted that other factors may also set the best learning rate.
Ghosh, Wu and Bietti (2026) found the link between such spectral measures and the best learning rate unclear.
They attribute transfer instead to a part of the trajectory that does not change with width.
Hayou (2026) proved transfer under μP for deep linear networks without appealing to sharpness.

## References

- Yang, G. and Hu, E. J. (2021). Tensor Programs IV: Feature learning in infinite-width neural networks. ICML.
  In SP, training stays stable at large width only with a learning rate of order 1/width, and the limit then learns no features; μP learns features.
- Yang, G., Hu, E. J., Babuschkin, I., Sidor, S., Liu, X., Farhi, D., Ryder, N., Pachocki, J., Chen, W. and Gao, J. (2021). Tensor Programs V: Tuning large neural networks via zero-shot hyperparameter transfer. NeurIPS.
  μTransfer: under μP the best hyperparameters stay put as width grows; the per-layer rules, defined relative to a base width where μP equals SP.
- Vyas, N., Atanasov, A., Bordelon, B., Morwani, D., Sainathan, S. and Pehlevan, C. (2023). Feature-learning networks are consistent across widths at realistic scales. NeurIPS.
  Under μP, representations and edge-of-stability dynamics agree across widths, with deviations that grow on harder tasks.
- Noci, L., Meterez, A., Hofmann, T. and Orvieto, A. (2024). Super consistency of neural network landscapes and learning rate transfer. NeurIPS.
  Under μP the sharpness follows the same course at every width, near 2/η; under the NTK parametrization it falls with width.
- Bordelon, B., Noci, L., Li, M. B., Hanin, B. and Pehlevan, C. (2024). Depthwise hyperparameter transfer in residual networks: dynamics and scaling limit. ICLR.
  μP alone does not transfer across depth; scaling residual branches by 1/√depth adds transfer in depth.
- Everett, K., Xiao, L., Wortsman, M., Alemi, A. A., Novak, R., Liu, P. J., Gur, I., Sohl-Dickstein, J., Kaelbling, L. P., Lee, J. and Pennington, J. (2024). Scaling exponents across parameterizations and optimizers. ICML.
  With per-layer learning rates and tuned per-layer constants, every parametrization tested transfers, up to 26.8 billion parameters.
- Lingle, L. (2024). An empirical study of μP learning rate transfer. arXiv:2404.05728.
  Transfer worked in most cases and failed with trainable normalization gains, the standard attention scale and coupled weight decay.
- Haas, M., Bordt, S., von Luxburg, U. and Vankadara, L. C. (2025). On the surprising effectiveness of large learning rates under standard width scaling. NeurIPS.
  Under SP the largest stable learning rate falls like 1/width with the squared loss, but only like 1/√width with cross-entropy.
- Kosson, A., Welborn, J., Liu, Y., Jaggi, M. and Chen, X. (2026). Weight decay may matter more than muP for learning rate transfer in practice. ICLR.
  μP’s assumptions hold only early in training; afterwards weight decay stabilizes the updates across widths.
- Ghosh, N., Wu, D. and Bietti, A. (2026). Understanding the mechanisms of fast hyperparameter transfer. ICLR.
  Finds the link between spectral measures and the best learning rate unclear, and proposes a width-stable part of the trajectory that sets it.
- Hayou, S. (2026). A proof of learning rate transfer under μP. AISTATS.
  For deep linear networks, the best learning rate tends to a nonzero constant with width under μP, but not under SP or the NTK parametrization.

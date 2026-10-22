# Grokking

## Subtitle

The training loss reaches its floor in tens of steps and the test loss thousands of steps later, carried there by weight decay.

## Lead

[[Grokking|grok]] is generalization that arrives long after the training data have been fitted.
Power et al. (2022) found it in small networks trained on modular arithmetic.
Their networks overfitted early, and test accuracy rose from chance to perfect much later.

The delay matters because a flat training curve then says nothing about the test loss.
A run stopped once its training loss had levelled off would keep a network that has only memorized.

Why the test loss waits is debated.
Liu, Michaud and Tegmark (2023) tie it to the weight norm: solutions with a large ‖θ‖ fit the training data but generalize badly.
[[Weight decay|wdecay]] then shrinks ‖θ‖ slowly, until it reaches norms that generalize.
This plate draws that account, so we can time the delay and see how it scales with λ and with the initialization.

## In practice

In grokking experiments, weaker weight decay makes the test loss wait longer (Nanda et al. 2023; Liu, Michaud and Tegmark 2023).
So a run whose training loss has reached zero while its test loss has not moved may simply be unfinished.
On several tasks a large initialization creates the delay (Liu, Michaud and Tegmark 2023).
Before concluding that a model cannot generalize, check its weight decay and its initialization scale.

## Figure caption

Above: mean training loss (solid) and test loss (dashed) of the latest [[cohort|cohort]], by optimizer, against steps on a log scale.
The dotted line is the threshold 0.1, and the faint verticals mark where the test loss is predicted to cross it.
Below: mean ‖θ‖, which falls steadily while the test loss still waits.
The green line is the norm below which the floor’s test loss is under 0.1.

## Try

1. Run a cohort at λ = 0.1 and α = 1.4 → the training loss falls below 0.1 at about step 26, the test loss at about step 1,600.
   That is about 60 times later, and with λ/4 the test loss takes about 6,400 steps.
   On the floor the gradient vanishes, so only weight decay moves θ, at a speed set by ηλ.
2. Halve λ to 0.05 → the test crossing moves to about 3,200 steps, and λ/4 no longer crosses within 10,000.
   The readout ηλ × (test step − training step) stays where it was, at about 1.6.
   The delay is a fixed distance along the floor, covered at a speed proportional to ηλ.
3. Follow the optimizer without weight decay → it reaches the floor with the others, then stays at ‖θ‖ ≈ 1.36 with test loss 0.63 for all 10,000 steps.
   Its training loss is as low as theirs, so its gradient gives it no reason to move.
4. Set α to 0.3 → all three optimizers bring both losses below 0.1 together, within about 25 steps.
   From a small start, gradient descent reaches the floor at its [[small-norm end|@Generalizing solution]], where the test loss is already low.
5. Set α to 0.8 → the cohort reaches the floor at ‖θ‖ ≈ 1.07 instead of 1.33, and its test loss crosses only about 250 steps sooner.
   On a straight floor the wait would be ln(r₁/r<sub>c</sub>)/ηλ, with r₁ the norm on reaching the floor and r<sub>c</sub> the norm that generalizes.
   So the starting norm enters through a logarithm, and λ through its inverse.

## Background

Power et al. found that smaller training sets need more optimization before the network generalizes.
Of the interventions they tried, weight decay improved data efficiency the most, more than halving the samples needed.

The mechanism is contested, and several accounts fit parts of the evidence:

1. Weight norm (Liu, Michaud and Tegmark 2023).
   Against the weight norm, the training loss is L-shaped and the test loss U-shaped, which they call the LU mechanism.
   The test loss is lowest in a [[Goldilocks zone|goldilocks]] of norms.
   Weight decay γ shrinks the norm as e<sup>−γt</sup>, so a start w₀ above the zone’s edge w<sub>c</sub> waits about ln(w₀/w<sub>c</sub>)/γ.
   A large initialization induced grokking on image, language and molecular tasks.
2. Circuits (Nanda et al. 2023).
   They reverse-engineered a one-layer transformer that learned modular addition with discrete Fourier transforms and trigonometric identities.
   Training passed through memorization, circuit formation and cleanup.
   Test accuracy jumped during cleanup, as weight decay removed the memorizing components.
3. Efficiency (Varma et al. 2023, a preprint).
   The generalizing circuit is slower to learn but more efficient: it produces larger logits for the same parameter norm.
   Memorizing grows less efficient as the dataset grows, which sets a critical dataset size.
   They also found ungrokking, where test accuracy falls back on a dataset below that size, and semi-grokking, where it rises only partway.
4. Lazy to rich (Kumar et al. 2024).
   A network first fits the data with its initial features, as in the [[kernel regime|lazy]], and generalizes once it learns new ones.
   In their models this happens without any regularization, and the scale of the output sets the delay.
5. Two implicit biases (Lyu et al. 2024).
   They studied homogeneous networks with initialization scale α and small weight decay λ.
   Training first stays near a kernel predictor, then turns sharply to a minimum-norm or maximum-margin solution, at a time of about `(1/λ) log α`.

Recent preprints add geometry.
Xu (2026a) found transformer training on modular arithmetic close to one-dimensional, with 68–83% of the variance on the first principal component.
Curvature across that direction grew 600–1,600 steps before generalization.
Without weight decay it still grew, but the models did not generalize in eleven of twelve runs.
In multi-task runs, Xu (2026b) found grokking time falling as a power of λ, and no generalization at λ = 0 in up to 250,000 steps.
Cullen et al. (2026) describe grokking as a move to a basin with a smaller learning coefficient (see <i>Singular minima and the learning coefficient</i>).

## Method

The sheet is the training loss, written in polar coordinates with r = ‖θ‖.
Its floor is a curve whose bearing turns smoothly by 0.7 to 0.9 rad between r = 1.45 and r = 0.35.
Write d for the distance from the floor.
Across the floor the loss is `0.8s/(1 + s)` with `s = 30d²/1.6`.
So the curvature across is 30, and the walls level off at 0.8.

Along the floor, from r = 0.35 to the edge of the sheet, the training loss is exactly zero.
As on every plate, zero is drawn at 0.03.
Inside r = 0.35 a dome `0.8(1 − r²/0.35²)²` rises to 0.83 at θ = 0.
There the parameters are too small to fit the data.
The sheet is symmetric, `L(−θ) = L(θ)`, so the floor has two arms.

The test loss is the training loss plus a gap that grows with the norm, 0.6/(1 + e<sup>−(r − r<sub>g</sub>)/0.05</sup>).
Here r<sub>g</sub> lies between 0.58 and 0.66, set by the seed.
On the floor the test loss is 0.63 at large norm and 0.03 at the small end.
It is under 0.1 below r<sub>c</sub> ≈ 0.5.
The green dashed contours show the test loss, and the hatching marks the floor where it exceeds 0.3.

All three optimizers are full-batch [[gradient descent|gd]] with η = 0.01 and no noise.
Two add decoupled weight decay, `θ ← θ − η(∇L + λθ)`, with λ and λ/4.
For plain gradient descent this is the same as adding an L2 penalty to the loss.

Each cohort has 8 particles per optimizer (4 on a phone), started at `θ₀ = αu` with a jitter of 0.006.
The direction u is 0.3 rad off the floor’s outer bearing, and cohorts alternate between the two arms.
Each cohort runs for 10,000 steps.

A crossing is the first step at which a particle’s loss is below 0.1, and the readouts average it over the cohort.
On the floor the gradient is zero, so each step is just `−ηλθ`.
Its component along the floor shrinks the norm at `dr/dt = −ηλ r cos²ψ`, with ψ the floor’s angle to the radius.
From the norm r₁ at the training crossing down to r<sub>c</sub>, that takes `(1/ηλ)∫(1 + tan²ψ)/r dr` steps.
The predicted test crossing adds this to the training crossing.
At α = 1.4 it falls within 1% of the measured crossing.
At α = 0.8 it comes about 6% early, because the cohort is still descending the wall when its training loss crosses 0.1.
On a straight floor through θ = 0 the integral is ln(r₁/r<sub>c</sub>), Liu et al.’s formula.

## Limits

The test loss on this sheet is posited, not computed from held-out data.
It encodes Liu et al.’s picture, a gap that grows with ‖θ‖, so the plate shows that picture’s consequences but cannot test it.

The floor is exactly level, so without weight decay nothing moves along it.
The sheet also leaves out gradient noise and per-coordinate scaling.
Most grokking experiments use AdamW, which this plate does not model.

In networks the weight-norm account is not the whole story.
On modular addition, Liu et al. found grokking even at standard initialization, and attributed it to representation learning.
There, grokking almost vanished only when a smaller initialization was combined with a weight norm held constant.

Weight decay is not always needed either, which is one reason the mechanism stays contested.
Kumar et al. and Lyu et al. show grokking without it, though for Lyu et al. the transition is then no longer sharp.
Liu et al. also saw grokking on molecular data with no weight decay, and attributed it to implicit regularization.
Nanda et al.’s transformers, by contrast, did not grok without weight decay or another regularizer.

Delayed generalization may also occur in language-model pretraining.
Muckatira et al. (2026) split grammar test items by whether their key phrase had appeared in pretraining.
Accuracy on the unseen items rose later than on the seen ones, across five grammatical phenomena.

## References

- Power, A., Burda, Y., Edwards, H., Babuschkin, I. and Misra, V. (2022). Grokking: generalization beyond overfitting on small algorithmic datasets. arXiv:2201.02177.
  Names grokking; smaller datasets need more optimization to generalize, and weight decay helps data efficiency most.
- Liu, Z., Michaud, E. J. and Tegmark, M. (2023). Omnigrok: grokking beyond algorithmic data. ICLR.
  The LU mechanism and the Goldilocks zone; the delay is about ln(w₀/w<sub>c</sub>)/γ; large initialization induces grokking beyond algorithmic data.
- Nanda, N., Chan, L., Lieberum, T., Smith, J. and Steinhardt, J. (2023). Progress measures for grokking via mechanistic interpretability. ICLR.
  Reverse-engineers modular addition; memorization, circuit formation and cleanup, with weight decay driving the cleanup.
- Varma, V., Shah, R., Kenton, Z., Kramár, J. and Kumar, R. (2023). Explaining grokking through circuit efficiency. arXiv:2309.02390.
  Generalizing circuits are more efficient; a critical dataset size; ungrokking and semi-grokking. Preprint.
- Kumar, T., Bordelon, B., Gershman, S. J. and Pehlevan, C. (2024). Grokking as the transition from lazy to rich training dynamics. ICLR.
  Grokking without regularization, as the move from kernel fitting to feature learning; the output scale sets the delay.
- Lyu, K., Jin, J., Li, Z., Du, S. S., Lee, J. D. and Hu, W. (2024). Dichotomy of early and late phase implicit biases can provably induce grokking. ICLR.
  With large initialization and small weight decay, a kernel predictor early and a min-norm or max-margin solution after about (1/λ) log α.
- Xu, Y. (2026a). Low-dimensional and transversely curved optimization dynamics in grokking. arXiv:2602.16746.
  Grokking trajectories are nearly one-dimensional, and curvature across them grows before generalization. Preprint.
- Xu, Y. (2026b). The geometry of multi-task grokking: transverse instability, superposition, and weight decay phase structure. arXiv:2602.18523.
  In multi-task modular arithmetic, grokking time falls as a power of λ, with no generalization at λ = 0. Preprint.
- Cullen, B., Estan-Ruiz, S., Danait, R. and Li, J. (2026). A basin-selection perspective on grokking via singular learning theory. arXiv:2603.01192.
  Grokking as a move from a memorizing basin to a generalizing one with a smaller learning coefficient. Preprint.
- Muckatira, S., Shivagunde, N., Deshpande, V. and Rumshisky, A. (2026). A pre-training analogue of grokking in language models: tracing delayed grammatical generalization. AACL-IJCNLP.
  Delayed generalization of grammar in language-model pretraining, from phrases seen in training to unseen ones.

# Sharpness-aware minimization

## Subtitle

A slope pitted with wells narrower than ρ, leading down to a broad basin.

## Lead

[[Sharpness-aware minimization|sam]] (Foret et al. 2021) takes the gradient at `θ + ρ∇L/‖∇L‖` instead of θ: a first-order approximation to minimizing the largest loss within distance ρ.
It improves test accuracy across many image and language tasks.
What it minimizes, and why that helps, are disputed (Andriushchenko and Flammarion 2022; Wen, Ma and Li 2023).

## In practice

SAM often improves test accuracy, but whether lower sharpness is the reason is disputed.
At large ρ it can stop where the gradient of L itself is not zero, so check that gradient at the end.

## Figure caption

Where each optimizer came to rest, as shares of its rings. SAM particles that stall beside a pit never come to rest and are not counted.

## Try

1. Read ‘SGD rest’ and ‘SAM rest’ at ρ = 0.09 → SGD rests in the pits and the basin, SAM only in the [[Broad Basin|@Broad Basin]].
2. Look just downhill of each pit → SAM particles stall there until retired: the ascent step lands where ∇L = 0, though ∇L at the particle is not.
3. Read ‘never at rest, SGD · SAM’ → in one 80-second run 192 SAM particles stalled, against 67 at rest in the basin.
4. Lower ρ to 0.02, below the pits’ width → some SAM rings land in the pits too, about a third on this seed.

## Background

Foret et al. (2021) defined the SAM objective as `max_{‖ε‖≤ρ} L(θ + ε)` and approximated the inner maximum by one normalized gradient step, `ε = ρ∇L/‖∇L‖`.
The update uses `∇L(θ + ε)`, with ε treated as a constant.
They reported gains on CIFAR, ImageNet and fine-tuning, and motivated the method by a PAC-Bayes bound.
Andriushchenko and Flammarion (2022) argued that neither that bound nor convergence to flat minima fully explains the gains, nor why computing ε on small sub-batches (m-sharpness) matters.
Wen, Ma and Li (2023) showed that each of SAM’s two approximations alone predicts the wrong effect.
They also proved that full-batch SAM reduces λ<sub>max</sub>, and SAM with batch size 1 reduces the trace of the Hessian.
Andriushchenko et al. (2023) found that sharpness correlates poorly with generalization in modern settings (see <i>Sharp and flat minima</i>).

Because SAM evaluates the gradient at θ + ε, it stops wherever `∇L(θ + ε(θ)) = 0`, and such points need not be critical points of L.
Park et al. (2026) proved that these hallucinated minimizers exist under simple conditions, gave conditions under which SAM converges to them, and reported them in network training at large ρ.

## Method

The surface is a gentle bowl tilted by `0.32θ₁`, with a broad Gaussian basin at its low end, two ridges, and five narrow Gaussian pits on the slope.
The pits have depth 0.22, width about 0.03 and Hessian eigenvalues 210–275 at their floors, against about 5 and 6 at the [[Basin floor|@Basin floor]].
SGD and SAM share η = 0.003 and isotropic gradient noise σ = 0.25.
SAM computes ε from the noisy gradient and uses the same noise at θ + ε, as with one minibatch.
Particles are released on the high ground, θ₁ &gt; 0.9.
The green dashed lines are contours of the largest loss over 24 points on the circle of radius ρ around each point, computed on a grid.
The readouts and the figure count rings within 0.06 of a pit’s floor, within 0.3 of the basin’s floor, or elsewhere.

## Caveat

The green contours show the objective SAM approximates, not where SAM stops.
Stalled particles never come to rest, so the rest counts and the figure leave them out.

## References

- Foret, P., Kleiner, A., Mobahi, H. and Neyshabur, B. (2021). Sharpness-aware minimization for efficiently improving generalization. ICLR.
  Introduces SAM: the worst loss within a ball of radius ρ, approximated by one normalized ascent step.
- Andriushchenko, M. and Flammarion, N. (2022). Towards understanding sharpness-aware minimization. ICML.
  Argues the PAC-Bayes and flat-minima explanations of SAM are incomplete, including for m-sharpness.
- Wen, K., Ma, T. and Li, Z. (2023). How does sharpness-aware minimization minimize sharpness? ICLR.
  Full-batch SAM reduces λ<sub>max</sub>; SAM with batch size 1 reduces the trace of the Hessian.
- Andriushchenko, M., Croce, F., Müller, M., Hein, M. and Flammarion, N. (2023). A modern look at the relationship between sharpness and generalization. ICML.
  Sharpness, even rescaling-invariant, correlates poorly with generalization in modern settings.
- Park, C., Jang, U., Ryu, E. K. and Yang, I. (2026). Sharpness-aware minimization can hallucinate minimizers. ICML (PMLR 306).
  SAM can converge to points where ∇L(θ + ε) = 0 but ∇L(θ) ≠ 0.

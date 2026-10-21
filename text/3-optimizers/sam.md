# Sharpness-aware minimization

## Subtitle

A slope with pits narrower than SAM’s radius ρ, leading down to a broad basin, to ask whether SAM skips sharp minima and where it stops.

## Lead

[[Sharpness-aware minimization|sam]] (Foret et al. 2021) aims to minimize the largest loss within a distance ρ of θ, rather than the loss at θ itself.
A pit narrower than ρ scores badly on that measure, since its walls lie within reach of its floor.
More concretely, SAM takes the gradient at `θ + ρ∇L/‖∇L‖` instead of at θ.
This is a first-order approximation to that objective.
It improves test accuracy across many image and language tasks (Foret et al. 2021; Bahri, Mobahi and Tay 2022).
What it minimizes, and why that helps, are disputed (Andriushchenko and Flammarion 2022; Wen, Ma and Li 2023).
Here we can see whether SAM skips such pits, and where it stops instead.

## In practice

SAM often improves test accuracy, but whether lower sharpness is the reason is disputed.
At large ρ it can stop where the gradient of L itself is not zero, so check that gradient at the end.

## Figure caption

Where each optimizer came to rest, as shares of its rings: in a pit, in the basin or elsewhere.
SAM particles that stall beside a pit never come to rest and are not counted.

## Try

1. Read ‘SGD rest’ and ‘SAM rest’ at ρ = 0.09 → [[SGD|sgd]] rests in the pits and the basin, SAM only in the [[Broad Basin|@Broad Basin]].
   Every pit is narrower than ρ, so SAM’s ascent step from inside a pit lands outside it.
2. Look just downhill of each pit → SAM particles stall there until they are retired.
   Their ascent step points up the slope, so on average it lands on the pit’s floor, where ∇L = 0, though ∇L at the particle is not.
   This is a hallucinated minimizer (see the Background).
3. Read ‘never at rest, SGD · SAM’ → in the first 80 seconds 216 SAM particles stalled, against 67 at rest in the basin.
4. Lower ρ to 0.02, below the pits’ width → SAM rings land in the pits too.
   After 80 seconds on this seed, 76 are in pits and 100 in the basin, against SGD’s 121 and 95.
   With ρ smaller than a pit, the ascent step no longer jumps out of it.

## Background

Foret et al. (2021) defined the SAM objective as `max_{‖ε‖≤ρ} L(θ + ε)` and approximated the inner maximum by one normalized gradient step, `ε = ρ∇L/‖∇L‖`.
The update uses `∇L(θ + ε)`, with ε treated as a constant.
They reported gains on CIFAR, ImageNet and fine-tuning, and motivated the method by a PAC-Bayes bound.

Why SAM helps is contested.
Andriushchenko and Flammarion (2022) argued that neither that bound nor convergence to flat minima fully explains the gains.
Nor do they fully explain why computing ε on small sub-batches (m-sharpness) matters.
Wen, Ma and Li (2023) showed that each of SAM’s two approximations above, taken alone, predicts the wrong effect.
They also proved that full-batch SAM reduces λ<sub>max</sub>, the Hessian’s largest eigenvalue, and that SAM with batch size 1 reduces the trace of the Hessian.
Andriushchenko et al. (2023) found that sharpness correlates poorly with generalization in modern settings (see <i>Sharp and flat minima</i>).

Because SAM evaluates the gradient at θ + ε, it stops wherever `∇L(θ + ε(θ)) = 0`, and such points need not be critical points of L.
Park et al. (2026) proved that such hallucinated minimizers exist under simple conditions, gave conditions under which SAM converges to them, and reported them in network training at large ρ.

## Method

The surface is a gentle bowl tilted by about `0.26θ₁`, with a broad Gaussian basin at its low end, two ridges, and five narrow Gaussian pits on the slope.
The pits have depth about 0.18, width about 0.03 and Hessian eigenvalues 210–275 at their floors, against about 5 and 6 at the [[Basin floor|@Basin floor]].
SGD and SAM share η = 0.003 and isotropic gradient noise σ = 0.25, so they differ only in where the gradient is taken.
SAM computes ε from the noisy gradient and uses the same noise at θ + ε, as with one minibatch.
Particles are released on the high ground, θ₁ &gt; 0.9.
The green dashed lines are contours of the largest loss over 24 points on the circle of radius ρ around each point, computed on a grid.
The readouts and the figure count rings within 0.06 of a pit’s floor, within 0.3 of the basin’s floor, or elsewhere.
The counts restart, and the particles in flight are retired, whenever ρ, η or σ changes.

## Caveat

The green contours show the objective SAM approximates, not where SAM stops.
The two part ways beside the pits, where the one-step ascent lands on a pit’s floor rather than on the highest point of the circle.
Stalled particles never come to rest, so the rest counts and the figure leave them out.

## At scale

Andriushchenko and Flammarion (2022) found that much of SAM’s gain in networks depends on computing ε on small sub-batches (m-sharpness), which a two-parameter surface with one noise source cannot show.
In high dimensions, full-batch SAM and SAM with batch size 1 reduce different quantities: λ<sub>max</sub> and the trace of the Hessian (Wen, Ma and Li 2023).
Each SAM step costs a second gradient.
Its clearest gains at scale are for vision transformers and MLP-Mixers trained without large-scale pretraining, and for fine-tuning language models (Bahri, Mobahi and Tay 2022).
In the first setting, Chen, Hsieh and Gong (2022) found that SAM raised ViT-B/16’s ImageNet top-1 accuracy by 5.3 points.
What survives at scale is the gain in these settings, while the reason for it is still disputed.

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
- Bahri, D., Mobahi, H. and Tay, Y. (2022). Sharpness-aware minimization improves language model generalization. ACL.
  SAM improves fine-tuned language models on GLUE, SuperGLUE and question answering, most when task data is scarce.
- Chen, X., Hsieh, C.-J. and Gong, B. (2022). When vision transformers outperform ResNets without pre-training or strong data augmentations. ICLR.
  SAM lets ViTs and MLP-Mixers trained from scratch on ImageNet beat similar ResNets; +5.3% top-1 for ViT-B/16.

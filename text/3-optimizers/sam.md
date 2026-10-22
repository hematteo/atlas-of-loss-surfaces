# Sharpness-aware minimization

## Subtitle

A slope with pits narrower than SAM’s radius ρ, leading down to a broad basin, to ask whether SAM skips sharp minima and where it stops.

## Lead

[[Sharpness-aware minimization|sam]] (Foret et al. 2021) aims to minimize the largest loss within a distance ρ of θ, rather than the loss at θ itself.
On this sheet the sharp minima are narrow pits.
A pit narrower than ρ scores badly on that measure, since its walls lie within reach of its floor.

SAM approximates this objective to first order by taking the gradient at `θ + ρ∇L/‖∇L‖` instead of at θ.
The method improves test accuracy across many image and language tasks (Foret et al. 2021; Bahri, Mobahi and Tay 2022).
What it minimizes, and why that helps, are disputed (Andriushchenko and Flammarion 2022; Wen, Ma and Li 2023).

On this plate we can see whether SAM skips such pits, and where it stops instead.

## In practice

At large ρ, SAM can stop where the gradient of L itself is not zero, so check that gradient at the end.

## Figure caption

Where each optimizer came to rest, as shares of its rings: in a pit, in the basin or elsewhere.
SAM particles that stall beside a pit never come to rest and are not counted.

## Try

1. Read ‘SGD rest’ and ‘SAM rest’ at ρ = 0.09 → [[SGD|sgd]] rests in the pits and the basin, SAM only in the [[Broad Basin|@Broad Basin]].
   Every pit is narrower than ρ, so SAM’s ascent step from inside a pit lands outside it.
2. Look just downhill of each pit → SAM particles stall there until they are retired.
   Their ascent step points up the slope, so on average it lands on the pit’s floor, where ∇L = 0.
   The gradient at the particle itself is not zero, so this is a hallucinated minimizer (see the Background).
3. Read ‘never at rest, SGD · SAM’ → in the first 80 seconds 216 SAM particles stalled, against 67 at rest in the basin.
4. Lower ρ to 0.02, below the pits’ width → SAM rings land in the pits too.
   After 80 seconds on this seed, 76 are in pits and 100 in the basin, against SGD’s 121 and 95.

## Background

Foret et al. defined the objective as `max_{‖ε‖≤ρ} L(θ + ε)`.
Their update uses `∇L(θ + ε)`, with the one-step ascent `ε = ρ∇L/‖∇L‖` treated as a constant.
They reported gains on CIFAR, ImageNet and fine-tuning, and motivated the method by a PAC-Bayes bound.

Andriushchenko and Flammarion argued that neither that bound nor convergence to flat minima fully explains the gains.
Nor do they fully explain why computing ε on small sub-batches (m-sharpness) matters.
Andriushchenko et al. (2023) found that sharpness correlates poorly with generalization in modern settings (see <i>Sharp and flat minima</i>).

Wen, Ma and Li showed that each of these two approximations, taken alone, predicts the wrong effect.
They also proved that full-batch SAM reduces λ<sub>max</sub>, the Hessian’s largest eigenvalue.
SAM with batch size 1, they proved, reduces the trace of the Hessian instead.

Because the gradient is taken at θ + ε, SAM stops wherever `∇L(θ + ε(θ)) = 0`.
Such points need not be critical points of L.
Park et al. (2026) proved that such hallucinated minimizers exist under simple conditions.
They also gave conditions under which SAM converges to them, and reported them in network training at large ρ.

## Method

The surface is a gentle bowl tilted by about `0.26θ₁`.
It has a broad Gaussian basin at its low end, two ridges, and five narrow Gaussian pits on the slope.
The pits have depth about 0.18 and width about 0.03.
Their floors have Hessian eigenvalues of 210–275, against about 5 and 6 at the [[Basin floor|@Basin floor]].

SGD and SAM share η = 0.003 and isotropic gradient noise σ = 0.25, so they differ only in where the gradient is taken.
SAM computes ε from the noisy gradient and uses the same noise at θ + ε, as with one minibatch.
Particles are released high on the slope, at θ₁ &gt; 0.9.

The green dashed lines are contours computed on a grid.
At each grid point they take the largest loss over 24 points on the circle of radius ρ around it.
A ring counts as in a pit within 0.06 of its floor, and in the basin within 0.3 of the basin’s floor.
The counts restart, and the particles in flight are retired, whenever ρ, η or σ changes.

## Limits

The green contours show the objective SAM approximates, not where SAM stops.
The two part ways beside the pits, where the one-step ascent lands on a pit’s floor rather than on the highest point of the circle.
A two-parameter surface with one noise source also cannot show m-sharpness.

Yet in networks, Andriushchenko and Flammarion found that much of SAM’s gain depends on it.
Each SAM step costs a second gradient.
Its clearest gains at scale are in two settings (Bahri, Mobahi and Tay 2022):

1. Vision transformers and MLP-Mixers trained without large-scale pretraining.
   There, Chen, Hsieh and Gong (2022) found that SAM raised ViT-B/16’s ImageNet top-1 accuracy by 5.3 points.
2. Fine-tuning language models.

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

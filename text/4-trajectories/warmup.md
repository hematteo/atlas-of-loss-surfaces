# Warmup

## Subtitle

Three schedules run down a gorge whose curvature across it falls a hundredfold downstream.

## Lead

Most large models use a [[learning-rate warmup|warmup]]: η rises from near zero to its peak over the first hundreds or thousands of steps (Goyal et al. 2017).
One of several competing explanations is curvature: warmup lets the iterate reach flatter regions, where `λ_max < 2/η`, before η peaks (Gilmer et al. 2022; Kalra and Barkeshli 2024).

## In practice

Warmup’s best-supported benefit is a larger tolerable peak learning rate.
Whether it works by lowering curvature, taming Adam’s early second-moment estimate or limiting update size is disputed.

## Figure caption

The product of the learning rate and the curvature across the floor of the gorge at each particle’s position, as log₁₀ ηλ averaged over the latest cohort. Above the dashed line, ηλ > 2 and the step is unstable across the gorge.

## Try

1. Leave η at 0.02 → without warmup, ηλ is 10 on the first step: particles are thrown onto the rim and the mean loss jumps about 0.9.
2. Watch the 100-step ramp → ηλ peaks near 3.5 and the loss rises about 0.37: particles bounce between the walls, which carries them downstream faster than the slope alone would.
3. Watch the 700-step ramp → ηλ peaks near 1.6, below the [[stability threshold|stab]], and the loss falls monotonically, yet the run without warmup reaches the shared minimum first.
4. Raise η to 0.04 → the 100-step ramp is thrown too, and the 700-step ramp’s ηλ briefly passes 2.

## Background

Goyal et al. (2017) introduced gradual warmup to train ResNet-50 on ImageNet with minibatches of 8,192 images.
With the learning rate scaled in proportion to the batch, optimization failed early in training; raising η linearly over the first five epochs fixed it.
Warmup is now standard, especially for transformers.

Why it helps is debated.
Gilmer et al. (2022) tracked the [[Hessian|hessian]] through training.
They found that warmup, like normalization layers and careful initialization, lets the early trajectory avoid or leave regions of high curvature for flatter regions that tolerate a larger learning rate.
For SGD and Adam, Kalra and Barkeshli (2024) found that warmup’s main benefit is a larger tolerable target η, because warmup moves the network to better-conditioned regions.
They also found that whether [[sharpness|sharpness]] falls or rises during warmup depends on the initialization and parametrization.
Zhou et al. (2026, a preprint) report that sharpness starts high in language-model pretraining and falls early.
They argue that a larger peak η needs a proportionally longer warmup.
Other accounts do not rest on curvature.
Liu et al. (2020) attribute Adam’s need for warmup to the high variance of its second-moment estimate over the first steps.
Kosson, Messmer and Jaggi (2024) attribute it to early updates that are large relative to the weights, and reduce the need for warmup by controlling the update size.

## Method

Across the gorge the loss is `H(1 − exp(−λv²/2H))`, where v is the distance from the floor and H = 1, so the walls have height H and the curvature across the floor is λ. λ falls exponentially along the gorge, from about 500 at the release point to about 5 at the far end, and the floor descends with slope 0.6.
Bars across the gorge mark λ = 500, 300, 200, 100, 50, 30, 20 and 10.
Every 1,900 steps six particles per schedule start together at the head, with isotropic noise σ = 0.01.
The ramps are `η(t) = η·min(1, (t+1)/W)` with W = 100 and 700.
The figure plots the cohort mean of `log₁₀ ηλ`, with λ the curvature of the floor at the particle’s position along the gorge.
Peak ηλ is the largest such value in the latest cohort.
Thrown is the percentage of particles that move more than 0.1 from the floor before θ₁ = 0.6, or leave the sheet.

## Caveat

The walls have a finite height, so a thrown particle cannot diverge: it lands beside the gorge and slides back in further downstream.
In a network a large enough step can make the loss diverge.
The sheet shows the instability that warmup avoids, not its cost.

## References

- Goyal, P., Dollár, P., Girshick, R., Noordhuis, P., Wesolowski, L., Kyrola, A., Tulloch, A., Jia, Y. and He, K. (2017). Accurate, large minibatch SGD: training ImageNet in 1 hour. arXiv:1706.02677.
  Gradual warmup for large-minibatch SGD with the linear scaling rule.
- Liu, L., Jiang, H., He, P., Chen, W., Liu, X., Gao, J. and Han, J. (2020). On the variance of the adaptive learning rate and beyond. ICLR.
  Attributes Adam’s need for warmup to the variance of its adaptive step early in training; proposes RAdam.
- Gilmer, J., Ghorbani, B., Garg, A., Kudugunta, S., Neyshabur, B., Cardoze, D., Dahl, G., Nado, Z. and Firat, O. (2022). A loss curvature perspective on training instabilities of deep learning models. ICLR.
  Warmup, normalization and initialization let training avoid or leave regions of high curvature.
- Kalra, D. S. and Barkeshli, M. (2024). Why warmup the learning rate? Underlying mechanisms and improvements. NeurIPS.
  The main benefit of warmup is tolerating a larger target η, by moving to better-conditioned regions.
- Kosson, A., Messmer, B. and Jaggi, M. (2024). Analyzing & reducing the need for learning rate warmup in GPT training. NeurIPS.
  Ties the need for warmup to the size of early updates; controlling it reduces that need.
- Zhou, Z., Sun, Y., Li, B., Wang, J., Wu, H., Wu, L. and Yan, J. (2026). How does local landscape geometry evolve in language model pre-training? arXiv:2609.39767.
  Sharpness is high early in pretraining and falls; argues that a larger peak η needs a longer warmup. Preprint.

# Warmup

## Subtitle

Three schedules run down a gorge whose curvature across the floor falls a hundredfold downstream, to ask when a warmup keeps the steps stable.

## Lead

Most large models are trained with a [[learning-rate warmup|warmup]]: the [[learning rate|lr]] η rises from near zero to its peak over the first hundreds or thousands of steps (Goyal et al. 2017).
Why this helps has several competing explanations.
One is curvature: warmup lets the iterate reach flatter regions, where the [[sharpness|sharpness]] is low enough that `λ_max < 2/η`, before η peaks (Gilmer et al. 2022; Kalra and Barkeshli 2024).
This sheet builds that account into the landscape, so we can see whether a ramp keeps ηλ below 2 until the ground flattens.

## In practice

The best-supported benefit of warmup is that training tolerates a larger peak learning rate.
A higher peak may also need a longer ramp, as this sheet shows when η doubles.
Whether warmup works by lowering curvature, taming Adam’s early second-moment estimate or limiting update size is disputed.

## Figure caption

The figure plots log₁₀ ηλ averaged over the latest cohort, where ηλ is the learning rate times the curvature across the floor of the gorge at each particle’s position.
Above the dashed line, ηλ > 2 and the step is unstable across the gorge, so the bouncing grows.

## Try

1. Leave η at 0.02 → without warmup, ηλ is 10 on the first step.
   Particles are thrown onto the rim, and the mean loss jumps by about 1, the height of the walls.
   This is because each step multiplies the distance from the floor by |1 − ηλ|.
2. Watch the 100-step ramp → ηλ peaks near 3.5 and the loss rises by about 0.37.
   Particles bounce between the walls, and the bouncing carries them downstream faster than the slope alone would.
   Up on a wall the loss is lower where the gorge is wider, so the gradient there also points downstream.
3. Watch the 700-step ramp → ηλ peaks near 1.6, below the [[stability threshold|stab]], and the loss falls monotonically.
   Even so, the run without warmup reaches the shared minimum first.
   Perhaps this is because the ramp’s small early steps move slowly downstream, while thrown particles land further down (see the Caveat).
4. Raise η to 0.04 → the 100-step ramp is thrown too, and the 700-step ramp’s ηλ briefly passes 2.
   Doubling the peak doubles η at every step of the ramp.

## Background

Gradual warmup was introduced as a fix for large-batch training.
Goyal et al. (2017) introduced gradual warmup to train ResNet-50 on ImageNet with minibatches of 8,192 images.
With the learning rate scaled in proportion to the batch, optimization failed early in training.
Raising η linearly over the first five epochs fixed it.
Vaswani et al. (2017) warmed up the Transformer linearly over its first 4,000 steps.
Warmup is now standard, especially for transformers.

Why it helps is debated.
Gilmer et al. (2022) tracked the [[Hessian|hessian]] through training.
They found that warmup, like normalization layers and careful initialization, lets the early trajectory avoid or leave regions of high curvature for flatter regions that tolerate a larger learning rate.
For SGD and Adam, Kalra and Barkeshli (2024) found that warmup’s main benefit is a larger tolerable target η, because warmup moves the network to better-conditioned regions.
They also found that whether [[sharpness|sharpness]] falls or rises during warmup depends on the initialization and parametrization.
Zhou et al. (2026, a preprint) report that sharpness starts high in language-model pretraining and falls early.
They argue that a larger peak η needs a proportionally longer warmup.

Other accounts do not rest on curvature:

1. Liu et al. (2020) attribute Adam’s need for warmup to the high variance of its second-moment estimate over the first steps.
   Early on, that estimate averages only a few squared gradients, so dividing by it can give erratic steps.
2. Kosson, Messmer and Jaggi (2024) attribute it to early updates that are large relative to the weights, and reduce the need for warmup by controlling the update size.

## Method

Across the gorge the loss is `H(1 − exp(−λv²/2H))`, where v is the distance from the floor and H = 1, so the walls have height H and the curvature across the floor is λ.
Along the gorge λ falls exponentially, from about 500 at the release point to about 5 at the far end, and the floor descends with slope 0.6.
Bars across the gorge mark λ = 500, 300, 200, 100, 50, 30, 20 and 10.
At η = 0.02, a full step is stable across the gorge only past the bar at 100, where ηλ = 2.
Every 1,900 steps six particles per schedule start together at the head, with isotropic noise σ = 0.01.
The ramps are `η(t) = η·min(1, (t+1)/W)` with W = 100 and 700.
The figure plots the cohort mean of `log₁₀ ηλ`, with λ the curvature of the floor at the particle’s position along the gorge.
Peak ηλ is the largest such value in the latest cohort, among particles not yet thrown.
Thrown is the percentage of particles that move more than 0.1 from the floor before θ₁ = 0.6, or leave the sheet.

## Caveat

The walls have a finite height, so a thrown particle cannot diverge.
It lands beside the gorge and slides back in further downstream.
In a network a large enough step can make the loss diverge.
So the sheet shows the instability that warmup avoids, but not what that instability costs in a network.
The lead of the run without warmup in Try 3 may not carry over either.

## At scale

With Adam the threshold applies to the [[preconditioned sharpness|psharp]], the curvature after Adam’s per-coordinate rescaling, which full-batch Adam raises to 38/η at β₁ = 0.9 and holds there (see <i>The edge of stability</i>).
A network also need not travel to flatter ground.
Instead, a step that is too large can set off a short loss spike after which the sharpness itself drops, which Lewkowycz et al. (2020) called the [[catapult|catapult]].
This sheet cannot show that, because here the curvature falls only as the particles travel downstream (see <i>Stability and catapults</i>).
Behind normalization layers, what matters is the size of the step relative to the size of the weights (see <i>Weight decay and scale invariance</i>).
That relative update size is what Kosson, Messmer and Jaggi tie warmup to, and a fixed gorge cannot show it.
What survives at scale is the outcome: warmup lets training tolerate a larger peak η, whichever way the network gets there.

## References

- Goyal, P., Dollár, P., Girshick, R., Noordhuis, P., Wesolowski, L., Kyrola, A., Tulloch, A., Jia, Y. and He, K. (2017). Accurate, large minibatch SGD: training ImageNet in 1 hour. arXiv:1706.02677.
  Gradual warmup for large-minibatch SGD with the linear scaling rule.
- Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, Ł. and Polosukhin, I. (2017). Attention is all you need. NeurIPS.
  The Transformer, trained with Adam and a linear warmup over 4,000 steps.
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
- Lewkowycz, A., Bahri, Y., Dyer, E., Sohl-Dickstein, J. and Gur-Ari, G. (2020). The large learning rate phase of deep learning: the catapult mechanism. arXiv:2003.02218.
  Above the stability threshold, a short loss spike lowers the curvature until training can converge.

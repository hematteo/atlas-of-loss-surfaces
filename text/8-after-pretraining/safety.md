# The safety basin

## Subtitle

A model of the safety basin’s geometry, not a measurement: three cohorts fine-tune an aligned model, and we see which leave the basin.

## Lead

Fine-tuning can remove safety training.
Qi et al. (2024) undid GPT-3.5 Turbo’s refusals by fine-tuning it on ten harmful training examples, and benign fine-tuning also weakened them.
So the question is how far, and in which directions, the weights can move before refusals break.

Peng et al. (2024) measured safety along random directions in weight space.
Along these directions an aligned model stays safe within a neighbourhood, the safety basin, and then fails in a sharp step.
Its capability, in contrast, declines gradually.

Here we can watch three kinds of fine-tuning leave the basin, or stay in it.

## In practice

Re-evaluate safety after any fine-tuning.
Benign data can weaken refusals too, so the check is needed after ordinary fine-tuning as well as after adversarial data.
Robustness along random directions says little about robustness to fine-tuning, which moves the weights along directions set by the data, not at random.

## Figure caption

Attack success rate along each cohort’s path, averaged over the latest cohort, for the first 800 steps.
A jump from low to high marks the step at which a cohort crossed the cliff.

## Try

1. Watch the figure → the harmful cohort crosses the cliff at about step 45, and the benign cohort at about steps 110 to 160.
   Crossing means an [[attack success rate|asr]] above 50%.
   The harmful target lies along θ₂, where the basin is narrow, and the benign minimum mostly along θ₁, where it is wider.
2. Watch the anchored cohort → it stays below 10% attack success.
   This cohort fine-tunes on the benign task with a penalty for moving off the alignment direction.
   Its task loss falls from 0.36 to about 0.03, against nearly 0 for the benign cohort.
   The penalty shrinks the θ₂ part of the update, which is what carried the benign cohort out.
3. Raise σ to 1 → some anchored particles cross the cliff near the far end of the [[Safety Basin|@Safety Basin]], then return.
   They cross along the alignment direction θ₁, where the basin ends at 0.95.
   The anchor penalizes only motion across that direction, along θ₂, so the extra noise can carry a particle past that end.

## Background

Qi et al. (2024) showed that fine-tuning GPT-3.5 Turbo on ten harmful training examples, at a cost under $0.20, removes its safety guardrails.
They also showed that fine-tuning on common benign instruction data degrades safety.

Peng et al. (2024) measured the safety of aligned open models along random directions in weight space.
They found a step-like shape and called it the safety basin.
From this landscape they computed a safety metric, VISAGE.
They also showed that fine-tuning compromises safety by pulling the model out of the basin.

Later work looked beyond random directions.
In larger models, Chen et al. (2026) found a step-like basin for capabilities too, which Peng et al. had not.
Larger models are more robust to random perturbations.

In Chen et al.’s account, pre-training forms a basic capability basin.
Alignment then forms smaller basins inside it for safety, mathematics and coding.
Along worst-case directions the landscape is sharp, and adversarial fine-tuning moves along nearly worst-case directions.
They argue that the size of the basin bounds how much any fine-tuning can degrade the model.

Yang et al. (2026) found the safety basin to be narrow.
The alignment direction is the weight difference between the aligned model and the one before safety training.
Updates along that direction preserve safety, while orthogonal updates erode it quickly.
Their method, AsFT, penalizes the orthogonal component of the update and anchors the plate’s third cohort.

## Method

The sheet is a slice of weight space through the [[Aligned model|@Aligned model]] at the origin.
It is spanned by the alignment direction θ₁ and a worst-case direction θ₂.

Refusal holds while `s(θ) = 1 − (θ₁/0.95)² − (θ₂/0.3)²` is positive.
That region is an ellipse with half-widths 0.95 along θ₁ and 0.3 along θ₂.
Every point inside the dashed circle of radius 0.3, the basin’s narrowest half-width, has s &gt; 0.

The relief is the [[attack success rate|asr]], `4% + 88% σ(−24s)`, where σ is the logistic function.
So attack success is near 4% well inside the ellipse and near 92% far outside.
The sharp switch at the edge is the cliff.
The [[Base model|@Base model]] at (−1.32, 0) has 92%.

Three cohorts of eight particles start at the aligned model and run SGD with η = 0.01 and noise σ = 0.3.
Each cohort minimizes its own loss:

1. Harmful fine-tuning minimizes `½‖θ − (0.16, 0.8)‖²`.
2. Benign fine-tuning minimizes a quadratic task loss, drawn as the orange contours.
   Its minimum (0.8, 0.36) lies outside the basin, and the cliff is 68% of the way there.
3. The anchored cohort adds the AsFT penalty `(λ/2)θ₂²`, with λ = 6, to the benign loss.
   The optimum of that sum, (0.8, 0.033), is inside the basin.

The figure averages attack success over each cohort.
“Left at step” is the first step at which any of its particles exceeds 50%.

## Caveat

The basin here is an ellipse with a known worst-case direction.
A real model differs in three ways:

1. The worst-case direction depends on the data.
2. Attack success is measured on a benchmark of harmful prompts.
3. A two-direction slice shows nothing of the other directions.

The sheet illustrates the published geometry; it does not test it.

## At scale

In d dimensions a random unit direction has an overlap of about 1/√d with any fixed direction.
For a model with a billion weights that is about 3 × 10⁻⁵.
So a basin probed along random directions looks wide almost by construction, while a worst-case direction finds its edge at once.

Safety does rest on few directions.
Wei et al. (2024) found that weights making up about 3% of the parameters and 2.5% of the ranks carry it.
Removing them broke safety while leaving utility largely intact.
In output space, Qi et al. (2025) found that alignment often changes mainly the first few tokens of a response.

So safety may be lost along a few sharp directions that random probes almost never meet.

## References

- Qi, X., Zeng, Y., Xie, T., Chen, P.-Y., Jia, R., Mittal, P. and Henderson, P. (2024). Fine-tuning aligned language models compromises safety, even when users do not intend to! ICLR.
  A few harmful examples remove safety alignment; benign fine-tuning also degrades it.
- Peng, S., Chen, P.-Y., Hull, M. and Chau, D. H. (2024). Navigating the safety landscape: measuring risks in finetuning large language models. NeurIPS.
  The safety basin along random directions, and the VISAGE metric.
- Chen, H., Wei, Z., Huang, Y., Zhang, Y., Dong, Y. and Zhu, J. (2026). Unveiling the basin-like loss landscape in large language models. ICLR.
  Capability and alignment basins; sharp worst-case directions; basin size bounds degradation.
- Yang, S., Zhang, Q., Liu, Y., Huang, Y., Jia, X., Ning, K., Yao, J., Wang, J., Dai, H., Song, Y. and Yuan, L. (2026). AsFT: anchoring safety during LLM fine-tuning within narrow safety basin. AAAI.
  The narrow safety basin around the alignment direction, and a penalty on orthogonal updates.
- Wei, B., Huang, K., Huang, Y., Xie, T., Qi, X., Xia, M., Mittal, P., Wang, M. and Henderson, P. (2024). Assessing the brittleness of safety alignment via pruning and low-rank modifications. ICML.
  Safety-critical regions are about 3% of parameters and 2.5% of ranks; removing them breaks safety, not utility.
- Qi, X., Panda, A., Lyu, K., Ma, X., Roy, S., Beirami, A., Mittal, P. and Henderson, P. (2025). Safety alignment should be made more than just a few tokens deep. ICLR.
  Alignment mainly changes the distribution of the first few output tokens.

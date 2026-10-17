# The safety basin

## Subtitle

A model of the safety basin’s geometry, not a measurement: three cohorts fine-tune an aligned model.

## Lead

Fine-tuning can remove safety training.
Qi et al. (2024) undid GPT-3.5 Turbo’s refusals with ten harmful examples; benign fine-tuning also weakened them.
Peng et al. (2024) found that, along random directions in weight space, an aligned model stays safe within a neighbourhood, the safety basin, then fails in a sharp step; its capability declines gradually.

## In practice

Re-evaluate safety after any fine-tuning: ten harmful examples undid GPT-3.5 Turbo’s refusals and benign data weakened them (Qi et al. 2024).
Random-direction robustness says little about fine-tuning.

## Figure caption

Attack success rate along each cohort’s path, averaged over the latest cohort, for the first 800 steps.

## Try

1. Watch the figure → the harmful cohort crosses the cliff (attack success above 50%) at about step 45, the benign cohort at about step 130 to 200.
2. Watch the anchored cohort → it stays below 10% attack success while its task loss falls from 0.36 to about 0.03; the benign cohort’s falls to nearly 0.
3. Raise σ to 1 → some anchored particles cross the cliff near the far end of the [[Safety Basin|@Safety Basin]], along θ₁, then return: the anchor penalizes only motion across θ₁.

## Background

Qi et al. (2024) showed that fine-tuning GPT-3.5 Turbo on ten adversarial examples, at a cost under $0.20, removes its safety guardrails, and that fine-tuning on common benign instruction data also degrades safety.
Peng et al. (2024) measured the safety of aligned open models along random directions in weight space and called the step-like shape they found the safety basin.
They proposed VISAGE, a safety metric computed from this landscape, and showed that fine-tuning compromises safety by pulling the model out of the basin.

Chen et al. (2026) reported the same shape for capabilities.
Larger models are more robust to random perturbations; pre-training forms a basic capability basin, and alignment forms smaller basins inside it for safety, mathematics and coding.
Along worst-case directions the landscape is sharp, and adversarial fine-tuning moves along nearly worst-case directions.
They argue that the size of the basin bounds how much any fine-tuning can degrade the model.
Yang et al. (2026) found the safety basin narrow.
Updates along the alignment direction, the weight difference between the aligned model and the one before safety training, preserve safety, while orthogonal updates erode it quickly.
Their method, AsFT, penalizes the orthogonal component of the update.

## Method

The sheet is a slice of weight space through the [[Aligned model|@Aligned model]] at the origin, spanned by the alignment direction θ₁ and a worst-case direction θ₂.
Refusal holds while `s(θ) = 1 − (θ₁/0.95)² − (θ₂/0.3)²` is positive; the relief is the [[attack success rate|asr]], `4% + 88% σ(−24s)`.
The [[Base model|@Base model]] at (−1.32, 0) has 92%.
Every point inside the dashed circle of radius 0.3, the basin’s narrowest half-width, has s &gt; 0.
Three cohorts of eight particles start at the aligned model and run SGD with η = 0.01 and noise σ = 0.3.
Harmful fine-tuning minimizes `½‖θ − (0.16, 0.8)‖²`.
Benign fine-tuning minimizes a quadratic task loss, the orange contours, whose minimum (0.8, 0.36) lies outside the basin; the cliff is 68% of the way there.
The anchored cohort adds the AsFT penalty `(λ/2)θ₂²`, λ = 6, whose optimum (0.8, 0.033) is inside.
The figure averages attack success over each cohort; “left at step” is the first step at which any of its particles exceeds 50%.

## Caveat

The basin here is an ellipse with a known worst-case direction.
In a real model the worst-case direction depends on the data, attack success is measured on a benchmark of harmful prompts, and a two-direction slice shows nothing of the other directions.
The sheet illustrates the published geometry; it does not test it.

## References

- Qi, X., Zeng, Y., Xie, T., Chen, P.-Y., Jia, R., Mittal, P. and Henderson, P. (2024). Fine-tuning aligned language models compromises safety, even when users do not intend to! ICLR.
  A few harmful examples remove safety alignment; benign fine-tuning also degrades it.
- Peng, S., Chen, P.-Y., Hull, M. and Chau, D. H. (2024). Navigating the safety landscape: measuring risks in finetuning large language models. NeurIPS.
  The safety basin along random directions, and the VISAGE metric.
- Chen, H., Wei, Z., Huang, Y., Zhang, Y., Dong, Y. and Zhu, J. (2026). Unveiling the basin-like loss landscape in large language models. ICLR.
  Capability and alignment basins; sharp worst-case directions; basin size bounds degradation.
- Yang, S., Zhang, Q., Liu, Y., Jia, X., Ning, K., Yao, J., Wang, J., Dai, H., Song, Y. and Yuan, L. (2026). AsFT: anchoring safety during LLM fine-tuning within narrow safety basin. AAAI.
  The narrow safety basin around the alignment direction, and a penalty on orthogonal updates.

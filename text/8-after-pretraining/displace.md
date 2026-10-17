# Likelihood displacement

## Subtitle

One hidden state is trained on one prompt, so every step can be followed.

## Lead

[[Direct preference optimization|dpo]] raises a chosen answer’s log-probability relative to a rejected one, yet the chosen answer often loses probability.
Razin et al. (2025) showed that this probability can go to an answer of opposite meaning: training a model to prefer <em>No</em> over <em>Never</em> can sharply raise <em>Yes</em>.
They proved the mechanism for single-token answers.

## In practice

A falling DPO loss does not mean the chosen answers became more likely; monitor their log-probabilities.
Filtering out pairs with similar hidden representations (high CHES) helped more than an SFT term.

## Figure caption

The chosen answer’s probability along each optimizer’s path in the latest race; dashed, the probability of Yes under DPO.

## Try

1. Watch the <em>No</em> over <em>Never</em> race → DPO’s π(No) rises from 0.48 to about 0.68 by step 300, then falls; π(Yes), dashed, passes it near step 900.
2. Watch to step 3,000 → π(Yes) reaches about 0.84, and DPO’s particles cross into the [[territory of Yes|@“Yes”]].
3. Compare IPO and DPO + NLL → IPO stops at margin 1 with π(No) about 0.66; DPO + NLL keeps raising π(No), to about 0.93.
4. Wait for the <em>No</em> over <em>Unsure</em> race → DPO’s π(No) rises throughout.

## Background

DPO (Rafailov et al. 2023) turns the KL-regularized reward maximization of RLHF into a classification loss on preference pairs, `−log σ(βm)`.
The margin m is the chosen answer’s log-probability ratio to a frozen reference model minus the rejected answer’s.
The loss depends only on m, so it can fall while both log-probabilities fall.
Razin et al. (2025) proved that for single-token answers a token’s log-probability change follows the alignment of its unembedding with `w₊ − w₋`, the difference of the two answers’ unembeddings.
They also proved that displacement is likely when those unembeddings are similar.
For whole responses they measure similarity with the CHES score, and removing high-CHES pairs reduced unintended unalignment more than adding an SFT term did.
They found the same with IPO.

Ren and Sutherland (2025) gave a complementary account from learning dynamics: a negative gradient on an unlikely response squeezes probability into the response that is already most likely.
Luo et al. (2026) linked this squeezing effect to curvature in logit space and reduced it with sharpness-aware minimization on the output layer.
IPO (Azar et al. 2024) replaces the logistic loss by `(m − 1/2τ)²`, which has a minimum at a finite margin.
Iterative reasoning preference optimization (Pang et al. 2024) adds the chosen answer’s negative log-likelihood to the DPO loss.

## Method

The particle is the last hidden state h of one prompt.
Four one-word answers read it through a frozen unembedding of unit vectors at −75° (<em>No</em>), −105° (<em>Never</em>), 10° (<em>Yes</em>) and 175° (<em>Unsure</em>), with `π = softmax(⟨wₖ, h⟩)`.
For one-token answers `m = ⟨w₊ − w₋, h − h_ref⟩`, so DPO and IPO move h along the fixed direction `d = w₊ − w₋`, the red line.
The sheet is `1.5(1 − π(No) − π(Never))` in the projection of <i>The pull of softmax</i>; dashed rays bound each answer’s territory.
Races start at the [[Reference model|@Reference model]], h = (0, −3), and alternate between the two pairs, with η = 0.05, β = 1, τ = 0.5, α = 0.3 and no noise.
To first order a step `Δh = cd` changes log π(No) by `c⟨w₊ − w̄, d⟩`, with `w̄ = Σπₖwₖ`.
This predicts the sign of every change in π(No) except 4 of 15,000 steps, all at the peak.
The figure averages π(No) over each optimizer’s particles.

## Caveat

In a network the hidden state is computed from the prompt by weights that every prompt and token share.
Here h moves freely and the unembedding is frozen, so the sheet shows the single-token mechanism, not how large the effect is in a trained model.

## References

- Rafailov, R., Sharma, A., Mitchell, E., Manning, C. D., Ermon, S. and Finn, C. (2023). Direct preference optimization: your language model is secretly a reward model. NeurIPS.
  Introduces DPO.
- Azar, M. G., Rowland, M., Piot, B., Guo, D., Calandriello, D., Valko, M. and Munos, R. (2024). A general theoretical paradigm to understand learning from human preferences. AISTATS.
  Introduces IPO, a squared loss with a finite target margin.
- Pang, R. Y., Yuan, W., Cho, K., He, H., Sukhbaatar, S. and Weston, J. (2024). Iterative reasoning preference optimization. NeurIPS.
  Adds the chosen answer’s negative log-likelihood to the DPO loss.
- Razin, N., Malladi, S., Bhaskar, A., Chen, D., Arora, S. and Hanin, B. (2025). Unintentional unalignment: likelihood displacement in direct preference optimization. ICLR.
  The No/Never/Yes example, the single-token theory, and CHES-based filtering.
- Ren, Y. and Sutherland, D. J. (2025). Learning dynamics of LLM finetuning. ICLR.
  The squeezing effect of negative gradients on unlikely responses.
- Luo, H., Deng, Z., Do, T.-T., Harandi, M., Phung, D. and Le, T. (2026). Sharpness-aware minimization in logit space efficiently enhances direct preference optimization. ICLR.
  Relates squeezing to logit-space curvature and applies SAM to the output layer.

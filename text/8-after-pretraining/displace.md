# Likelihood displacement

## Subtitle

One hidden state is trained on one prompt, so we can follow where the chosen answer’s probability goes.

## Lead

[[Direct preference optimization|dpo]] (DPO) raises a chosen answer’s log-probability relative to a rejected one, so we might expect the chosen answer to become more likely.
Yet the chosen answer often loses probability (Pal et al. 2024), an effect called likelihood displacement.

Razin et al. (2025) showed that this probability can go to an answer of opposite meaning.
Training a model to prefer <em>No</em> over <em>Never</em> can sharply raise <em>Yes</em>.
They proved the mechanism for single-token answers and extended the analysis to whole responses.

Here we can watch that probability move and compare two fixes.

## In practice

A falling DPO loss does not mean that the chosen answers became more likely, so monitor their log-probabilities.
Pairs whose two answers have similar hidden representations, measured by a high CHES score, are the most prone to displacement.
In Razin et al.’s experiments, filtering out such pairs helped more than adding an [[SFT|sft]] term.

## Figure caption

The chosen answer’s probability along each optimizer’s path in the latest race; dashed, the probability of Yes under DPO.
Where the dashed line crosses DPO’s, Yes has overtaken the chosen answer.

## Try

1. Watch the <em>No</em> over <em>Never</em> race → DPO’s π(No) rises from 0.48 to about 0.68 by step 300, then falls.
   The dashed π(Yes) overtakes it just before step 1,000.
   The unembeddings of No and Never point nearly the same way, and their difference d points almost at Yes.
   So each step raises the logit of Yes most.
   π(No) falls once Yes has gained enough weight (see the Method).
2. Watch to step 3,000 → π(Yes) reaches about 0.84, and DPO’s particles cross into the [[territory of Yes|@“Yes”]].
   The DPO loss never stops this, since it keeps falling as the margin grows.
3. Compare IPO and DPO + NLL → IPO stops at margin 1, with π(No) about 0.66, while DPO + NLL keeps raising π(No), to about 0.93.
   DPO + NLL adds the chosen answer’s negative log-likelihood.
   IPO’s loss is lowest at margin 1/2τ, which is 1 here.
   The NLL term adds a step along w₊ − w̄, which raises No directly.
4. Wait for the <em>No</em> over <em>Unsure</em> race → DPO’s π(No) rises throughout.
   Here d points closer to No than to any other answer.

## Background

Reinforcement learning from human feedback (RLHF) maximizes a KL-regularized reward.
DPO (Rafailov et al. 2023) turns that maximization into a classification loss on preference pairs, `−log σ(βm)`, with σ the logistic function.
The margin m is the chosen answer’s log-probability ratio to a frozen reference model minus the rejected answer’s.
The loss depends only on m, so it can fall while both log-probabilities fall.

Each answer token has an unembedding, the vector that maps the hidden state to its logit.
Razin et al.’s single-token proof shows that a token’s log-probability change follows the alignment of its unembedding with `w₊ − w₋`.
That vector is the difference of the two answers’ unembeddings.
They also proved that displacement is likely when those two unembeddings are similar.

The CHES filtering (see In practice) comes from their analysis of whole responses.
It reduced unintended unalignment more than an added SFT term did, under IPO as well as DPO.

Ren and Sutherland (2025) gave a complementary account from learning dynamics.
A negative gradient on an unlikely response squeezes probability into the response that is already most likely.
Luo et al. (2026) linked this squeezing effect to curvature in logit space and reduced it with [[sharpness-aware minimization|sam]] on the output layer.

The two fixes on this sheet change the DPO loss:

1. IPO (Azar et al. 2024) replaces the logistic loss by `(m − 1/2τ)²`.
2. DPO + NLL comes from iterative reasoning preference optimization (Pang et al. 2024).

## Method

The particle is the last hidden state h of one prompt.
Four one-word answers read it through a frozen unembedding, with `π = softmax(⟨wₖ, h⟩)`.
The unembeddings are unit vectors at −75° (<em>No</em>), −105° (<em>Never</em>), 10° (<em>Yes</em>) and 175° (<em>Unsure</em>).

For one-token answers `m = ⟨w₊ − w₋, h − h_ref⟩` is linear in h.
So DPO and IPO move h along the fixed direction `d = w₊ − w₋`, drawn as the red line.

The sheet is `1.5(1 − π(No) − π(Never))` in the projection of <i>The pull of softmax</i>.
Dashed rays bound each answer’s territory.
The figure averages π(No) over each optimizer’s particles.

Races start at the [[Reference model|@Reference model]], h = (0, −3), and alternate between the two pairs.
They use η = 0.05, β = 1, τ = 0.5 and no noise, and the NLL term has weight α = 0.3.

To first order a step `Δh = cd` changes log π(No) by `c⟨w₊ − w̄, d⟩`.
Here `w̄ = Σπₖwₖ` is the probability-weighted average unembedding.
So No gains while it is better aligned with d than that average is.
This predicts the sign of every change in π(No) except 4 of 15,000 steps, all at the peak.

## Limits

Here h moves freely and the unembedding is frozen.
So the sheet shows the single-token mechanism, not how large the effect is in a trained model.

In trained models, Razin et al. found the effect in OLMo-1B and in Llama-3-8B-Instruct.
In the Llama model, DPO on safety data lowered the refusal rate from 74.4% to 33.4%.

A real vocabulary has about 10⁵ tokens, far more than the hidden size of 10³ to 10⁴.
So many unembeddings point in similar directions.

In a network the hidden state is computed from the prompt by weights that every prompt and token share.
So fine-tuning changes h for every prompt at once.

## References

- Rafailov, R., Sharma, A., Mitchell, E., Manning, C. D., Ermon, S. and Finn, C. (2023). Direct preference optimization: your language model is secretly a reward model. NeurIPS.
  Introduces DPO.
- Azar, M. G., Guo, Z. D., Piot, B., Munos, R., Rowland, M., Valko, M. and Calandriello, D. (2024). A general theoretical paradigm to understand learning from human preferences. AISTATS.
  Introduces IPO, a squared loss with a finite target margin.
- Pang, R. Y., Yuan, W., Cho, K., He, H., Sukhbaatar, S. and Weston, J. (2024). Iterative reasoning preference optimization. NeurIPS.
  Adds the chosen answer’s negative log-likelihood to the DPO loss.
- Pal, A., Karkhanis, D., Dooley, S., Roberts, M., Naidu, S. and White, C. (2024). Smaug: fixing failure modes of preference optimisation with DPO-Positive. arXiv:2402.13228.
  First showed that DPO can lower the likelihood of the preferred answers, and added a term that keeps it from falling.
- Razin, N., Malladi, S., Bhaskar, A., Chen, D., Arora, S. and Hanin, B. (2025). Unintentional unalignment: likelihood displacement in direct preference optimization. ICLR.
  The No/Never/Yes example, the single-token theory and its extension to whole responses, and CHES-based filtering.
- Ren, Y. and Sutherland, D. J. (2025). Learning dynamics of LLM finetuning. ICLR.
  The squeezing effect of negative gradients on unlikely responses.
- Luo, H., Deng, Z., Do, T.-T., Harandi, M., Phung, D. and Le, T. (2026). Sharpness-aware minimization in logit space efficiently enhances direct preference optimization. ICLR.
  Relates squeezing to logit-space curvature and applies SAM to the output layer.

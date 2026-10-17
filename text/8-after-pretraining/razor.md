# RL’s razor

## Subtitle

Policy gradient, natural policy gradient and two kinds of supervised fine-tuning solve a three-answer task.

## Lead

Shenfeld et al. (2026) found that fine-tuning with RL causes less forgetting than [[supervised fine-tuning|sft]] at equal accuracy on the new task.
How much a model forgot tracked the [[KL divergence|kl]] from the base policy, `E[KL(π₀ ‖ π)]`, measured on the new task’s prompts.
They argue that on-policy RL picks the solution nearest the base model.
Their theory covers an idealized case.

## In practice

As a proxy for forgetting, track the forward KL, E[KL(π₀ ‖ π)], on new-task prompts.
In Shenfeld et al.’s experiments it predicted forgetting across methods, and on-policy RL kept it below SFT’s.

## Figure caption

Distance from the base model, KL(π₀ ‖ π), against the error on the new task, for each optimizer in the latest race. Error falls to the right, by factors of ten.

## Try

1. Watch the first race → when the error first falls below 10%, [[natural policy gradient|npg]] and the oracle (‘SFT on π₀ given success’) lie lowest, at a KL of about 0.75.
2. Compare the others → plain policy gradient lies a little higher, at about 0.9, and SFT on the teacher far higher, at about 1.7.
3. Watch the readouts → by the end of the race, policy gradient’s ratio between the two right answers, A:B, has grown about ×240 from where it started, favouring the likelier one, while natural policy gradient’s stays at ×1.00.
4. Follow natural policy gradient → it ends at the [[I-projection|iproj]], marked [[π₀ given success|@π₀ given success]]: keeping the base model’s A:B ratio gives the lowest KL, in either direction, at every error.

## Background

Fine-tuning on a new task erodes what a model could do before.
Shenfeld et al. (2026) fine-tuned language models and a robotic foundation model with RL and with supervised fine-tuning (SFT), and compared how much prior capability each kept at a given accuracy on the new task.
RL kept more.
Across methods and hyperparameters, forgetting was best predicted by the forward KL divergence `E_x[KL(π₀ ‖ π)]` measured on new-task prompts.
In their toy task the reverse divergence predicted it almost as well (R² 0.93 against 0.96).
SFT on an oracle distribution, the one closest in KL to the base model among those with full accuracy, forgot even less than RL.
They could compute the oracle only in a toy task.

For a binary reward and a convex policy class such as an exponential family, they treat policy gradient as an EM procedure.
Rejection sampling of correct answers is an information projection, and the full refit of the policy to them that follows is an M-projection.
It converges to `argmin KL(π ‖ π₀)` over the optimal policies: the [[I-projection|iproj]], which is the base policy restricted to correct answers and renormalized.
They call this RL’s razor, and note that neural parametrizations may prevent exact convergence.
In weight space, Zhu et al. (2025) found that RLVR updates avoid the principal directions of the pretrained weights and barely change their spectrum, while SFT targets those directions.

## Method

The policy is `π = softmax(θ₁, θ₂, 0)` over three answers, drawn as in <i>The pull of softmax</i>.
A and B are right and C is wrong; the sheet is the error, `1.5π(C)`.
Races cycle through four base models, starting with π₀ = (0.3, 0.1, 0.6).
The dashed purple lines are `KL(π₀ ‖ π)`, the forgetting predictor.
The [[π₀ given success|@π₀ given success]] mark is the I-projection, labelled with `KL(π ‖ π₀) = −log π₀(right)`.
Updates use η = 0.05 and exact gradients.
Policy gradient follows `∇J`; natural policy gradient adds `η(1, 1)` to the logits, so `π ∝ π₀ exp(ηt r)`.
SFT follows `∇log π(y)` for a teacher who always gives the right answer the base model finds less likely, and the oracle follows the cross-entropy gradient towards the I-projection.
All updates move θ₁ and θ₂ only.
Every solution has infinite `KL(π₀ ‖ π)`, because π₀ gives the wrong answer probability and a solution gives it none.
The figure therefore compares optimizers at equal error, plotting `KL(π₀ ‖ π)` against −log₁₀ error; particles retire when the error falls below 10<sup>−7</sup>.

## Caveat

The theorem of Shenfeld et al. covers exponential families, and this softmax is one, but it treats each step as a full refit of the policy.
Plain small-step gradient ascent on the logits does not reach the I-projection, so on this sheet the razor holds exactly only for natural policy gradient.

## At scale

Chen, Razin, Narasimhan and Chen (2026) confirmed with Llama and Qwen models that RL forgets less than SFT at comparable accuracy on the new task, but traced the difference to on-policy data rather than to the algorithm.
In their runs REINFORCE, with no advantage estimate, forgot about as little as GRPO, and SFT on data the model regenerates at the start of each epoch forgot little or nothing.
They attribute the effect to the mode-seeking behaviour that on-policy data gives RL.

## References

- Kakade, S. M. (2001). A natural policy gradient. NeurIPS.
  Natural policy gradient, which for softmax policies is the multiplicative-weights update.
- Shenfeld, I., Pari, J. and Agrawal, P. (2026). RL’s razor: why online reinforcement learning forgets less. ICLR.
  Forgetting tracks forward KL on the new task; policy gradient converges to the I-projection in an idealized setting.
- Zhu, H., Zhang, Z., Huang, H., Su, D., Liu, Z., Zhao, J., Fedorov, I., Pirsiavash, H., Sha, Z., Lee, J., Pan, D. Z., Wang, Z., Tian, Y. and Tai, K. S. (2025). The path not taken: RLVR provably learns off the principals. arXiv:2511.08567.
  RLVR updates avoid the principal directions of pretrained weights; SFT does not.
- Chen, H., Razin, N., Narasimhan, K. and Chen, D. (2026). Retaining by doing: the role of on-policy data in mitigating forgetting. ICML.
  RL forgets less than SFT because its data are on-policy; iterative SFT on self-generated data forgets little too.

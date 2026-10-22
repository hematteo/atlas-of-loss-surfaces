# RL’s razor

## Subtitle

Policy gradient, natural policy gradient and two kinds of supervised fine-tuning solve a three-answer task, to see which stays closest to the base model.

## Lead

Fine-tuning on a new task makes a model forget some of what it could do before.
Shenfeld et al. (2026) found that fine-tuning with RL causes less forgetting than [[supervised fine-tuning|sft]] at equal accuracy on the new task.
How much a model forgot tracked the [[KL divergence|kl]] from the base policy π₀ on the new task’s prompts, `E[KL(π₀ ‖ π)]`.

A task with more than one right answer has many solutions, at different distances from the base model.
Shenfeld et al. argue that on-policy RL picks the one nearest the base model.
Their theory covers an idealized case, and here we can check which optimizers find that solution.

## In practice

As a proxy for forgetting, track the forward KL, E[KL(π₀ ‖ π)], on new-task prompts.
It needs only the two models’ outputs on those prompts, not evaluations on the old tasks.
In Shenfeld et al.’s experiments it predicted forgetting across methods, and on-policy RL kept it below SFT’s.

## Figure caption

Distance from the base model, KL(π₀ ‖ π), against the error on the new task, for each optimizer in the latest race.
Error falls to the right, by factors of ten.
So the lower a curve, the less its optimizer has moved to reach a given error.

## Try

1. Watch the first race until the error falls below 10% → [[natural policy gradient|npg]] and the oracle lie lowest, at a KL of about 0.75.
   The oracle is the curve labelled ‘SFT on π₀ given success’.
2. Compare the others → plain policy gradient lies just above them, at about 0.78, and SFT on the teacher far higher, at about 1.26.
   Policy gradient’s gap widens as the error falls: at 1% error its KL is 2.21, against 2.09 for natural policy gradient.
   SFT’s teacher always gives the less likely right answer, so SFT must move far from the base model.
3. Watch the readouts → by the end of the race, policy gradient’s A:B ratio has grown about ×15, while natural policy gradient’s stays at ×1.00.
   A:B is the ratio between the two right answers.
   The [[policy gradient|pg]] of a right answer’s logit is proportional to its probability, so the likelier one gains faster.
   Natural policy gradient raises both logits equally.
4. Follow natural policy gradient → it ends at the [[I-projection|iproj]], marked [[π₀ given success|@π₀ given success]].
   That point is the base model with C removed and A and B in their base proportions.
   Keeping the base model’s A:B ratio gives the lowest KL, in either direction, at every error.

## Background

Shenfeld et al. ran their comparison on language models and on a robotic foundation model.
Across methods and hyperparameters, the forward KL was the best predictor of forgetting.
In their toy task the reverse divergence, with π and π₀ swapped, predicted it almost as well (R² 0.93 against 0.96).

SFT on an oracle distribution forgot even less than RL.
That oracle is the distribution closest in KL to the base model among those with full accuracy.
They could compute it only in a toy task.

For a binary reward and a convex policy class such as an exponential family, Shenfeld et al. treat policy gradient as an expectation-maximization (EM) procedure.
Rejection sampling of correct answers is an information projection.
The policy is then refit fully to those answers, which is an M-projection.

This procedure converges to `argmin KL(π ‖ π₀)` over the optimal policies.
That minimizer is the [[I-projection|iproj]]: the base policy restricted to correct answers and renormalized.
They call this RL’s razor, and note that neural parametrizations may prevent exact convergence.

In weight space, the principal directions of each pretrained weight matrix are its top singular vectors.
Zhu et al. (2025) found that [[RLVR|rlvr]] updates avoid these directions and barely change the weights’ spectrum, while SFT targets them.

## Method

The policy is `π = softmax(θ₁, θ₂, 0)` over three answers, drawn as in <i>The pull of softmax</i>.
A and B are right and C is wrong, and the sheet is the error, `1.5π(C)`.
Races cycle through four base models, starting with π₀ = (0.3, 0.1, 0.6).

The dashed purple lines are `KL(π₀ ‖ π)`, the forgetting predictor.
The [[π₀ given success|@π₀ given success]] mark is labelled with `KL(π ‖ π₀) = −log π₀(right)`.

Updates use η = 0.05 and exact gradients.
As in <i>The pull of softmax</i>, each gradient is taken in all three logits, which are then shifted so that θ₃ stays 0.
Each optimizer has its own update:

1. Policy gradient follows `∇J`.
2. Natural policy gradient adds `η(1, 1)` to the logits, so `π ∝ π₀ exp(ηt r)`.
   After t steps, every right answer’s probability has been multiplied by the same factor.
3. SFT follows `∇log π(y)` for the teacher’s answer y.
4. The oracle follows the cross-entropy gradient towards the I-projection.

Every solution has infinite `KL(π₀ ‖ π)`, because π₀ gives the wrong answer probability and a solution gives it none.
So the figure compares optimizers at equal error.
Particles retire when the error falls below 10<sup>−7</sup>.

## Limits

Shenfeld et al.’s theorem covers this softmax, an exponential family, but treats each step as a full refit of the policy.
Plain small-step gradient ascent on the logits does not reach the I-projection.
So on this sheet the razor holds exactly only for natural policy gradient.
Like a full refit, natural policy gradient keeps the ratio between the right answers fixed (Try 3).

In Llama and Qwen models, Chen, Razin, Narasimhan and Chen (2026) confirmed that RL forgets less than SFT at comparable accuracy on the new task.
They traced the difference to on-policy data, sampled from the model being trained, rather than to the algorithm.

In their runs REINFORCE, which has no advantage estimate, forgot about as little as GRPO.
SFT on data that the model regenerates at the start of each epoch forgot little or nothing.
They attribute the effect to the mode-seeking behaviour that on-policy data gives RL.
In their mixture model, RL minimizes a reverse KL, which can move one mode of the policy onto the new task and leave the old mode intact.
SFT minimizes a forward KL, which covers the new task by pulling probability away from the old mode.

## References

- Kakade, S. M. (2001). A natural policy gradient. NeurIPS.
  Natural policy gradient, which for softmax policies is the multiplicative-weights update.
- Shenfeld, I., Pari, J. and Agrawal, P. (2026). RL’s razor: why online reinforcement learning forgets less. ICLR.
  Forgetting tracks forward KL on the new task; policy gradient converges to the I-projection in an idealized setting.
- Zhu, H., Zhang, Z., Huang, H., Su, D., Liu, Z., Zhao, J., Fedorov, I., Pirsiavash, H., Sha, Z., Lee, J., Pan, D. Z., Wang, Z., Tian, Y. and Tai, K. S. (2025). The path not taken: RLVR provably learns off the principals. arXiv:2511.08567.
  RLVR updates avoid the principal directions of pretrained weights; SFT does not.
- Chen, H., Razin, N., Narasimhan, K. and Chen, D. (2026). Retaining by doing: the role of on-policy data in mitigating forgetting. ICML.
  RL forgets less than SFT because its data are on-policy; iterative SFT on self-generated data forgets little too.

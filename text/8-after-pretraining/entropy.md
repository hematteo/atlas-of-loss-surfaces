# Entropy collapse

## Subtitle

GRPO chooses among three solution strategies, and the figure tracks the policy’s entropy.

## Lead

Cui et al. (2025) found that reinforcement learning from verifiable rewards ([[RLVR|rlvr]]) makes a reasoning model’s [[policy entropy|entropy]] fall sharply early in training.
Once the entropy is used up, accuracy stops improving.
Whether RL narrows what the base model can solve, as measured by [[pass@k|passk]] at large k, is disputed (Yue et al. 2025; Liu et al. 2025).

## In practice

Track policy entropy during RLVR.
In Cui et al.’s runs, an early collapse came before accuracy saturated.
Also compare pass@k at large k with the base model’s, since whether RL narrows it is disputed.

## Figure caption

Entropy of each optimizer’s policy in the latest race. Dashed: GRPO’s entropy predicted by summing −Cov(log π, Δz) over its steps.

## Try

1. Watch the figure → [[GRPO|grpo]]’s entropy falls below 0.1 nats within about 700 steps, and the dashed first-order prediction lies on top of it: each step changes the entropy by about `−Cov_π(log π, Δz)`, with Δz the change in the logits.
2. Wait for the race to end → GRPO sits on the <em>Shortcut</em>, which has the highest pass@1, 0.54, and its pass@16 has fallen to 0.60 from 0.92 or more.
3. Compare the other two optimizers → the pass@16 objective reaches a pass@16 of 0.999, and the entropy bonus holds a mixture that lies between it and GRPO.
4. Wait for a race from the [[base model|@Base model]] that favours <em>Guess</em> (0.65) → GRPO’s entropy rises before it collapses.

## Background

GRPO (Shao et al. 2024) samples a group of solutions for each problem.
It gives each solution an advantage equal to its reward minus the group mean, divided by the group’s standard deviation, and needs no value network.
Cui et al. (2025) observed that in RLVR the entropy drops sharply early and accuracy then follows an empirical law `R = −a e^H + b`, so accuracy rises as entropy falls.
They derived that for a softmax policy one step changes the entropy by approximately `−Cov_π(log π(a), Δz(a))`, with Δz the change in the logits.
Under exact policy gradient `Δz(a)` is proportional to π(a) times the advantage of a, so raising actions that are both likely and successful lowers the entropy.
They proposed limiting updates on high-covariance tokens (Clip-Cov, KL-Cov).
Hao et al. (2026) showed that the token-level change also depends on clipping and on each token’s probability and entropy, and they reweight tokens to control it.

Yue et al. (2025) measured the cost with pass@k: models trained with RLVR win at small k, but their base models reach higher pass@k at large k.
They read this as RL narrowing the base model’s reasoning rather than extending it.
Liu et al. (2025) reported that prolonged RL with KL control and reference resets expands it.
Walder and Karkhanis (2025) optimize pass@k directly by transforming each batch’s rewards.

## Method

A policy chooses among three strategies, `π = softmax(θ₁, θ₂, 0)`, drawn in the projection of <i>The pull of softmax</i>.
Problems are routine (60%) or tricky (40%).
The verifier passes the <em>Shortcut</em> on 90% of routine and no tricky problems, <em>Derivation</em> on 40% and 45%, and <em>Guess</em> on 10% and 5%, so their pass@1 values are 0.54, 0.42 and 0.08.
The sheet is `1.6(1 − pass@1)`; dashed blue lines are pass@16.
At every step (η = 0.15) GRPO samples a group of 8 rollouts for each kind of problem and takes a policy-gradient step with the group-normalized advantages; a group that all passed or all failed contributes nothing.
The entropy bonus adds `τ∇H` with τ = 0.2.
The pass@16 objective follows the exact gradient of pass@16.
All updates move θ₁ and θ₂ only.
The figure averages entropy over each optimizer’s particles; the dashed curve is GRPO’s initial entropy plus the sum of `−Cov_π(log π, Δz)` over its steps.

## Caveat

Here the verifier’s pass rates are fixed and a strategy that solves both kinds of problem is always available, so optimizing pass@16 finds it.
In a language model the alternatives are solution paths the base model rarely samples.
Whether RL can reach them is what Yue et al. and Liu et al. disagree about.

## At scale

Here the policy makes one choice among three strategies, whereas a language model makes a choice at every token.
Most tokens of a reasoning trace are nearly certain, and a small minority of high-entropy “forking” tokens decide which path it takes.
Wang et al. (2025) restricted policy-gradient updates to the 20% of tokens with the highest entropy, which matched full updates on Qwen3-8B and did better on larger Qwen3 models.
The fixes for entropy collapse that came into wide use in 2025 also act on single tokens.
DAPO’s Clip-Higher (Yu et al. 2025) raises only the upper clipping bound of the policy ratio, so that unlikely tokens can gain probability.
Cui et al.’s Clip-Cov and KL-Cov restrict updates on the tokens with the highest covariance.

## References

- Shao, Z., Wang, P., Zhu, Q., Xu, R., Song, J., Bi, X., Zhang, H., Zhang, M., Li, Y. K., Wu, Y. and Guo, D. (2024). DeepSeekMath: pushing the limits of mathematical reasoning in open language models. arXiv:2402.03300.
  Introduces GRPO.
- Cui, G., Zhang, Y., Chen, J., Yuan, L., Wang, Z., Zuo, Y., Li, H., Fan, Y., Chen, H., Chen, W., Liu, Z., Peng, H., Bai, L., Ouyang, W., Cheng, Y., Zhou, B. and Ding, N. (2025). The entropy mechanism of reinforcement learning for reasoning language models. arXiv:2505.22617.
  Entropy collapse, R = −a e<sup>H</sup> + b, and the covariance form of the entropy change.
- Yue, Y., Chen, Z., Lu, R., Zhao, A., Wang, Z., Yue, Y., Song, S. and Huang, G. (2025). Does reinforcement learning really incentivize reasoning capacity in LLMs beyond the base model? NeurIPS.
  RLVR wins at pass@1; base models win at pass@k for large k.
- Liu, M., Diao, S., Lu, X., Hu, J., Dong, X., Choi, Y., Kautz, J. and Dong, Y. (2025). ProRL: prolonged reinforcement learning expands reasoning boundaries in large language models. NeurIPS.
  Reports that prolonged RL expands what the base model can solve.
- Walder, C. and Karkhanis, D. (2025). Pass@K policy optimization: solving harder reinforcement learning problems. NeurIPS.
  Optimizes pass@k directly through a transformation of batch rewards.
- Hao, Z., Wang, H., Liu, H., Luo, J., Yu, J., Dong, H., Lin, Q., Wang, C. and Chen, J. (2026). Rethinking entropy interventions in RLVR: an entropy change perspective. ACL.
  Token-level entropy change depends on clipping, advantage, probability and entropy.
- Yu, Q. et al. (2025). DAPO: an open-source LLM reinforcement learning system at scale. NeurIPS.
  Clip-Higher: a separate, larger upper clipping bound, against entropy collapse.
- Wang, S. et al. (2025). Beyond the 80/20 rule: high-entropy minority tokens drive effective reinforcement learning for LLM reasoning. NeurIPS.
  Updates on the highest-entropy 20% of tokens match or beat updates on all of them.

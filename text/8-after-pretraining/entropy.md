# Entropy collapse

## Subtitle

GRPO chooses among three solution strategies while the figure tracks the policy’s entropy, to see what is lost as accuracy rises.

## Lead

A policy’s [[entropy|entropy]] measures how spread out its choices are.
It is high when the policy samples many different answers and zero when it always gives the same one.

Cui et al. (2025) found that reinforcement learning from verifiable rewards ([[RLVR|rlvr]]) makes a reasoning model’s policy entropy fall sharply early in training.
Once the entropy is used up, accuracy stops improving.

The metric [[pass@k|passk]] is the chance that at least one of k samples is right.
At large k it measures what a model can solve.
Whether RL narrows what the base model can solve is disputed (Yue et al. 2025; Liu et al. 2025).

Here we can watch the entropy fall and see what it costs at pass@k.

## In practice

Track policy entropy during RLVR.
In Cui et al.’s runs an early collapse came before accuracy saturated, so it may warn that accuracy will soon saturate.
Also compare pass@k at large k with the base model’s.

## Figure caption

Entropy of each optimizer’s policy in the latest race.
Dashed: GRPO’s entropy predicted by summing −Cov(log π, Δz) over its steps.
Where the two GRPO curves coincide, the first-order rule accounts for the whole fall.

## Try

1. Watch the figure → [[GRPO|grpo]]’s entropy falls below 0.1 nats within about 900 steps.
   The dashed first-order prediction lies on top of it.
2. Wait for the race to end → GRPO sits on the <em>Shortcut</em>, which has the highest pass@1, 0.54.
   GRPO’s pass@16 has fallen to 0.61 from 0.92 or more.
   The Shortcut never solves a tricky problem, so its pass@16 cannot exceed the 60% of problems that are routine.
3. Compare the other two optimizers → the pass@16 objective reaches a pass@16 of 0.9995.
   The entropy bonus holds a mixture that lies between it and GRPO.
   <em>Derivation</em> solves tricky problems that the Shortcut never does, which pays when there are many tries.
4. Wait for a race from the [[base model|@Base model]] that favours <em>Guess</em> (0.65) → GRPO’s entropy rises before it collapses.
   Guess is likely but rarely passes, so the first steps lower its logit.
   Lowering a likely answer’s logit raises the entropy.

## Background

GRPO (Shao et al. 2024) samples a group of solutions for each problem.
Each solution’s advantage is its reward minus the group mean, divided by the group’s standard deviation.
GRPO needs no value network.

Cui et al. also found that accuracy follows an empirical law, `R = −a e^H + b`, so accuracy rises as entropy falls.
Setting H to 0 gives −a + b, so the law also predicts a ceiling on accuracy once the entropy is gone.

They also derived how one step changes the entropy of a softmax policy.
The change is approximately `−Cov_π(log π(a), Δz(a))`, where Δz is the change in the logits.
Under exact policy gradient `Δz(a)` is proportional to π(a) times the advantage of a, up to a shift shared by every logit, which leaves the covariance unchanged.
So raising actions that are both likely and successful lowers the entropy.

Hao et al. (2026) showed that the token-level change also depends on clipping and on each token’s probability and entropy.
They reweight tokens to control it.

The pass@k debate is about what the lost entropy costs.
Yue et al. measured that cost with pass@k.
Models trained with RLVR win at small k, but their base models reach higher pass@k at large k.
Yue et al. read this as RL narrowing the base model’s reasoning rather than extending it.

Liu et al. reported that prolonged RL with KL control and reference resets expands that reasoning.
Walder and Karkhanis (2025) optimize pass@k directly by transforming each batch’s rewards.

## Method

A policy chooses among three strategies, `π = softmax(θ₁, θ₂, 0)`, drawn in the projection of <i>The pull of softmax</i>.
Problems are routine (60%) or tricky (40%).
The verifier passes each strategy on a fixed share of each kind:

1. The <em>Shortcut</em> on 90% of routine and no tricky problems, a pass@1 of 0.54.
2. <em>Derivation</em> on 40% and 45%, a pass@1 of 0.42.
3. <em>Guess</em> on 10% and 5%, a pass@1 of 0.08.

The sheet is `1.6(1 − pass@1)`, and dashed blue lines are contours of pass@16.

At every step (η = 0.15) GRPO samples a group of 8 rollouts for each kind of problem.
It then takes a policy-gradient step with the group-normalized advantages.
A group that all passed or all failed contributes nothing, since every reward in it equals the group mean.

The entropy bonus adds `τ∇H` with τ = 0.2.
The pass@16 objective follows the exact gradient of pass@16.
As in <i>The pull of softmax</i>, each gradient is taken in all three logits, which are then shifted so that θ₃ stays 0.

The figure averages entropy over each optimizer’s particles.
The dashed curve starts from GRPO’s initial entropy.

## Limits

GRPO collapses here onto the Shortcut, which already has the highest pass@1.
So on this sheet the collapse costs nothing at pass@1, and the ceiling of Cui et al.’s law does not show.
What shows is the cost at large k that Yue et al. measured.

Here the verifier’s pass rates are fixed, and a strategy that solves both kinds of problem is always available.
So optimizing pass@16 finds it.
In a language model the alternatives are solution paths the base model rarely samples.
Whether RL can reach them is what Yue et al. and Liu et al. disagree about.

A language model also chooses at every token, not once among three strategies.
Most tokens of a reasoning trace are nearly certain.
A small minority of high-entropy “forking” tokens decide which path the trace takes.

Wang et al. (2025) restricted policy-gradient updates to the 20% of tokens with the highest entropy.
This matched full updates on Qwen3-8B and did better on larger Qwen3 models.

The fixes for entropy collapse that came into wide use in 2025 also act on single tokens:

1. DAPO’s Clip-Higher (Yu et al. 2025) raises only the upper clipping bound of the policy ratio, so that unlikely tokens can gain probability.
2. Cui et al.’s Clip-Cov and KL-Cov restrict updates on the tokens with the highest covariance.

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

# The pull of softmax

## Subtitle

Three optimizers race off the terrace of the second-best arm of a three-armed bandit, to ask how long a confident policy stays wrong.

## Lead

A [[softmax policy|softmaxpol]] picks each action with probability proportional to the exponential of its logit.
Exact [[policy gradient|pg]] on such a policy converges to the optimum at rate O(1/t) (Mei et al. 2020a).

The constant in that rate is set by the smallest probability the policy gives the best action along the way.
So a policy that starts out committed to a good but suboptimal action can stay there for a very long time.
This is the softmax gravity well (Mei et al. 2020b).

Here we time each optimizer’s escape from a good arm, from ever deeper starts.

## In practice

To escape a confident suboptimal policy, use [[natural policy gradient|npg]].
Plain policy gradient can leave it only slowly.
The natural gradient’s step does not shrink as the best action’s probability goes to zero.
With an entropy bonus, policy gradient converges linearly, at a rate that depends on the start.
It converges to a softened optimum, though, rather than to the best action.

## Figure caption

Steps until the best arm is the most likely, against the depth of the start on the terrace of arm 2.
Hollow rings are optimizers still trapped.
Dashed: the natural policy gradient’s exact escape time.
The step axis is logarithmic, so equal rises are equal factors of time.

## Try

1. Watch the figure → from depths 1 to 4 on the [[terrace of arm 2|@Terrace of arm 2 r = 0.8]], policy gradient escapes in about 40, 120, 530 and 1,400 steps.
   Depth is the logit gap θ₂ − θ₁, so each unit of depth divides π₁/π₂ by e.
2. Wait for depths 5 and 6 → policy gradient ends the race still trapped.
   Its push towards arm 1 is proportional to π₁.
3. Compare depths 3 and 3.3 → policy gradient escapes in about the same time.
   Both runs drive π₁ down to about 0.025.
4. Compare natural policy gradient → it escapes in depth/0.08 steps, on the dashed line.
   It closes the gap by a fixed amount per step, whatever π₁ is.
5. Watch the entropy-regularized particles → they take 20 to 380 steps and stop at the [[regularized optimum|@Regularized optimum]], where π₁ = 0.68.
   That value is what `π ∝ exp(r/τ)` gives for these rewards and τ.

## Background

On a bandit, the objective J is the policy’s expected reward.
For a softmax policy its gradient is `∂J/∂θ_a = π_a(r_a − J)`, the exact form of the likelihood-ratio gradient (Williams 1992).
So each logit’s step is scaled by its action’s probability π_a.

Agarwal et al. (2021) proved that exact softmax policy gradient converges to an optimal policy.
Mei et al. (2020a) proved that the suboptimality `J* − J` falls as O(1/t), matched by an Ω(1/t) lower bound.
The constant is set by the smallest probability the policy gives the optimal action along its path.
That probability can be exponentially small when the start favours another action.

Write p<sub>min</sub> for the smallest π₁ on policy gradient’s path.
On this sheet, for depths 2 to 4, its escape time is close to `5/(η p_min)`.

Mei et al. (2020b) proved that this sensitivity to initialization holds for any expectation optimized through a softmax.
In Markov decision processes, Li et al. (2021) constructed examples where softmax policy gradient needs exponentially many iterations in the number of states and the effective horizon.

Two changes remove the trap:

1. [[Natural policy gradient|npg]] (Kakade 2001) preconditions the gradient by the inverse Fisher information.
   For a softmax policy it adds η times each action’s reward to that action’s logit.
   This is the multiplicative-weights update.
   It converges at a rate independent of the number of states and actions (Agarwal et al. 2021).
2. Adding τ times the policy’s [[entropy|entropy]] to J makes policy gradient converge linearly (Mei et al. 2020a).
   The entropy term pulls the policy towards uniform, which keeps π₁ away from zero.
   The limit is the regularized optimum `π ∝ exp(r/τ)`, not the best arm.

## Method

The policy is `π = softmax(θ₁, θ₂, 0)`.
Adding a constant to every logit leaves π unchanged, so the third logit can be fixed at 0.
The arms pay 1, 0.8 and 0, and the sheet is `L = 1.5(1 − J)`.
On the terrace of arm 2 the policy nearly always picks arm 2, so J stays close to 0.8 and the sheet is flat.

Logit space is drawn in a projection whose rim is infinity.
Directions are true, and a point with ‖θ‖ = n lies at radius `0.97n/(n + 4)`.

Particles step in logit space with η = 0.4 and no noise.
Policy gradient and entropy-regularized policy gradient (τ = 0.25) update all three logits, then subtract θ₃ from each.
Natural policy gradient adds `η(r₁ − r₃, r₂ − r₃)`.

Races start at seven points on the terrace of arm 2, at depths `θ₂ − θ₁` from 1 to 6, five particles per optimizer.
A particle escapes when π₁ exceeds both other probabilities.

The figure plots log₁₀ of the escape step against depth.
A hollow ring marks an optimizer still trapped when the race ends at 3,200 steps.
Each natural-gradient step closes η(r₁ − r₂) of the gap, so the dashed line is `depth/(η(r₁ − r₂))`.

## At scale

With sampled rewards instead of exact gradients, softmax policy gradient on a bandit still reaches the best arm.
Mei et al. (2023) proved a rate of O(1/t) with a constant step.
Mei et al. (2024) proved almost sure convergence for any constant learning rate.

A language model’s policy is a softmax over some 10⁵ tokens at every position.
So a good but unlikely answer can start with far less probability than any arm here.
If escape times grow with depth there as here, we should expect plain policy gradient to raise such answers slowly.
During fine-tuning with RL, the policy’s entropy falls as updates raise answers that are already likely (see <i>Entropy collapse</i>).

The same pull acts on logits inside a network.
Wortsman et al. (2024) found that attention and output logits can grow until training diverges.
They found two changes that hold them back:

1. Normalizing queries and keys (qk-layernorm).
2. Penalizing the log of the softmax’s normalizer (z-loss).

## References

- Williams, R. J. (1992). Simple statistical gradient-following algorithms for connectionist reinforcement learning. Machine Learning 8.
  The likelihood-ratio policy gradient (REINFORCE).
- Kakade, S. M. (2001). A natural policy gradient. NeurIPS.
  Preconditions the policy gradient by the inverse Fisher information.
- Mei, J., Xiao, C., Szepesvári, C. and Schuurmans, D. (2020a). On the global convergence rates of softmax policy gradient methods. ICML.
  O(1/t) convergence with an initialization-dependent constant, a matching lower bound, and linear convergence with entropy regularization.
- Mei, J., Xiao, C., Dai, B., Li, L., Szepesvári, C. and Schuurmans, D. (2020b). Escaping the gravitational pull of softmax. NeurIPS.
  The softmax gravity well: optimizing any expectation through a softmax is sensitive to initialization.
- Agarwal, A., Kakade, S. M., Lee, J. D. and Mahajan, G. (2021). On the theory of policy gradient methods: optimality, approximation, and distribution shift. JMLR 22.
  Global convergence of softmax policy gradient; natural policy gradient as multiplicative weights, with a dimension-free rate.
- Li, G., Wei, Y., Chi, Y., Gu, Y. and Chen, Y. (2021). Softmax policy gradient methods can take exponential time to converge. COLT.
  Examples in Markov decision processes where softmax policy gradient needs exponentially many iterations.
- Mei, J., Zhong, Z., Dai, B., Agarwal, A., Szepesvári, C. and Schuurmans, D. (2023). Stochastic gradient succeeds for bandits. ICML.
  Stochastic softmax policy gradient on bandits converges to the optimal policy at rate O(1/t) with a constant step.
- Mei, J., Dai, B., Agarwal, A., Vaswani, S., Raj, A., Szepesvári, C. and Schuurmans, D. (2024). Small steps no more: global convergence of stochastic gradient bandits for arbitrary learning rates. NeurIPS.
  The stochastic gradient bandit converges to the optimal policy almost surely for any constant learning rate.
- Wortsman, M. et al. (2024). Small-scale proxies for large-scale Transformer training instabilities. ICLR.
  Attention-logit growth and output-logit divergence, and their fixes, qk-layernorm and z-loss, reproduced in small models.

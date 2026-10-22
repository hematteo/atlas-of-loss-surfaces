# The edge of stochastic stability

## Subtitle

Twelve examples whose valleys weave about one floor, to see where gradient descent and SGD each stop sharpening.

## Lead

[[SGD|sgd]] never steps on the full loss.
Each step follows the loss of one minibatch, and that loss curves differently from the full one.
Andreyev and Beneventano (2024) measured how steeply each minibatch loss curves along its own gradient, averaged over minibatches.
They called this average the [[batch sharpness|bsharp]].
In networks trained with SGD it rises to about 2/η and stays there, a regime they named the [[edge of stochastic stability|eoss]].
Meanwhile the [[sharpness|sharpness]] λ<sub>max</sub> of the full loss stays below 2/η, and further below for smaller batches.

This tells us which curvature the step size caps when training uses minibatches.
It is also one account of why smaller batches end in flatter regions.
This plate builds a loss from twelve examples that curve in different directions.
On it we can watch where gradient descent and SGD each stop sharpening.

## In practice

With SGD, a λ<sub>max</sub> below 2/η does not mean that training is far from its edge.
The batch sharpness may already be at 2/η.
Measuring it takes one Hessian-vector product per minibatch, along that minibatch’s own gradient.
At a fixed η, smaller batches also tend to keep λ<sub>max</sub> lower (Jastrzębski et al. 2020).

## Figure caption

Above: for the latest cohort, λ<sub>max</sub> of the full Hessian under gradient descent (blue) and SGD (red), on a log scale.
SGD’s batch sharpness is dashed.
Each curve is averaged over 50 steps per particle and then over the cohort, and the readouts average the shaded steps.
Below: each finished cohort’s settled λ<sub>max</sub> (filled) and batch sharpness (open), as fractions of 2/η, against its batch size.

## Try

1. Keep η = 0.01 and b = 1 → gradient descent’s λ<sub>max</sub> reaches 2/η = 200 by about step 1,750 and stays there.
   SGD stops lower, with λ<sub>max</sub> near 155 and batch sharpness near 167.
   Each SGD step follows one example, whose loss curves more steeply along its own direction than the full loss does (see Method).
2. Set b = 3 → SGD’s λ<sub>max</sub> settles near 181, and its batch sharpness near 176.
   Three examples per step make less noise across the valley, so SGD sharpens further before it stops.
3. Set b = 12 → SGD becomes gradient descent, and both settle at 199.
   After steps 1 to 3, the lower panel shows λ<sub>max</sub> rising from about 0.78 of 2/η at b = 1 to 1 at b = 12.
4. Set η = 0.02 and b = 1 → 2/η falls to 100, gradient descent settles at 100, and SGD’s λ<sub>max</sub> settles near 80.
   The levels scale with 2/η: at both step sizes SGD stops at about 0.8 of the edge.

## Background

Gradient descent on the full loss reaches the [[edge of stability|eos]], where λ<sub>max</sub> hovers at 2/η (Cohen et al. 2021).
<i>The edge of stability</i> shows that regime on a valley like this one, so here we look only at what minibatches change.

For a batch B, let g<sub>B</sub> and H<sub>B</sub> be the gradient and the [[Hessian|hessian]] of its loss.
Its batch sharpness is the curvature of that loss along its own step, averaged over batches: `E_B[g_Bᵀ H_B g_B / ‖g_B‖²]`.
To second order, a step of size η lowers the batch’s own loss only while that curvature stays below 2/η.
Andreyev and Beneventano found that SGD sharpens until batch sharpness reaches 2/η, whatever the batch size.
They traced the gap below it in λ<sub>max</sub> to per-example Hessians that point in different directions.

Liao, Kolomvaki and Kyrillidis (2026) proposed a mechanism for that gap.
At the edge the iterate oscillates across the valley, and the oscillation pushes the sharpness down (see <i>The edge of stability</i>).
Gradient noise along the top eigenvector adds to that oscillation, so sharpening stops earlier.
In their model λ<sub>max</sub> settles below 2/η by `ηβσ²/(4α)`.
Here σ² is the variance of the gradient noise along the top eigenvector, which falls as 1/b.
The rate of [[progressive sharpening|progsharp]] is α, and β is the strength of self-stabilization.

Earlier, Jastrzębski et al. (2020) conjectured that a larger η or a smaller batch lowers the largest λ<sub>max</sub> reached in training.
Wu, Ma and E (2018) asked which minima SGD can stay at.
In their linear-stability analysis the answer depends on the sharpness and on the non-uniformity, how much the examples’ curvatures differ.
So the learning rate and the [[batch size|batch]] play different roles in selecting minima.

## Method

The loss is the mean of twelve example losses, `L = (1/12) Σ ℓ_n`, and the map shows L.
Write v for the distance across the floor of L.
Example n has its own floor, `v = f_n(θ₁) = A sin(ωθ₁ + 2πn/12 + φ)`, with A = 0.012 and Aω = 0.5.
So the twelve floors weave about the floor of L, each tilted from it by up to 27°.
They are drawn faintly along the [[Braided Valley|@Braided Valley]].

Across its own floor each example is a soft-walled valley, `H_c σ/√(1 + σ²)`, with `σ = h(θ₁)s²/(2H_c)` and H<sub>c</sub> = 2.6.
Here s is the distance to that floor, `(v − f_n)/√(1 + f_n′²)`, and `h(θ₁) = 4e^{1.85(θ₁ + 1.4)}` grows tenfold every 1.25 units.
Every example also shares a tilt of −0.14θ₁ along the valley and a term 0.12v².

Near its floor each example curves by h, along its own tilted direction.
Averaged over the twelve tilts, the floor of L curves by `λ(θ₁) = 0.894h + 0.24` across the valley.
Along the valley it hardly curves at all.
The floors cancel in the mean, so L is a straight valley that sharpens downstream, ticked with λ(θ₁).
But the examples disagree about where that floor is, by up to 0.012, so minibatch gradients carry noise across the valley.

Each step draws b of the twelve examples without replacement, from the plate’s seeded generator.
Gradient descent uses all twelve, and every step uses the exact gradient of its batch’s loss.
At each step a particle records λ<sub>max</sub> of the map’s Hessian and its batch’s `g_Bᵀ H_B g_B / ‖g_B‖²`.
Both are averaged over about 50 steps, and the curves average them over the cohort’s particles.
The readouts average the curves from step 20/η to 36/η, which is 2,000 to 3,600 at η = 0.01.

A cohort has 3 gradient-descent and 8 SGD particles (2 and 5 on phones), released 0.12 off the floor at θ₁ = −1.28.
It lives 36/η steps, and moving η or b releases a new cohort.
At b = 1 an SGD particle spends about 2% of its steps thrown up a wall, where λ<sub>max</sub> is low.
Leaving those steps out changes the levels by at most 1.

## Limits

The sheet has two parameters, and here that has a cost.
In two dimensions, examples whose Hessians tilt different ways along a valley must also disagree about where its floor is.
That disagreement is gradient noise across the valley, the noise in the mechanism of Liao et al.
On this sheet it stops SGD before the batches’ own steps become unstable.
So batch sharpness settles at about 0.84 of 2/η at b = 1, not at 2/η.
For b ≥ 2 it sits a few percent below λ<sub>max</sub>.
What the sheet does show is λ<sub>max</sub> settling below 2/η, by a gap that grows as the batch shrinks.

Andreyev et al. (2026) extended the picture to [[heavy-ball momentum|hb]] with coefficient β.
With small batches, batch sharpness settled near 2(1 − β)/η, below plain SGD’s edge.
With large batches it settled near 2(1 + β)/η, the full-batch edge.
The plate leaves momentum out.
When we tried it on this sheet, heavy-ball particles with small batches were thrown up the valley walls instead of settling.

In networks, Andreyev and Beneventano found batch sharpness at 2/η at every batch size they tried, with λ<sub>max</sub> lower for smaller batches.
Liao et al. measured the gap in a fully connected tanh network on 5,000 CIFAR-10 images at η = 0.01.
There λ<sub>max</sub> settled near 208 under gradient descent and near 191 at batch size 50.

## References

- Cohen, J. M., Kaur, S., Li, Y., Kolter, J. Z. and Talwalkar, A. (2021). Gradient descent on neural networks typically occurs at the edge of stability. ICLR.
  Progressive sharpening, and λ<sub>max</sub> hovering just above 2/η in full-batch training.
- Andreyev, A. and Beneventano, P. (2024). Edge of stochastic stability: revisiting the edge of stability for SGD. arXiv:2412.20553.
  Defines batch sharpness, finds it settles at 2/η under SGD while λ<sub>max</sub> stays below, and ties the gap to misaligned per-example Hessians.
- Liao, F., Kolomvaki, A. and Kyrillidis, A. (2026). SGD at the edge of stability: the stochastic sharpness gap. arXiv:2604.21016.
  Gradient noise along the top eigenvector strengthens self-stabilization, so λ<sub>max</sub> settles below 2/η by ηβσ²/(4α).
- Andreyev, A., Ananthkumar, A., Walden, M., Poggio, T. and Beneventano, P. (2026). Momentum further constrains sharpness at the edge of stochastic stability. arXiv:2604.14108.
  With heavy-ball momentum, batch sharpness settles near 2(1 − β)/η for small batches and near 2(1 + β)/η for large ones.
- Jastrzębski, S., Szymczak, M., Fort, S., Arpit, D., Tabor, J., Cho, K. and Geras, K. (2020). The break-even point on optimization trajectories of deep neural networks. ICLR.
  A larger learning rate or smaller batch keeps the curvature lower from early in training.
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS.
  Whether SGD can stay at a minimum depends on its sharpness and on how much the examples’ curvatures differ.

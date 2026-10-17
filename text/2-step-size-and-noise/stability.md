# Stability and catapults

## Subtitle

A round central well and six ring wells of different sharpness.

## Lead

On a quadratic with curvature λ, [[gradient descent|gd]] converges only if `η < 2/λ` (LeCun et al. 1998), so it can reach only minima whose [[sharpness|sharpness]] satisfies `λ_max < 2/η`.
Just above this [[linear stability|stab]] limit, wide networks enter the [[catapult|catapult]] phase: the loss grows while λ<sub>max</sub> falls, then training converges somewhere flatter (Lewkowycz et al. 2020).

## In practice

An early loss spike at high η need not be a bug.
Just above 2/λ<sub>max</sub>, wide networks can spike, lower their curvature and converge somewhere flatter, often with better test accuracy (Lewkowycz et al. 2020).

## Figure caption

Above: each fan particle’s root-mean-square distance from the bottom of the central well over its last 40 steps, against c = ηλ/2; the dashed line c = 1 is η = 2/λ. Below: for each well, sharpest first and labelled by ηλ, SGD particles that settled in it (dark) and particles it threw out (red).

## Try

1. Watch the fans in the [[Central well|@Central well]], whose particles take steps `η = c · 2/λ` with c from 0.4 to 2 → those with c &lt; 1 converge and those with c &gt; 1 keep moving: ‘largest c that settled’ reads 0.97.
2. Read the upper figure → above c = 1 the particles bounce between two points instead of diverging, because the Gaussian walls soften.
   The bounce has half-width `s√(2 ln c)`, with s = 0.14 the width of the well: 0.03 at c = 1.03 and 0.10 at c = 1.3.
3. Raise η until a ring well’s ηλ passes 2 → [[SGD|sgd]] stops settling there.
4. Raise η further → wells with ηλ above about 7 throw particles out (red bars), and these come [[to rest|rest]] only in wells with ηλ &lt; 2.

## Background

The condition comes from linearizing the update at a minimum.
Along an eigenvector of the [[Hessian|hessian]] with eigenvalue λ, each step multiplies the distance to the minimum by `1 − ηλ`.
The iterate approaches monotonically for `ηλ < 1`, overshoots but converges for `1 < ηλ < 2`, and moves away for `ηλ > 2`.
LeCun, Simard and Pearlmutter (1993) used this to set η from an online estimate of λ<sub>max</sub>.
Wu, Ma and E (2018) read it as a selection rule: gradient descent can converge only to minima with `λ_max < 2/η`, and SGD must also satisfy a condition set by its noise.
With [[heavy-ball momentum|hb]] of coefficient β, the bound becomes `ηλ < 2(1 + β)`.

Above the threshold, the higher-order shape of the loss decides what happens.
Lewkowycz et al. (2020) solved the dynamics of a wide two-layer linear network and found three phases, set by the curvature λ₀ at initialization.
For `η < 2/λ₀` the curvature stays nearly constant.
For `2/λ₀ < η < 4/λ₀` the loss grows exponentially while the curvature falls, and training converges once λ has dropped below 2/η.
Above 4/λ₀ training diverges.
In ReLU networks they measured the upper limit near 12/λ₀ and often found the best test accuracy inside the catapult phase.
Jastrzębski et al. (2020) found that a larger learning rate or a smaller batch keeps λ<sub>max</sub> lower from early in training onward.

## Method

The sheet is a bowl with a round Gaussian well at its centre (depth 0.6, width s = 0.14) and six Gaussian wells of depth 0.3 on an ellipse, with widths from 0.026 to 0.15 and λ<sub>max</sub> from about 18 to 470.
Each well of the ring is labelled with λ<sub>max</sub> and ηλ, the central well with λ<sub>max</sub> and 2/λ; wells with ηλ &gt; 2 are ringed.
Fans of nine [[gradient descent|gd]] particles start 0.035 from the central minimum with `η = c · 2/λ`, c from 0.4 to 2, and run 360 steps.
The upper figure plots each one’s root-mean-square distance from the minimum over its last 40 steps; ‘largest c that settled’ is the largest c whose distance is below 10⁻³.
[[SGD|sgd]] cohorts (σ = 0.05) at the slider’s η are released next to the ring wells.
An SGD particle counts as settled when it comes [[to rest|rest]] with steps shorter than 0.004, a stricter test than the glossary’s, so a bouncing particle never counts.
It counts as thrown out when a step longer than 0.02 carries it out of a well it had occupied for more than three steps.

## Caveat

A fixed two-parameter well cannot lower its own curvature.
So this sheet shows the instability that starts a catapult but not the fall in curvature that ends it: a thrown particle lands in another, flatter well.
How far ηλ can rise above 2 before a particle leaves a well depends on the well’s surroundings.
Across two seeds of the sheet it ranged from 3.4 to 7.

## At scale

In deep networks the phases depend on depth and width as well as on η.
Kalra and Barkeshli (2023) found that as depth grows and width shrinks, the loss catapult moves to larger η.
That opens a phase in which η is above 2/λ₀ and yet the loss falls steadily while the curvature drops.
Zhu et al. (2024) found that the loss spikes of minibatch SGD are catapults too, confined to a few top directions, and that smaller batches produce more of them.
Learning-rate [[warmup|warmup]] works largely by letting training reach better-conditioned regions that tolerate a larger η (Kalra and Barkeshli 2024; see <i>Warmup</i>).
With [[Adam|adam]], the optimizer of nearly all large models, the limit applies to the [[preconditioned sharpness|psharp]] instead.
That limit is 38/η at β₁ = 0.9, so λ<sub>max</sub> itself can sit far above 2/η (see <i>The edge of stability</i>).

## References

- LeCun, Y., Simard, P. Y. and Pearlmutter, B. (1993). Automatic learning rate maximization by on-line estimation of the Hessian’s eigenvectors. NeurIPS.
  Sets the learning rate from an online estimate of λ<sub>max</sub>.
- LeCun, Y., Bottou, L., Orr, G. B. and Müller, K.-R. (1998). Efficient BackProp. In Neural Networks: Tricks of the Trade, Springer.
  On a quadratic, gradient descent diverges above η = 2/λ<sub>max</sub>.
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS.
  Gradient descent can converge only to minima with λ<sub>max</sub> &lt; 2/η; SGD’s noise narrows this further.
- Lewkowycz, A., Bahri, Y., Dyer, E., Sohl-Dickstein, J. and Gur-Ari, G. (2020). The large learning rate phase of deep learning: the catapult mechanism. arXiv:2003.02218.
  Lazy, catapult and divergent phases: the catapult lies between 2/λ₀ and 4/λ₀ in a solvable model, up to about 12/λ₀ in ReLU networks.
- Jastrzębski, S., Szymczak, M., Fort, S., Arpit, D., Tabor, J., Cho, K. and Geras, K. (2020). The break-even point on optimization trajectories of deep neural networks. ICLR.
  A larger learning rate or smaller batch keeps the curvature lower from early in training.
- Kalra, D. S. and Barkeshli, M. (2023). Phase diagram of early training dynamics in deep neural networks: effect of the learning rate, depth, and width. NeurIPS.
  The early phases depend on depth and width; a sharpness-reduction phase opens as depth and inverse width grow.
- Zhu, L., Liu, C., Radhakrishnan, A. and Belkin, M. (2024). Catapults in SGD: spikes in the training loss and their impact on generalization through feature learning. ICML.
  SGD’s loss spikes are catapults in the top eigenspace of the tangent kernel; smaller batches give more of them.
- Kalra, D. S. and Barkeshli, M. (2024). Why warmup the learning rate? Underlying mechanisms and improvements. NeurIPS.
  Warmup lets training tolerate a larger target learning rate by moving it to better-conditioned regions.

# The edge of stability

## Subtitle

A valley that sharpens as it descends, so we can watch gradient descent reach the edge of stability and stop at it.

## Lead

The [[sharpness|sharpness]] λ<sub>max</sub> is the largest eigenvalue of the Hessian.
In full-batch training of neural networks, λ<sub>max</sub> rises until it reaches about 2/η, a rise called [[progressive sharpening|progsharp]].
On a quadratic, 2/η is the curvature above which gradient descent diverges, so we might expect training to blow up there.
Instead, λ<sub>max</sub> hovers there, and the loss keeps falling over long times, though not monotonically.
Cohen et al. (2021) named this the [[edge of stability|eos]].

Two accounts explain the mechanism: self-stabilization, which is proved under assumptions, and [[central flows|centralflow]], which are derived informally.
This plate lets us watch gradient descent arrive at the edge, and Adam arrive at an edge of its own.

## In practice

Which sharpness sits at the edge depends on the optimizer:

1. λ<sub>max</sub> for full-batch gradient descent.
2. The [[preconditioned sharpness|psharp]] for Adam.
3. The batch sharpness for SGD.

Oscillation at the edge is not, by itself, a reason to lower η, since the loss can keep falling through it.

## Figure caption

Above: curvature of the valley floor at the position of the latest cohort’s particles, for gradient descent (red) and Adam (orange), and along the central flow (dashed).
Gradient descent levels off just above 2/η; Adam does not.
Below: Adam’s preconditioned sharpness η<sub>A</sub>·λ<sub>max</sub>(P⁻¹H), where η<sub>A</sub> = 0.15η is its step size, and the edge, 38 (dashed).

## Try

1. Keep η = 0.01 → gradient descent reaches λ = 2/η = 200 after about 1,400 steps, then levels off.
   ‘λ at particles’ settles near 215, and ‘λ at their time average’ near 213.
   That floor is sharper than 2/η, but the particles oscillate on the softer walls, where the curvature is lower (see Method).
2. Set η = 0.02 → the next cohort stops near λ = 105 after about 600 steps.
   Doubling η roughly halves the λ at which it stops, as 2/η predicts.
3. Read ‘λ at Adam particles’ → [[Adam|adam]] runs past the red line to the end of the valley, at λ ≈ 600.
   Meanwhile its preconditioned sharpness hovers between 32 and 38.
   Adam’s edge caps P⁻¹H rather than H, so λ<sub>max</sub> can keep rising as long as v̂ grows with it.
4. Set β₂ to 0.999 → at step 300 the preconditioned sharpness is near 4, against 22 at β₂ = 0.95.
   Adam’s second-moment estimate v̂ averages over about `1/(1 − β₂)` steps, so it still carries the larger gradients of early training.
   At β₂ = 0.999 that window outlasts the 300 steps so far, so P is larger and P⁻¹H smaller.

## Background

Cohen et al. (2021) found the edge in many architectures trained with full-batch [[gradient descent|gd]].
There λ<sub>max</sub> stayed just above 2/η, and the loss rose and fell from step to step.
Classical analysis instead assumes `λ_max < 2/η` throughout.

Damian, Nichani and Lee (2023) explained why the iterate does not diverge.
Once λ<sub>max</sub> &gt; 2/η, the iterate oscillates along the top eigenvector of the Hessian.
Through the third derivative of the loss, this oscillation produces a step down the gradient of λ<sub>max</sub>.
That step brings the sharpness back below 2/η.
It grows with the square of the oscillation, so a larger bounce brings a stronger correction.

This self-stabilization makes gradient descent follow projected gradient descent on the set `{λ_max ≤ 2/η}`.
Cohen, Damian et al. (2025) wrote an ODE for the time-averaged trajectory, called the [[central flow|centralflow]].
It accurately predicts the smoothed loss curves of real networks.

For [[Adam|adam]] the preconditioner is `P = diag(√v̂ + ε)`, so its [[preconditioned sharpness|psharp]] is `λ_max(P⁻¹H)`.
Its threshold is `(2 + 2β₁)/((1 − β₁)η) = 38/η` for β₁ = 0.9.
This is the heavy-ball bound 2(1 + β) from <i>Stability and catapults</i>, divided by 1 − β₁.
The division is there because Adam’s momentum is an average rather than a sum.

Cohen et al. (2022) found that full-batch Adam holds the preconditioned sharpness at that threshold while λ<sub>max</sub> keeps rising.
Bai et al. (2026) traced loss spikes in Adam to a v̂ that lags behind the gradient.

Three 2026 results widen the picture.
Litman (2026) gave a mechanism that draws the sharpness toward 2/η from any starting point, not only one that holds it there.
Islamov et al. (2026) measured sharpness in the norm each method steps in, and found that sign descent, normalized descent and spectral descent also sharpen up to their own edge.
Covic et al. (2026) found Muon stable above the threshold that bounds diagonally preconditioned methods such as Adam, and left its exact edge open.

The batch sharpness of SGD is the curvature of each minibatch loss along its own gradient.
Andreyev and Beneventano (2024) found that it settles at 2/η, while λ<sub>max</sub> stays below it (see <i>The edge of stochastic stability</i>).

## Method

Across the valley the loss is `H_c s/(1 + s) + 0.12v²`, where v is the distance from the floor.
Here `s = λ₀(θ₁)v²/(2H_c)`, with `λ₀(θ₁) = 4e^{1.85(θ₁ + 1.4)}` and H<sub>c</sub> = 2.6.
The first term is a parabola of curvature λ₀ near the floor and levels off at H<sub>c</sub> away from it, so the walls soften.

Along the valley the loss falls by 0.14 per unit, and the curvature across the floor rises.
That curvature is `λ(θ₁) = λ₀(θ₁) + 0.24`, where the 0.24 comes from the `0.12v²` term, and it grows tenfold every 1.25 units.
It is ticked along the [[Valley of Rising Sharpness|@Valley of Rising Sharpness]].

Each cohort has 8 gradient-descent particles, released 0.12 off the floor with noise σ = 0.01 to seed the oscillation.
It also has 5 full-batch Adam particles on the floor, with step `η_A = 0.15η`, β₁ = 0.9 and a trace of noise, σ = 10⁻⁴.

The λ readouts, like the upper figure, give the floor’s curvature λ(θ₁) at each particle’s position.
At the oscillating iterate the Hessian’s λ<sub>max</sub> averaged 174 at η = 0.01, 13% below 2/η.
The black line is the central flow: gradient descent along the floor, stopped where λ = 2/η.
The lower figure and the last readout compute Adam’s preconditioned sharpness from the Hessian and each Adam particle’s v̂.

## Limits

On this sheet every point downstream of the red line is sharper still.
So the central flow ends there, the particles stop, and the loss stops falling.

In a network the stable set still leaves other directions to descend along.
Several of the largest Hessian eigenvalues reach 2/η together, and the oscillation fills the subspace of their eigenvectors.
The [[central flow|centralflow]] holds all of them at the edge at once (Cohen, Damian et al. 2025).

Song, Ahn and Yun (2025) found that updates projected onto the sharp subspace barely reduce the loss.
Updates with that subspace removed train about as well as the full ones.

## References

- Cohen, J. M., Kaur, S., Li, Y., Kolter, J. Z. and Talwalkar, A. (2021). Gradient descent on neural networks typically occurs at the edge of stability. ICLR.
  Progressive sharpening, and λ<sub>max</sub> hovering just above 2/η in full-batch training.
- Damian, A., Nichani, E. and Lee, J. D. (2023). Self-stabilization: the implicit bias of gradient descent at the edge of stability. ICLR.
  The oscillation lowers the sharpness through the third derivative; gradient descent follows projected gradient descent on {λ<sub>max</sub> ≤ 2/η}.
- Cohen, J. M., Damian, A., Talwalkar, A., Kolter, J. Z. and Lee, J. D. (2025). Understanding optimization in deep learning with central flows. ICLR.
  An ODE for the time-averaged trajectory at the edge of stability.
- Cohen, J. M., Ghorbani, B., Krishnan, S., Agarwal, N., Medapati, S., Badura, M., Suo, D., Cardoze, D., Nado, Z., Dahl, G. E. and Gilmer, J. (2022). Adaptive gradient methods at the edge of stability. arXiv:2207.14484.
  Full-batch Adam holds λ<sub>max</sub>(P⁻¹H) at 38/η for β₁ = 0.9 while λ<sub>max</sub> itself keeps rising.
- Bai, Z., Zhou, Z., Zhao, J., Li, X., Li, Z., Xiong, F., Yang, H., Zhang, Y. and Xu, Z.-Q. J. (2026). Adaptive preconditioners trigger loss spikes in Adam. ICML.
  Loss spikes when the second-moment estimate stops tracking the gradient and the preconditioned sharpness passes the threshold.
- Andreyev, A. and Beneventano, P. (2024). Edge of stochastic stability: revisiting the edge of stability for SGD. arXiv:2412.20553.
  With minibatches, batch sharpness settles at 2/η and λ<sub>max</sub> stays below it.
- Song, M., Ahn, K. and Yun, C. (2025). Does SGD really happen in tiny subspaces? ICLR.
  Projecting updates onto the top Hessian eigenspace stalls training; the orthogonal bulk does the work.
- Islamov, R., Crawshaw, M., Cohen, J. and Gower, R. (2026). Non-Euclidean gradient descent operates at the edge of stability. arXiv:2603.05002.
  Sign, normalized and spectral descent also sharpen to an edge, once sharpness is measured in their own norm.
- Litman, E. (2026). The origin of edge of stability. arXiv:2604.20446.
  A mechanism that draws the sharpness toward 2/η from any starting point.
- Covic, N., Lipshitz, B., Padula, A. and Visnjic, S. (2026). Muon operates beyond the edge of stability. arXiv:2610.24305.
  Muon stays stable above the sharpness threshold that bounds diagonally preconditioned methods.

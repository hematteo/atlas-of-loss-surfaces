# The edge of stability

## Subtitle

A valley that sharpens as it descends, so we can watch gradient descent reach the edge of stability and stop at it.

## Lead

In full-batch training of neural networks, the [[sharpness|sharpness]] λ<sub>max</sub> rises ([[progressive sharpening|progsharp]]) until it reaches about 2/η.
On a quadratic, 2/η is the curvature above which gradient descent diverges, so we might expect training to blow up there.
Instead, λ<sub>max</sub> hovers there, and the loss keeps falling over long times, though not monotonically.
Cohen et al. (2021) named this the [[edge of stability|eos]].
Two accounts explain the mechanism: self-stabilization, which is proved under assumptions, and [[central flows|centralflow]], which are derived informally.
This plate lets us watch gradient descent arrive at the edge, and Adam arrive at an edge of its own.

## In practice

Which sharpness sits at the edge depends on the optimizer: λ<sub>max</sub> for full-batch gradient descent, [[preconditioned sharpness|psharp]] for Adam, batch sharpness for SGD.
Oscillation at the edge is not, by itself, a reason to lower η, since the loss can keep falling through it.

## Figure caption

Above: curvature of the valley floor at the position of the latest cohort’s particles, for gradient descent (red) and Adam (orange), and along the central flow (dashed).
Gradient descent levels off just above 2/η; Adam does not.
Below: Adam’s preconditioned sharpness η<sub>A</sub>·λ<sub>max</sub>(P⁻¹H), with η<sub>A</sub> = 0.15η its step size, and the edge, 38 (dashed).

## Try

1. Keep η = 0.01 → gradient descent reaches λ = 2/η = 200 after about 1,400 steps, and then ‘λ at particles’ levels off near 215 and ‘λ at their time average’ near 213.
   They can sit where the floor is sharper than 2/η because they oscillate on the softer walls, where the curvature is lower (see Method).
2. Set η = 0.02 → the next cohort stops near λ = 105 after about 600 steps.
   Doubling η roughly halves the λ at which it stops, as 2/η predicts.
3. Read ‘λ at Adam particles’ → [[Adam|adam]] runs past the red line to the end of the valley at λ ≈ 600, while its preconditioned sharpness hovers between 32 and 38.
   Adam holds its preconditioned sharpness near the edge, so λ<sub>max</sub> can keep rising as long as v̂ grows with it.
4. Set β₂ to 0.999 → at step 300 the preconditioned sharpness is near 4, against 22 at β₂ = 0.95.
   Adam’s second-moment estimate v̂ averages over about `1/(1 − β₂)` steps, so it still carries the larger gradients of early training.
   At β₂ = 0.999 that window outlasts the 300 steps so far, so P is larger and P⁻¹H smaller.

## Background

Cohen et al. (2021) trained many architectures with full-batch [[gradient descent|gd]].
Once λ<sub>max</sub> reached 2/η it hovered just above that value, and the loss rose and fell from step to step.
Classical analysis assumes `λ_max < 2/η` throughout.

Damian, Nichani and Lee (2023) explained why the iterate does not diverge.
Once λ<sub>max</sub> &gt; 2/η, the iterate oscillates along the top eigenvector of the Hessian.
Through the third derivative of the loss, the oscillation produces a step down the gradient of λ<sub>max</sub>, which brings the sharpness back below 2/η.
That step grows with the square of the oscillation, so a larger bounce brings a stronger correction.
This self-stabilization makes gradient descent follow projected gradient descent on the set `{λ_max ≤ 2/η}`.
Cohen, Damian et al. (2025) wrote an ODE for the time-averaged trajectory, the [[central flow|centralflow]], which accurately predicts smoothed loss curves of real networks.

Adaptive methods have their own edge.
For [[Adam|adam]] with preconditioner `P = diag(√v̂ + ε)`, the relevant quantity is the [[preconditioned sharpness|psharp]] `λ_max(P⁻¹H)`.
Its threshold is `(2 + 2β₁)/((1 − β₁)η) = 38/η` for β₁ = 0.9.
This is the heavy-ball bound 2(1 + β) from <i>Stability and catapults</i>, divided by 1 − β₁ because Adam’s momentum is an average rather than a sum.
Cohen et al. (2022) found that full-batch Adam holds it at that threshold while moving into regions where λ<sub>max</sub> keeps rising.
Bai et al. (2026) traced loss spikes in Adam to a v̂ that lags behind the gradient.
With minibatches, Andreyev and Beneventano (2024) found that the batch sharpness, the curvature of each minibatch loss along its own gradient, settles at 2/η, and λ<sub>max</sub> stays below it.

## Method

Across the valley the loss is `H_c s/(1 + s) + 0.12v²`, with v the distance from the floor, `s = λ(θ₁)v²/(2H_c)` and H<sub>c</sub> = 2.6; along it the loss falls by 0.14 per unit.
The first term is a parabola near the floor and levels off at H<sub>c</sub> away from it, so the walls soften.
The curvature across the floor is `λ(θ₁) = 4e^{1.85(θ₁ + 1.4)} + 0.24`, tenfold every 1.25 units, ticked along the [[Valley of Rising Sharpness|@Valley of Rising Sharpness]].
Each cohort has 8 gradient-descent particles, released 0.12 off the floor with noise σ = 0.01 to seed the oscillation.
It also has 5 full-batch Adam particles on the floor, with step `η_A = 0.15η`, β₁ = 0.9 and a trace of noise, σ = 10⁻⁴.
The upper figure and the λ readouts give λ(θ₁), the floor’s curvature, at each particle’s position along the valley.
At the oscillating iterate, which sits on the softer walls, the Hessian’s λ<sub>max</sub> averaged 174 at η = 0.01, 13% below 2/η.
The black line, the central flow, is gradient descent along the floor stopped where λ = 2/η.
The lower figure and last readout give `η_A λ_max(P⁻¹H)`, from the Hessian and each Adam particle’s v̂, so the edge is 38.

## Caveat

Every point downstream of the red line is sharper, so the central flow ends there, the particles stop, and the loss stops falling.
In a network, the stable set still leaves other directions to descend along, which is why the loss there can keep falling at the edge.

## At scale

In a network several of the largest Hessian eigenvalues reach 2/η together, and the oscillation fills the subspace of their eigenvectors.
The [[central flow|centralflow]] holds all of them at the edge at once (Cohen, Damian et al. 2025).
Progress then comes from the many other directions.
Song, Ahn and Yun (2025) found that updates projected onto the sharp subspace barely reduce the loss, while updates with that subspace removed train about as well as the full ones.

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

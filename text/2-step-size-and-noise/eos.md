# The edge of stability

## Subtitle

A valley sharpens as it descends, so gradient descent reaches the edge of stability and stops at it.

## Lead

In full-batch training of neural networks, λ<sub>max</sub> rises during training ([[progressive sharpening|progsharp]]) until it reaches about 2/η, then hovers there while the loss keeps falling over long times, though not monotonically.
Cohen et al. (2021) named this the [[edge of stability|eos]].
Self-stabilization and central flows explain its mechanism, though both are derived informally.

## In practice

Which sharpness sits at the edge depends on the optimizer: λ<sub>max</sub> for full-batch gradient descent, preconditioned sharpness for Adam, batch sharpness for SGD.
Oscillation there alone is no reason to lower η.

## Figure caption

Above: curvature of the valley floor at the position of the latest cohort’s particles, gradient descent (red) and Adam (orange), and along the central flow (dashed); gradient descent levels off just above 2/η, Adam does not. Below: Adam’s preconditioned sharpness η<sub>A</sub>·λ<sub>max</sub>(P⁻¹H), with η<sub>A</sub> = 0.15η its step size; the dashed line is the edge, 38.

## Try

1. Keep η = 0.01 → gradient descent reaches λ = 2/η = 200 after about 1,400 steps; ‘λ at particles’ levels off near 215, ‘λ at their time average’ near 212.
2. Set η = 0.02 → the next cohort stops near λ = 105 after about 600 steps.
3. Read ‘λ at Adam particles’ → [[Adam|adam]] runs past the red line to λ ≈ 600, while its preconditioned sharpness hovers between 32 and 38.
4. Set β₂ to 0.999 → at step 300 that sharpness is near 4, against 23 at 0.95: v̂ averages over about `1/(1 − β₂)` steps, keeping the larger early gradients.

## Background

Cohen et al. (2021) trained many architectures with full-batch [[gradient descent|gd]].
Once λ<sub>max</sub> reached 2/η it hovered just above that value, and the loss rose and fell from step to step.
Classical analysis assumes `λ_max < 2/η` throughout.

Damian, Nichani and Lee (2023) explained why the iterate does not diverge.
Once λ<sub>max</sub> &gt; 2/η, it oscillates along the top eigenvector.
Through the third derivative of the loss, the oscillation produces a step down the gradient of λ<sub>max</sub>, which brings the sharpness back below 2/η.
This self-stabilization makes gradient descent follow projected gradient descent on the set `{λ_max ≤ 2/η}`.
Cohen, Damian et al. (2025) wrote an ODE for the time-averaged trajectory, the [[central flow|centralflow]], which accurately predicts smoothed loss curves of real networks.

Adaptive methods have their own edge.
For [[Adam|adam]] with preconditioner `P = diag(√v̂ + ε)`, the relevant quantity is the [[preconditioned sharpness|psharp]] `λ_max(P⁻¹H)`, whose threshold is `(2 + 2β₁)/((1 − β₁)η) = 38/η` for β₁ = 0.9.
Cohen et al. (2022) found that full-batch Adam holds it at that threshold while moving into regions where λ<sub>max</sub> keeps rising.
Bai et al. (2026) traced loss spikes in Adam to a v̂ that lags behind the gradient.
With minibatches, Andreyev and Beneventano (2024) found that the batch sharpness, the curvature of each minibatch loss along its own gradient, settles at 2/η, and λ<sub>max</sub> stays below it.

## Method

Across the valley the loss is `H_c s/(1 + s) + 0.12v²`, with v the distance from the floor, `s = λ(θ₁)v²/(2H_c)` and H<sub>c</sub> = 2.6; along it the loss falls by 0.14 per unit.
The curvature across the floor is `λ(θ₁) = 4e^{1.85(θ₁ + 1.4)} + 0.24`, tenfold every 1.25 units, ticked along the [[Valley of Rising Sharpness|@Valley of Rising Sharpness]].
Away from the floor the walls soften.
Each cohort has 8 gradient-descent particles, released 0.12 off the floor with noise σ = 0.01 to seed the oscillation, and 5 full-batch Adam particles on the floor with step `η_A = 0.15η` and β₁ = 0.9.
The upper figure and the λ readouts give λ(θ₁), the floor’s curvature, at each particle’s position along the valley.
At the oscillating iterate, which sits on the softer walls, the Hessian’s λ<sub>max</sub> averaged 174 at η = 0.01, 13% below 2/η.
The black line, the central flow, is gradient descent along the floor stopped where λ = 2/η.
The lower figure and last readout give `η_A λ_max(P⁻¹H)`, from the Hessian and each Adam particle’s v̂, so the edge is 38.

## Caveat

Every point downstream of the red line is sharper, so the central flow ends there, the particles stop, and the loss stops falling.
In a network the stable set leaves other directions to descend along.

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

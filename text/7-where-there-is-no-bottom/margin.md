# The road to infinity

## Subtitle

Gradient descent, [[normalized descent|normgd]] and [[sign descent|signsgd]] head for infinity, and we ask which of two max-margin roads, ℓ₂ or ℓ∞, each one takes.

## Lead

On linearly separable data the logistic loss has no minimum.
Scaling up a classifier that gets every example right makes every margin larger and every term of the loss smaller.
So the loss keeps falling as the weights grow along any separating direction.

Gradient descent still converges in direction, to the ℓ₂ [[maximum-margin separator|maxmargin]], at rate 1/log t (Soudry et al. 2018).
Steepest descent for another norm maximizes the margin in that norm (Gunasekar et al. 2018).
So the optimizer picks the classifier, and this plate lets us watch it choose.

## In practice

On separable data, near-zero training loss does not determine the classifier.
The optimizer’s geometry picks the margin.
Gradient descent’s direction also keeps changing, converging only at rate 1/log t.
So two runs at the same loss can hold different classifiers.

## Figure caption

The direction of each optimizer’s weights in the latest race against log steps.
Dashed: the ℓ₂ and ℓ∞ max-margin directions of the data.
A curve that levels off on a dashed line has found that road.

## Try

1. Watch the first race, from the [[Origin|@Origin]] → normalized descent comes within about 2.5° of the ℓ₂ road (88.7°) by step 300.
   It is within 0.1° by step 6,000.
   Its steps keep a fixed length as the gradient vanishes, while gradient descent’s shrink.
2. Follow gradient descent → it is still 9 to 13° short after 6,000 steps.
   Its norm ‖w‖ grows only like log t, to about 9.5, and the angle shrinks like 1/log t.
3. Follow sign descent → it first turns towards the ℓ₂ road, reaching 70 to 78° at step 100.
   It then heads for the ℓ∞ road (45°) and reaches 47° by step 1,000.
   Each sign step moves both coordinates by the same amount, so it points along a diagonal, like the ℓ∞ road here.
4. Click elsewhere to start a race → the roads do not move.

## Background

Soudry et al. (2018) studied linearly separable data and losses with an exponential tail, such as the logistic loss.
They proved that gradient descent with a small enough fixed step drives ‖w‖ to infinity like log t.
Its direction converges to the ℓ₂ maximum-margin separator, the hard-margin support vector machine.

Intuitively, once ‖w‖ is large, the exponential tail lets the examples with the smallest margins dominate the gradient.
So training keeps widening the smallest margin.
Nothing in the loss or the algorithm mentions margins, so this is an [[implicit bias|implicit]].

The convergence is slow: the angle to the separator shrinks like 1/log t.
Nacson et al. (2019) showed that with a fixed step no loss tail does better than the exponential one, whose rate is only 1/log t.
For the exponential loss, they also analysed normalized gradient descent, `w ← w − η_t∇L/L` with `η_t = 1/√(t+1)`.
It brings the margin to its maximum at rate `log t/√t`.

Gunasekar et al. (2018) showed that the bias comes from the geometry of the update.
Steepest descent for a norm fixes the step’s length in that norm and picks the direction that most decreases the loss.
Sign descent is steepest descent for ℓ∞.
So it heads for the ℓ∞ maximum-margin direction, which can differ from the ℓ₂ one.

Lyu and Li (2020) extended margin maximization to homogeneous neural networks, such as a ReLU network without biases.
Their result covers gradient flow and gradient descent with the logistic loss.
Once the loss is small enough, the normalized margin grows.
Every limit direction of the parameters is then a KKT point of a margin-maximization problem.

Ji and Telgarsky (2020) proved that under gradient flow the direction does converge.
A KKT point satisfies only first-order conditions for optimality, so it need not maximize the margin.
Vardi, Shamir and Srebro (2022) found many cases where it is not even a local maximum.

## Method

The data are fourteen points `zₙ = yₙxₙ` in two dimensions, separable through the origin.
Each zₙ is an input xₙ times its label yₙ = ±1.
So w classifies every point correctly when every ⟨w, zₙ⟩ is positive.
The loss is the mean logistic loss `L(w) = mean log(1 + exp(−⟨w, zₙ⟩))`.

Particles step in weight space with exact gradients:

1. Gradient descent with η = 1, below `2/β` for the smoothness bound β = 0.47.
2. Normalized descent, `w ← w − 0.2∇L/‖∇L‖₂`.
3. Sign descent, `w ← w − 0.2 sign(∇L)`.

The sheet is an azimuthal projection of weight space, in which directions are true.
A point at ‖w‖ = r lies at radius proportional to `log(1 + 2r)`, so rings at ‖w‖ = 1, 10, 100 and 1,000 fit.

The relief is a saturating function of `log L(w)` minus the lowest log L on the circle of the same radius.
So the valley floor is the best direction at each distance.
This removes the overall fall of the loss with ‖w‖, which would otherwise hide the differences between directions.

The roads come from scanning 72,000 directions for the largest ℓ₂ margin (88.7°, 0.663) and the largest ℓ∞ margin (45.0°, 0.678).
The figure plots each optimizer’s mean direction against log₁₀ steps.

## Caveat

Normalized and sign descent here take steps of constant length.
Normalized descent steps 0.2 in ℓ₂, and sign descent steps 0.2 in ℓ∞ (0.28 in ℓ₂).
The theorems cover particular step-size schedules, such as `η_t = 1/√(t+1)` on `∇L/L` in Nacson et al.
So the sheet shows that the constant-length versions reach the same directions on these data, not that they always do.

## At scale

Large networks are usually trained with [[Adam|adam]], which on separable data behaves like sign descent.
Adam divides each coordinate’s step by an estimate of that coordinate’s gradient size, leaving roughly its sign.
Zhang, Zou and Cao (2024) showed that it heads for the ℓ∞ road, not the ℓ₂ one.

In practice Adam is used with weight decay, as [[AdamW|adamw]].
Xie and Li (2024) showed that AdamW instead keeps every weight within a bound set by the decay.
That bound works like a constraint on the ℓ∞ norm.
The weights then settle at a finite norm instead of travelling to infinity.
So the direction they reach depends on the decay as well as on the optimizer.

The margin results have also been extended:

1. Cai et al. (2025) proved that gradient descent still converges in direction for networks with residual connections, which are not homogeneous.
2. Tsilivis, Vardi and Kempe (2025) proved that steepest descent for other norms increases its own margin in deep homogeneous networks.

## References

- Soudry, D., Hoffer, E., Nacson, M. S., Gunasekar, S. and Srebro, N. (2018). The implicit bias of gradient descent on separable data. JMLR 19.
  Gradient descent on separable data converges in direction to the ℓ₂ max-margin separator, at rate 1/log t.
- Gunasekar, S., Lee, J., Soudry, D. and Srebro, N. (2018). Characterizing implicit bias in terms of optimization geometry. ICML.
  Steepest descent with respect to a norm maximizes the margin in that norm.
- Nacson, M. S., Lee, J., Gunasekar, S., Savarese, P., Srebro, N. and Soudry, D. (2019). Convergence of gradient descent on separable data. AISTATS.
  1/log t is optimal for fixed steps; normalized steps give log t/√t.
- Lyu, K. and Li, J. (2020). Gradient descent maximizes the margin of homogeneous neural networks. ICLR.
  Extends margin maximization to homogeneous networks.
- Ji, Z. and Telgarsky, M. (2020). Directional convergence and alignment in deep learning. NeurIPS.
  Under gradient flow, the weights of deep homogeneous networks converge in direction.
- Vardi, G., Shamir, O. and Srebro, N. (2022). On margin maximization in linear and ReLU networks. NeurIPS.
  The KKT points that gradient flow reaches are often not even local maxima of the margin.
- Xie, S. and Li, Z. (2024). Implicit bias of AdamW: ℓ∞-norm constrained optimization. ICML.
  When full-batch AdamW converges, it reaches a KKT point of the loss under an ℓ∞ bound set by the weight decay.
- Zhang, C., Zou, D. and Cao, Y. (2024). The implicit bias of Adam on separable data. NeurIPS.
  Adam on separable data converges in direction to the maximum ℓ∞-margin classifier.
- Tsilivis, N., Vardi, G. and Kempe, J. (2025). Flavors of margin: implicit bias of steepest descent in homogeneous neural networks. ICLR.
  Steepest descent for any norm increases its own margin in deep homogeneous networks.
- Cai, Y., Zhou, K., Wu, J., Mei, S., Lindsey, M. and Bartlett, P. (2025). Implicit bias of gradient descent for non-homogeneous deep networks. ICML.
  Directional convergence and a KKT limit for networks with residual connections and non-homogeneous activations.

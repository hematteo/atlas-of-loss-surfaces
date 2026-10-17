# Saddle to saddle

## Subtitle

A two-parameter diagonal linear network fits two targets of different strength.

## Lead

From a small initialization, linear networks learn incrementally: the loss falls in steps separated by [[plateaus|plateau]], while the parameters pass near a sequence of [[saddle points|saddle]].
Saxe, McClelland and Ganguli (2014) solved this exactly for deep linear networks; Pesme and Flammarion (2023) proved it for diagonal linear networks.
For nonlinear networks the evidence is partial.

## In practice

From a small initialization, a loss stalled on a plateau may be awaiting the next component, not converged.
This is proved for linear networks and only partly supported for nonlinear ones.

## Figure caption

Mean loss of the latest cohort. Dashed lines mark the two plateaus and the predicted escape times of the strong and the weak mode.

## Try

1. Lower δ a decade at a time → each tenfold reduction adds about 35 steps to ‘strong mode at’ and 110 to 140 to ‘weak mode at’.
2. Hold δ at 10⁻⁷ → paths run along θ₁ to the [[saddle|@Saddle]], stop and turn a right angle, while the loss waits ½s₂² above the minimum for several hundred steps.
3. Raise δ to 0.3 → the corner rounds off: when the strong mode is half learned, the weak one is already a third learned.

## Background

Saxe, McClelland and Ganguli (2014) solved the [[gradient flow|gflow]] of deep linear networks trained on whitened inputs from a small initialization.
Each singular mode of the input–output map is learned on its own sigmoidal curve, after a time inversely proportional to its strength, so strong modes come first.
Gidel, Bach and Lacoste-Julien (2019) showed the same order for discrete gradient descent.
Gissin, Shalev-Shwartz and Daniely (2020) argued that depth makes learning more incremental.

In diagonal linear networks the scale of the initialization moves training between a [[kernel regime|lazy]] at large scale and a rich regime with a sparse implicit bias at small scale (Woodworth et al. 2020).
As the initialization vanishes, gradient flow jumps from saddle to saddle until it reaches the minimum ℓ₁-norm solution; each saddle minimizes the loss over the coordinates learned so far.
Berthier (2023) proved this in a restricted setting, and Pesme and Flammarion (2023) under negligible assumptions on the data.
Jacot et al. (2021) conjectured the same dynamics for deep linear networks, with the rank of the learned map growing by one per saddle, and proved it up to the second saddle.
For deep ReLU networks, Bantzis, Simon and Jacot (2026) proved that the first escape from the origin is low rank in the deeper layers.
Boix-Adserà et al. (2023) proved a stagewise rank increase for simplified transformers and observed it without the simplifications.

## Method

The sheet is the exact population loss of a two-layer diagonal linear network `f(x) = Σ u_i v_i x_i` on whitened inputs with target weights s₁ and s₂.
It is restricted to the balanced slice `u_i = v_i = θ_i`: `L = ½(s₁ − θ₁²)² + ½(s₂ − θ₂²)²`, plus 0.03. s₁/s₂ lies between 3.1 and 4.3, depending on the seed.
On this slice the origin is a local maximum (in the full network it is a saddle), each axis carries a saddle where one mode is learned, and the four minima have `θ_i² = s_i`.
Gradient descent on the slice equals gradient descent on the full network with step 2η; η = 0.02, without noise.
Each cohort of ten particles starts at (±δ, ±δ) with 10% jitter.
Near zero each coordinate grows only by the factor `1 + 2ηs_i` per step.
A mode counts as learned when `θ_i²` first exceeds `s_i/2`.
The readouts give the mean step of that crossing and the prediction `ln(s/δ² − 1) / (2 ln(1 + 2ηs))`, the logistic solution of the flow at gradient descent’s growth rate per step.

## Caveat

The two modes are decoupled: each coordinate evolves on its own, and the staircase comes only from their different time scales.
With correlated inputs, or in deep linear networks, the coordinates interact, and which saddle comes next depends on what has already been learned.
The slider stops at δ = 0.5, which rounds the corner but does not reach the kernel regime.

## References

- Saxe, A. M., McClelland, J. L. and Ganguli, S. (2014). Exact solutions to the nonlinear dynamics of learning in deep linear neural networks. ICLR.
  Exact learning curves for deep linear networks: modes are learned one at a time, strongest first.
- Gidel, G., Bach, F. and Lacoste-Julien, S. (2019). Implicit regularization of discrete gradient dynamics in linear neural networks. NeurIPS.
  The same sequential learning for discrete gradient descent.
- Gissin, D., Shalev-Shwartz, S. and Daniely, A. (2020). The implicit bias of depth: how incremental learning drives generalization. ICLR.
  Depth makes learning more incremental.
- Woodworth, B., Gunasekar, S., Lee, J. D., Moroshko, E., Savarese, P., Golan, I., Soudry, D. and Srebro, N. (2020). Kernel and rich regimes in overparametrized models. COLT.
  The initialization scale moves diagonal networks between the kernel and the rich regime.
- Jacot, A., Ged, F., Şimşek, B., Hongler, C. and Gabriel, F. (2021). Saddle-to-saddle dynamics in deep linear networks: small initialization training, symmetry, and sparsity. arXiv:2106.15933.
  Conjectures saddle-to-saddle dynamics in deep linear networks, rank growing by one per saddle; proves it up to the second saddle.
- Berthier, R. (2023). Incremental learning in diagonal linear networks. JMLR 24(171).
  Proves that coordinates are activated one after another as the initialization vanishes, in a restricted setting.
- Pesme, S. and Flammarion, N. (2023). Saddle-to-saddle dynamics in diagonal linear networks. NeurIPS.
  Characterizes the saddles visited and the jump times, under negligible assumptions on the data.
- Boix-Adserà, E., Littwin, E., Abbe, E., Bengio, S. and Susskind, J. (2023). Transformers learn through gradual rank increase. NeurIPS.
  Stagewise rank increase, proved for simplified transformers and observed without the simplifications.
- Bantzis, I., Simon, J. B. and Jacot, A. (2026). Saddle-to-saddle dynamics in deep ReLU networks: low-rank bias in the first saddle escape. ICLR.
  In deep ReLU networks the first escape from the origin is low rank in the deeper layers.

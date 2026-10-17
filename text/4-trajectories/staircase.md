# Saddle to saddle

## Subtitle

A two-parameter diagonal linear network fits two targets of different strength.

## Lead

Linear networks started from a small initialization learn incrementally.
The loss falls in steps separated by [[plateaus|plateau]], and the parameters pass near one [[saddle point|saddle]] after another.
Saxe, McClelland and Ganguli (2014) solved this exactly for deep linear networks started from aligned (decoupled) initial conditions.
Pesme and Flammarion (2023) proved it for diagonal linear networks.
For nonlinear networks the evidence is partial.

## In practice

When training starts from a small initialization, a loss that has stalled on a plateau may not have converged: the network may still be waiting to learn its next component.
This is proved for linear networks and only partly supported for nonlinear ones.

## Figure caption

Mean loss of the latest cohort. Dashed lines mark the two plateaus and the predicted escape times of the strong and the weak mode.

## Try

1. Lower the initialization scale δ a decade at a time → each tenfold reduction adds about 35 steps to ‘strong mode at’ and 110 to 140 to ‘weak mode at’.
2. Hold δ at 10⁻⁷ → paths run along θ₁ to the [[saddle|@Saddle]], stop, and turn through a right angle.
   For several hundred steps the loss waits ½s₂² above the minimum, where s₂ is the strength of the weak mode.
3. Raise δ to 0.3 → the corner rounds off: when the strong mode is half learned, the weak one is already a third learned.

## Background

Saxe, McClelland and Ganguli (2014) solved the [[gradient flow|gflow]] of deep linear networks trained on whitened inputs from a small initialization.
Each singular mode of the input–output map is learned on its own sigmoidal curve, after a time inversely proportional to its strength, so strong modes come first.
Gidel, Bach and Lacoste-Julien (2019) showed the same order for discrete gradient descent.
Gissin, Shalev-Shwartz and Daniely (2020) argued that depth makes learning more incremental.

In diagonal linear networks the scale of the initialization moves training between a [[kernel regime|lazy]] at large scale and a rich regime with a sparse implicit bias at small scale (Woodworth et al. 2020).
As the initialization vanishes, gradient flow jumps from saddle to saddle until it reaches the minimum ℓ₁-norm solution.
Each saddle minimizes the loss over an active set of coordinates, and the set can lose coordinates as well as gain them.
Berthier (2023) proved this in a restricted setting, and Pesme and Flammarion (2023) under negligible assumptions on the data.
Jacot et al. (2021) conjectured the same dynamics for deep linear networks, with the rank of the learned map growing by one per saddle, and proved it up to the second saddle.
For deep ReLU networks, Bantzis, Simon and Jacot (2026) proved that the first escape from the origin is low rank in the deeper layers.
Boix-Adserà et al. (2023) proved a stagewise rank increase for simplified transformers and observed it without the simplifications.

## Method

The sheet is the exact population loss of a two-layer diagonal linear network `f(x) = Σ u_i v_i x_i` on whitened inputs with target weights s₁ and s₂.
It is restricted to the balanced slice `u_i = v_i = θ_i`: `L = ½(s₁ − θ₁²)² + ½(s₂ − θ₂²)²`, plus 0.03.
The ratio s₁/s₂ lies between 3.1 and 4.3, depending on the seed.
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

## At scale

A wide network in the NTK parametrization, at its usual initialization, trains in the [[kernel regime|lazy]], and its loss shows no staircase.
The steps need a small initialization, or a parametrization such as μP that keeps the features learning.
Kunin et al. (2024) showed that how unbalanced the layers start also changes how fast features are learned.
This sheet keeps the two layers balanced.
Abbe, Boix-Adserà and Misiakiewicz (2023) studied two-layer networks trained by SGD on high-dimensional inputs.
For a class of targets and a modified SGD, they proved that the network picks up the relevant coordinates in stages, from saddle to saddle, and that each stage takes a number of steps that grows as a power of the input dimension.
Michaud et al. (2023) proposed that in a large model many such steps, of different sizes, add up to a smooth power law, and that single steps show only for particular skills.

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
- Abbe, E., Boix-Adserà, E. and Misiakiewicz, T. (2023). SGD learning on neural networks: leap complexity and saddle-to-saddle dynamics. COLT, PMLR 195.
  SGD learns a target’s support in stages, saddle to saddle, in a time that grows as a power of the input dimension set by the largest leap.
- Michaud, E. J., Liu, Z., Girit, U. and Tegmark, M. (2023). The quantization model of neural scaling. NeurIPS.
  Discrete skills learned in order of how often they are used add up to a power-law loss curve.
- Kunin, D., Raventós, A., Dominé, C., Chen, F., Klindt, D., Saxe, A. and Ganguli, S. (2024). Get rich quick: exact solutions reveal how unbalanced initializations promote rapid feature learning. NeurIPS.
  Exact solutions showing how the balance between layers at initialization sets the speed of feature learning.

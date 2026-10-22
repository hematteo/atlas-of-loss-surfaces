# Loss of plasticity

## Subtitle

One small network meets a new task every 400 steps, and three optimizers are compared with networks trained from scratch.

## Lead

A network trained on one task after another can lose [[plasticity|plasticity]].
It then learns each new task worse than the same network would from a fresh initialization.
Dohare et al. (2024) found this in standard deep networks trained on long sequences of tasks.
In the end their networks learned no better than a shallow one.

It matters wherever the data keep changing.
That includes [[continual learning|contlearn]], reinforcement learning, and models retrained as new data arrive (Ash and Adams 2020; Nikishin et al. 2022).

Its causes are still argued over.
Growing weights, [[saturated|saturated]] or dead units, and changes of curvature have all been implicated (Dohare et al. 2024; Lyle et al. 2023, 2024a).

This plate shows one of these mechanisms in two parameters.
We can watch SGD’s parameters drift to where the output no longer responds, and watch weight decay and shrink and perturb bring them back.

## In practice

To tell lost plasticity from a hard task, train a freshly initialized copy of the network on the same task and compare.
Lyle et al. (2024a) define loss of plasticity by this comparison.
A parameter norm that keeps growing, and a rising share of dead or saturated units, are warning signs (Dohare et al. 2024).
Weight decay, [[shrink and perturb|snp]], L2 Init and partial resets are simple remedies to try first (Kumar, Marklund and Van Roy 2024; Nikishin et al. 2022).

## Figure caption

Above: each optimizer’s loss at the end of each task, averaged over its particles and the task’s last 40 steps.
Dashed: networks trained from scratch on the same task.
Below: mean ‖θ‖ at the end of each task, and the radius 2R beyond which the output is saturated.
The last finished run is drawn faintly behind the current one.

## Try

1. Watch tasks 1 to 5 → on the first four, all three optimizers end with losses of 0.02 to 0.07, as the fresh networks do.
   Task 5’s target lies out of reach, and SGD and shrink and perturb follow its loss across the dashed circle, to ‖θ‖ ≈ 0.49.
   Weight decay stops at about 0.3.
   An out-of-reach target pulls θ outward as cross-entropy pulls logits apart on separable data (see <i>The road to infinity</i>).
2. Watch the lower panel after task 5 → SGD never comes back.
   Its ‖θ‖ grows at every task, to about 0.93 at task 24.
   Its gradient at the start of a task falls from about 1.5 to about 0.2.
   Far out, the gradient and the noise both point across θ, and a step across θ lengthens it (see <i>Weight decay and scale invariance</i>).
   The pull back falls off as `e^(−‖θ‖²/R²)`, so nothing undoes the growth.
3. Watch the upper panel after task 5 → on tasks within reach, SGD ends at twice the fresh networks’ loss at the median.
   On the worst task it ends 50 to 75 times higher.
   Weight decay and shrink and perturb track the fresh networks, with a median ratio of about 1.
   With its gradient almost gone, SGD cannot get back to a new minimum in the 400 steps a task lasts (see <i>Plateaus</i>).
   Weight decay pays most on the tasks out of reach, ending two to three times higher, because it holds θ in.
4. Set λ to 0 → the weight-decay particles follow SGD across the circle on task 5 and stay out.
   Over the last six tasks both average a final loss of about 0.2, against 0.03 for the fresh networks.
   Weight decay’s pull, λ‖θ‖, grows with distance where the loss’s pull fades, so it was what brought them back.
5. Set α to 1 → shrink and perturb keeps only its perturbation, of size 0.02, and is trapped like SGD.
   Its final loss over the last six tasks is about 0.2.
   On this sheet the shrink, not the perturbation, restores plasticity.
6. Lower σ to 0.1 → no optimizer is trapped, and every final loss matches the fresh networks’.
   SGD still reaches ‖θ‖ ≈ 0.42 on task 5, at the circle, and is back at about 0.12 a task later.
   Smaller noise takes smaller steps across θ, so the weak pull back wins.
   In our runs SGD also came back at σ = 0.2, and stayed out at the default 0.25.
7. Start the run on the saturated ground, at θ = (0.7, 0) → weight decay is back inside the circle by the end of task 1.
   Its ‖θ‖ is then about 0.13.
   Shrink and perturb stays out until the first new task halves θ, then learns as the fresh networks do.
   SGD never returns, and its ‖θ‖ reaches about 1.0.

## Background

Dohare et al. (2024) trained standard networks on long sequences of supervised tasks and in reinforcement learning.
With plain backpropagation, plasticity faded until new tasks were learned no better than by a shallow network.
Along the way the average weight magnitude grew, units died, and the effective rank of the representation fell.

In their experiments L2 regularization reduced the loss, but did not always prevent it.
Shrink and perturb, applied in small doses at every step, nearly removed it on permuted MNIST.
Their continual backpropagation, which keeps reinitializing a small fraction of little-used units, maintained plasticity throughout.

Ash and Adams (2020) found that a network warm-started from an earlier solution generalizes worse than a fresh one.
Their remedy sets `θ ← λθ + p` whenever new data arrive, with p small Gaussian noise; we call their λ α here.

Nikishin et al. (2022) found that deep reinforcement learning agents overfit their earliest experience, which they called the primacy bias.
Periodically resetting part of the agent helped.

Lyle et al. (2023) linked plasticity loss to changes in the curvature of the loss landscape.
They also found that it often occurs without saturated units.
Lyle et al. (2024a) separated several mechanisms, among them dead or saturated units, a shifting distribution of preactivations, and growth of the parameter norm.
Treating one was not enough, while layer normalization together with weight decay worked across their benchmarks.

In a network with normalization layers, a growing parameter norm amounts to a decaying [[effective learning rate|efflr]] (Lyle et al. 2024b).
In continual learning it can decay too fast.
Kumar, Marklund and Van Roy (2024) proposed L2 Init, which pulls the parameters towards their initial values rather than towards zero.

## Method

The network’s output is `φ(θ) = R erf(‖θ‖/R) θ/‖θ‖`, with R = 0.22.
Near the origin φ ≈ 1.13θ, and far from it φ approaches the circle of radius R, so only the direction of θ matters.
The output’s slope along θ is `1.13 e^(−‖θ‖²/R²)`.
Beyond the dashed circle, ‖θ‖ = 2R = 0.44, it is below 2% of its value at the origin.
Across θ the slope falls as about R/‖θ‖.

Task k’s loss is `½A‖φ(θ) − cₖ‖²`, with A = 12, and the sheet adds 0.03.
Each target c<sub>k</sub> has a uniform direction and a length uniform between 0.3R and 1.15R, drawn from the sheet’s seed.
A target longer than R is out of reach: its loss has no minimum and keeps falling outward.
Every run uses the same 24 targets, for 400 steps each; on the default sheet, tasks 5, 18 and 19 are out of reach.

All three optimizers take SGD steps with η = 0.01.
The noise comes from targets scattered by σ = 0.25 in each output coordinate.
It reaches θ through the Jacobian of φ, as the gradient does.
So the noise along θ fades with the output’s slope, while the noise across θ falls only as 1/‖θ‖.
Weight decay adds λθ to the gradient, with λ = 0.5.
Shrink and perturb sets `θ ← αθ + ε` at the start of each new task.
Here α = 0.5, and ε has standard deviation 0.02 per coordinate.

Each run starts 14 particles of each optimizer from the same 14 points near the origin, with standard deviation 0.05; phones use 7.
A task’s final loss is the task loss averaged over its last 40 steps and over the optimizer’s particles.
The reference trains 16 networks from scratch on each task, off the map, with the same steps and noise.
The readouts give the mean ‖θ‖, the mean gradient norm at the start of the task (after the shrink) and the last final losses.
Changing a control restarts the run, and a click starts one from the clicked point.
A steep wall just inside the edge keeps particles on the map.

## Limits

The sheet has one saturating output, and its drift has one source: noise steps across θ once nothing pulls θ back.
It needs enough noise, and on the default sheet SGD is trapped at a single task, the first one out of reach.
A real network has many units, which can saturate or die one at a time.
Dohare et al. (2024) saw plasticity fade gradually over many tasks.

Zero-mean noise lengthens θ on average in any dimension, since `E‖θ + ξ‖² = ‖θ‖² + E‖ξ‖²`.
On this sheet, what SGD lacks once the output saturates is a force that pulls θ back.
Weight decay supplies one at every step, and shrink and perturb at each new task.

Plasticity is also lost in ways this sheet cannot draw.
Lyle et al. (2023) found it often happens without saturated units, through changes in curvature.
The mechanisms of Lyle et al. (2024a) also include shifts in the distribution of preactivations and large regression targets.
Which mechanism dominates in a given network, and why, remains open.

## References

- Dohare, S., Hernandez-Garcia, J. F., Lan, Q., Rahman, P., Mahmood, A. R. and Sutton, R. S. (2024). Loss of plasticity in deep continual learning. Nature 632, 768–774.
  Standard networks lose plasticity over long task sequences, with growing weights, dead units and falling rank; L2, shrink and perturb and continual backpropagation counter it.
- Ash, J. T. and Adams, R. P. (2020). On warm-starting neural network training. NeurIPS.
  Warm-started networks generalize worse than fresh ones; shrinking and perturbing the weights when new data arrive closes the gap.
- Nikishin, E., Schwarzer, M., D’Oro, P., Bacon, P.-L. and Courville, A. (2022). The primacy bias in deep reinforcement learning. ICML.
  Deep RL agents overfit their earliest experience; periodically resetting part of the agent helps.
- Lyle, C., Zheng, Z., Nikishin, E., Avila Pires, B., Pascanu, R. and Dabney, W. (2023). Understanding plasticity in neural networks. ICML.
  Plasticity loss tracks changes in the curvature of the loss landscape and often occurs without saturated units.
- Lyle, C., Zheng, Z., Khetarpal, K., van Hasselt, H., Pascanu, R., Martens, J. and Dabney, W. (2024a). Disentangling the causes of plasticity loss in neural networks. CoLLAs, PMLR 274.
  Several independent mechanisms of plasticity loss; layer normalization with weight decay is robust across them.
- Lyle, C., Zheng, Z., Khetarpal, K., Martens, J., van Hasselt, H., Pascanu, R. and Dabney, W. (2024b). Normalization and effective learning rates in reinforcement learning. NeurIPS.
  With normalization layers, a growing parameter norm is a decaying effective learning rate; Normalize-and-Project holds it constant.
- Kumar, S., Marklund, H. and Van Roy, B. (2024). Maintaining plasticity in continual learning via regenerative regularization. CoLLAs, PMLR 274.
  L2 Init, a penalty towards the initial parameters, mitigates plasticity loss most consistently among the methods they compared.

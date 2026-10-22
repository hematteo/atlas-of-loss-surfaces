# The river valley

## Subtitle

Five schedules run down one river valley, to ask why the loss drops so sharply when η decays.

## Lead

Language models are often trained with a [[warmup–stable–decay|wsd]] schedule (Hu et al. 2024; Hägele et al. 2024).
With it, the loss falls slowly during a long phase at a constant [[learning rate|lr]] η, then sharply during a short decay.

Wen et al. (2025) offer one of several explanations for that drop: the loss surface is a river valley.
Across the valley the curvature is high, so the walls are steep.
The river runs along the valley floor, and the loss falls only gently along it.

This sheet builds such a valley, so we can watch five schedules trade distance along the river against height up the walls.

## In practice

Whatever explains the drop, compare runs or checkpoints after a short cooldown.
During the constant-η phase, a checkpoint’s loss is a poor guide to its loss after decay.
Part of that loss may be height that a decay removes.

## Figure caption

Mean loss of each schedule in the latest [[cohort|cohort]], with schedule-free read at its averages.
The dotted line marks the start of the decay, where warmup–stable–decay leaves the constant schedule behind.

## Try

1. Leave the noise σ at 1.4 → warmup–stable–decay falls below the constant schedule during its decay, and the batch ramp ends lower still.
   The batch ramp lowers the noise without lowering η, so it loses no distance downstream.
2. Watch cosine → it ends highest.
   Distance along the river is proportional to the summed learning rate, so cosine travels half as far.
   The floor has a constant slope, so the shorter distance leaves it highest.
3. Watch schedule-free, read at its average → it reaches the end of the river in about 800 steps.
   That is about five times as fast as the constant schedule.
   A uniform average of a steadily moving point trails halfway behind it.
   So the average x moves at half the speed of the iterate z, `γ/2 = 5η`.
   Its interpolation lets it take a step γ = 10η without being thrown across the valley, and along the river it acts like momentum (see Method).
   The four SGD schedules have no momentum, so this is not a like-for-like race.
4. Set σ to 0 → the constant schedule and the batch ramp end together, lowest of the four SGD schedules.
   Without noise the bouncing dies out on its own.
   So a decay pays off only when noise holds particles up the walls.

## Background

Hu et al. introduced warmup–stable–decay for MiniCPM.
Hägele et al. showed that a constant rate with a short cooldown matches cosine and lets one run serve many training lengths.

In Wen et al.’s account, the high η of the stable phase moves the iterate quickly along the river.
It also makes the iterate oscillate across the valley.
The decay damps that oscillation and reveals the progress made along the river.
They also showed that such a landscape arises even for a bigram model.

Schaipp et al. (2025) give another account, with no valley in it.
A bound from non-smooth convex optimization already predicts the benefit of the cooldown.

Two other methods get down from the walls without decaying η:

1. [[Schedule-free SGD|sf]] (Defazio et al. 2024) has no schedule.
   It evaluates a running average of its iterates, and takes gradients at a point between that average and the latest iterate.
   Song et al. (2025) found that schedule-free AdamW follows the river without a decay phase or an extra averaged copy of the weights.
2. Smith et al. (2018) showed that multiplying the [[batch|batch]] size B by k can replace dividing η by k.
   The cost in samples depends on the [[critical batch size|cbs]] (McCandlish et al. 2018).

In OLMo pretraining, Merrill et al. (2025) found that the critical batch size starts near zero, rises quickly and levels off.
A batch grown to follow it reached a slightly lower loss in 43% fewer steps.
Zhou et al. (2026, a preprint) also argue for raising the batch late.

## Method

Write v for the distance from the river.
Across the river the loss is `H·s/(1 + s)` with `s = λv²/2H`, plus a small `0.05v²`.
So λ = 140 is the curvature across the floor, and H = 0.9 is the height of the walls.
Along the river the loss falls by 0.08 per unit of θ₁, to the minimum at a wall at the far end.

Twelve particles per schedule run 1,800 steps from the head at η = 0.0125, so ηλ = 1.75 across.
With ηλ between 1 and 2, each step overshoots the floor, and the overshoot shrinks.
The noise covariance has the shape of |H|, with H here the Hessian, and a fixed total variance 2σ².
So the noise falls almost entirely across the river.

Cosine and warmup–stable–decay end at 2% of η.
Warmup–stable–decay takes 40 warmup steps, then decays linearly over the last 20%.
The batch ramp keeps the constant schedule’s η and doubles its batch at 80, 85, 90 and 95% of the run.
A batch of B divides the noise by √B, and the ramp uses 2.3 times the samples.

Schedule-free SGD steps `z ← z − γg̃(y)`, `x ← (1−c)x + cz`, `y = (1−β)z + βx`.
Its averaging weight c is proportional to γ², which makes the average uniform after its 100-step warmup.
With β = 0.9 and γ = 10η, (1−β)γ = η.
So the z step moves y as far as an SGD step at η would.
Across the valley that keeps it about as stable as SGD at η, but along the river its steps add up, much as a heavy ball’s do.

Final L averages each schedule’s last 64 finishers.

## Limits

On this sheet the loss falls linearly along the river, so every unit of summed learning rate is worth the same.
In pretraining it falls ever more slowly, as a power law of the summed learning rate.
So there cosine and warmup–stable–decay end close together (Hägele et al. 2024).

The split this sheet draws still survives at scale.
In language-model pretraining, the loss curve under a schedule can be predicted from two quantities (Tissue, Wang and Wang 2025; Luo et al. 2025):

1. The summed learning rate, which corresponds to the distance along the river.
2. The area of the decay, which corresponds to the drop from the walls.

Bergsma et al. (2025) also found that decaying linearly all the way to zero beats the common cosine decay to 10% of the peak.

On two parameters Muon reduces to normalized or sign descent, so this sheet cannot show what is distinctive about it.
A matrix model of a river valley does show the same split.
Shen et al. (2026) found that Muon moves faster along the river early, but near the bottom it converges slowly or overshoots, because its orthogonalized steps discard the gradient's scale.
They suggest finishing with a gradient-descent-like optimizer.

## References

- Loshchilov, I. and Hutter, F. (2017). SGDR: stochastic gradient descent with warm restarts. ICLR.
  The cosine schedule.
- Hu, S. et al. (2024). MiniCPM: unveiling the potential of small language models with scalable training strategies. arXiv:2404.06395.
  Introduces the warmup–stable–decay schedule.
- Hägele, A., Bakouch, E., Kosson, A., Ben Allal, L., Von Werra, L. and Jaggi, M. (2024). Scaling laws and compute-optimal training beyond fixed training durations. NeurIPS.
  A constant rate with a short cooldown matches cosine.
- Wen, K., Li, Z., Wang, J., Hall, D., Liang, P. and Ma, T. (2025). Understanding warmup-stable-decay learning rates: a river valley loss landscape perspective. ICLR.
  The river-valley explanation of warmup–stable–decay.
- Schaipp, F., Hägele, A., Taylor, A., Şimşekli, U. and Bach, F. (2025). The surprising agreement between convex optimization theory and learning-rate scheduling for large model training. ICML.
  A convex-optimization bound predicts the benefit of the cooldown.
- Defazio, A., Yang, X., Mehta, H., Mishchenko, K., Khaled, A. and Cutkosky, A. (2024). The road less scheduled. NeurIPS.
  Schedule-free SGD and AdamW.
- Song, M., Baek, B., Ahn, K. and Yun, C. (2025). Through the river: understanding the benefit of schedule-free methods for language model training. NeurIPS.
  Schedule-free AdamW follows the river without decay or extra averaging.
- Smith, S. L., Kindermans, P.-J., Ying, C. and Le, Q. V. (2018). Don’t decay the learning rate, increase the batch size. ICLR.
  Increasing the batch size can replace decaying the learning rate.
- McCandlish, S., Kaplan, J., Amodei, D. and the OpenAI Dota Team (2018). An empirical model of large-batch training. arXiv:1812.06162.
  The gradient noise scale predicts the critical batch size.
- Merrill, W., Arora, S., Groeneveld, D. and Hajishirzi, H. (2025). Critical batch size revisited: a simple empirical approach to large-batch language model training. NeurIPS.
  The critical batch size in OLMo pretraining starts near zero and levels off; batch-size warmup.
- Zhou, Z., Sun, Y., Li, B., Wang, J., Wu, H., Wu, L. and Yan, J. (2026). How does local landscape geometry evolve in language model pre-training? arXiv:2609.39767.
  Small batches widen the basin and large ones deepen it; proposes raising the batch late. Preprint.
- Tissue, H., Wang, V. and Wang, L. (2025). Scaling law with learning rate annealing. NeurIPS.
  Fits the loss as a power law in the summed learning rate minus a term in the area of the decay.
- Luo, K., Wen, H., Hu, S., Sun, Z., Sun, M., Liu, Z., Lyu, K. and Chen, W. (2025). A multi-power law for loss curve prediction across learning rate schedules. ICLR.
  Predicts loss curves under unseen schedules from the summed learning rate and power-law gains from decay.
- Bergsma, S., Dey, N., Gosal, G., Gray, G., Soboleva, D. and Hestness, J. (2025). Straight to zero: why linearly decaying the learning rate to zero works best for LLMs. ICLR.
  With a tuned peak, linear decay to zero beats cosine decay to 10% of the peak.
- Shen, T., Yang, J., Shi, R., Ma, J., Teng, J. and Ma, Z. (2026). Towards understanding the power and limits of the Muon optimizer: a river-valley perspective. arXiv:2606.21514.
  In a river-valley model, Muon is fast along the river early and slow or oscillating near the bottom.

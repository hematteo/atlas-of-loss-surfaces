# The river valley

## Subtitle

Five schedules run down one river valley.

## Lead

Language models are often trained with a [[warmup–stable–decay|wsd]] schedule (Hu et al. 2024; Hägele et al. 2024).
The loss falls slowly during a long phase at a constant [[learning rate|lr]] η, then sharply during a short decay.
Wen et al. (2025) offer one of several explanations: the loss surface is a river valley, with steep walls on either side and a gentle slope along the river.

## In practice

A checkpoint’s loss during the constant-η phase is a poor guide to its loss after decay.
Compare runs or checkpoints after a short cooldown, whatever explains the drop.

## Figure caption

Mean loss of each schedule in the latest cohort; for schedule-free, the loss at its averages. The dotted line marks the start of the decay.

## Try

1. Leave the noise σ at 1.4 → warmup–stable–decay falls below the constant schedule during its decay, and the batch ramp ends lower still.
2. Watch cosine → it ends highest.
   Distance along the river is proportional to the summed learning rate, so cosine travels half as far.
3. Watch schedule-free, read at its average → it reaches the end of the river in about 800 steps, about five times as fast as the constant schedule.
   Its average x moves at half the speed of the iterate z that it averages, `γ/2 = 5η`.
4. Set σ to 0 → the constant schedule and the batch ramp end together, lowest of the four SGD schedules.
   Decay pays off only when noise holds particles up the walls.

## Background

Hu et al. (2024) introduced warmup–stable–decay for MiniCPM.
Hägele et al. (2024) showed that a constant rate with a short cooldown matches cosine and lets one run serve many training lengths.
In the river valley of Wen et al. (2025), the high η of the stable phase makes the iterate oscillate across the valley while it moves quickly along the river.
The decay damps the oscillation and reveals the progress made along the river.
Wen et al. also showed that such a landscape arises even for a bigram model.
Schaipp et al. (2025) give another account: a bound from non-smooth convex optimization, with no valley in it, already predicts the benefit of the cooldown.

[[Schedule-free SGD|sf]] (Defazio et al. 2024) has no schedule: it evaluates a running average of its iterates and takes gradients at a point between that average and the latest iterate.
Song et al. (2025) found that schedule-free AdamW follows the river without a decay phase or an extra averaged copy of the weights.
A larger [[batch|batch]] also lowers the noise: Smith et al. (2018) showed that multiplying the batch size B by k can replace dividing η by k.
The cost in samples depends on the critical batch size (McCandlish et al. 2018).
Merrill et al. (2025) found that in OLMo pretraining the critical batch size starts near zero, rises quickly and levels off.
A batch grown to follow it reached a slightly lower loss in 43% fewer steps.
Zhou et al. (2026, a preprint) also argue for raising the batch late.

## Method

Across the river the loss is `H·s/(1 + s)` with `s = λv²/2H`, v the distance from the river, λ = 140 and H = 0.9, plus a small `0.05v²`.
Along it the loss falls by 0.08 per unit of θ₁ to the minimum, at a wall at the far end.
Twelve particles per schedule run 1,800 steps from the head at η = 0.0125, so ηλ = 1.75 across.
The noise covariance is proportional to |H|, so the noise falls almost entirely across the river.
Cosine and warmup–stable–decay (40 warmup steps, then linear decay over the last 20%) end at 2% of η.
The batch ramp doubles its batch at 80, 85, 90 and 95% of the run, dividing the noise by √B; it uses 2.3 times the samples.
Schedule-free SGD steps `z ← z − γg̃(y)`, `x ← (1−c)x + cz`, `y = (1−β)z + βx`.
Its c is proportional to γ² (uniform after its 100-step warmup), β = 0.9 and γ = 10η, so (1−β)γ = η; its loss is read at x.
Final L averages each schedule’s last 64 finishers.

## Caveat

Along this river the loss falls linearly with distance, so every unit of summed learning rate is worth the same.
A schedule that gives some up never recovers it.
In pretraining the loss falls ever more slowly, and cosine and warmup–stable–decay end close together (Hägele et al. 2024).

## At scale

In language-model pretraining, the loss curve under a schedule can be predicted from two quantities (Tissue, Wang and Wang 2025; Luo et al. 2025).
One is the summed learning rate, which corresponds to the distance along the river.
The other is the area of the decay, which corresponds to the drop from the walls.
Unlike on this sheet, the loss falls as a power law of the summed learning rate, not linearly.
Bergsma et al. (2025) found that decaying linearly all the way to zero beats the common cosine decay to 10% of the peak.

## References

- Loshchilov, I. and Hutter, F. (2017). SGDR: stochastic gradient descent with warm restarts. ICLR.
  The cosine schedule.
- Hu, S. et al. (2024). MiniCPM: unveiling the potential of small language models with scalable training strategies. arXiv:2404.06395.
  Introduces the warmup–stable–decay schedule.
- Hägele, A., Bakouch, E., Kosson, A., Ben Allal, L., Von Werra, L. and Jaggi, M. (2024). Scaling laws and compute-optimal training beyond fixed training durations. NeurIPS.
  A constant rate with a short cooldown matches cosine.
- Wen, K., Li, Z., Wang, J., Hall, D., Liang, P. and Ma, T. (2025). Understanding warmup-stable-decay learning rates: a river valley loss landscape view. ICLR.
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

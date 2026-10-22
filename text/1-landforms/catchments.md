# Basins of attraction

## Subtitle

The map draws each basin of attraction and counts where particles come to rest, to test whether a basin’s size predicts where optimizers end.

## Lead

[[Gradient flow|gflow]] is the limit of gradient descent as the step size goes to zero.
Under gradient flow, almost every starting point that stays on the sheet ends at a minimum, provided every saddle is [[strict|strictsaddle]].
So parameter space splits into [[basins of attraction|basin]], one per minimum.
A minimum’s basin is the set of starting points whose flow ends there.

Wu, Zhu and E (2017) and Huang et al. (2020) argued that minima that generalize well have much larger basins.
If so, a random initialization would usually land in one.
Whether basin volume explains which minima training finds is still open.
On this sheet we can measure each basin’s share of the area and check it against where the optimizers come to rest.

## In practice

Which minimum a run reaches depends on the seed, the learning rate and the gradient noise.
So use several seeds rather than trusting one.
Direct evidence that good minima win by basin volume comes only from small networks.

## Figure caption

The eight largest basins.
Each outline is the basin’s share of the lettered area.
Each bar is the share of one optimizer’s particles at rest that came to rest in that basin.
So a bar that fills its outline matches the basin’s area.

## Try

1. Let about a thousand drops fall → the [[gradient descent|gd]] bars match the outlines within a few percentage points.
   At η = 0.004 gradient descent follows gradient flow closely.
2. Read the [[SGD|sgd]] bars → they match too.
   A [[divide|divide]] is the boundary between basins, and at σ = 0.6 SGD’s noise rarely carries a particle across one.
3. Raise η to 0.02 → the basin with the largest printed λ gets no arrivals.
   That η is above 2/λ<sub>max</sub> for this basin, so gradient descent is not [[stable|stab]] at its minimum (see <i>Stability and catapults</i>).
   The basin on the map has not changed, so area predicts arrivals only at minima where the optimizer can settle.
4. Raise η to 0.05 → gradient-descent particles are thrown into neighbouring basins.
   About 60% of SGD’s particles keep moving inside the wide basins and time out uncounted.

## Background

The divides between basins are made of the paths that run into saddles.
For a smooth loss whose saddles are all [[strict|strictsaddle]], the starting points of these paths form a set of zero volume.
At a degenerate saddle, which has no negative eigenvalue, they need not.

Lee et al. (2016) proved a matching result for gradient descent with a small fixed step.
From a random start, it almost surely does not converge to a strict saddle.

With a finite step the basins themselves change.
SGD’s noise effectively smooths the loss, which lets it escape sharp local minima (Kleinberg, Li and Yuan 2018).
So the basins SGD sees depend on η and on the noise.

In a large network the basins cannot be mapped, so the case for volume is indirect.
Wu, Zhu and E made it with theory for two-layer networks and with experiments on deeper ones.
Huang et al. made the same argument with visualizations.
In high dimensions a small difference in width becomes a huge difference in volume, because volume multiplies the widths in every direction.

Chiang et al. (2023) tested this volume hypothesis by drawing random weights until a network fit its training set.
If SGD found good minima for reasons beyond volume, it should have beaten this random search.
At small scale, the random networks generalized about as well as ones trained by SGD.

## Method

The surface is built like the survey sheet: a gentle bowl with Gaussian wells and hills, plus a faint ridged texture.
The basins are computed on a grid of 321 × 201 cells over the surface without the texture.
Each cell points to its steepest-descending neighbour, and cells that lead to the same lowest cell form one basin.
Following the pointers from any cell traces its descent path, so this is a discrete gradient flow.

The dash-dot lines are the basin boundaries.
Basins larger than 0.8% of the sheet are lettered by area, A largest.
Each label gives the basin’s share of the area and λ<sub>max</sub> at its minimum.
Under gradient flow, a uniform random start reaches each minimum with probability equal to its basin’s share of the volume.

Every 5 steps a drop is released at a uniformly random point, alternating between full-batch gradient descent and SGD.
Both move on the textured surface.
When a particle comes [[to rest|rest]], the basin under its averaged position gets one arrival.
Particles that leave the sheet, or time out after 2,475 steps, are not counted.
The readout 2/η is the λ<sub>max</sub> of the sharpest minimum gradient descent can settle in.

## Limits

Because the bars count only particles at rest, at large η or σ they show where SGD settles, not where its particles are.
In a network, basin volumes are instead estimated from the Hessian or by sampling.

Nor are a network’s minima isolated points with separate basins.
Minima found from different seeds are joined by paths of low loss (see <i>Mode connectivity</i>).
They may also lie in one basin once their hidden units are permuted into corresponding order (see <i>Twins and re-basin</i>).
Which basin a run ends in is decided early in training (see <i>Forks in the road</i>).

At larger scale the volume argument has indirect support.
Mingard et al. (2021) found that how often SGD finds a function tracks the function’s Bayesian posterior probability.
That probability is a volume under the prior on weights.

## References

- Wu, L., Zhu, Z. and E, W. (2017). Towards understanding generalization of deep learning: perspective of loss landscapes. arXiv:1706.10239.
  Argues that the basins of minima that generalize well take up most of the volume, so random initialization finds them.
- Huang, W. R., Emam, Z., Goldblum, M., Fowl, L., Terry, J. K., Huang, F. and Goldstein, T. (2020). Understanding generalization through visualizations. NeurIPS Workshop “I Can’t Believe It’s Not Better!”, PMLR 137.
  Visualizes the volume argument: in high dimensions, wide minima occupy vastly more volume than narrow ones.
- Chiang, P., Ni, R., Miller, D. Y., Bansal, A., Geiping, J., Goldblum, M. and Goldstein, T. (2023). Loss landscapes are all you need: neural network generalization can be explained without the implicit bias of gradient descent. ICLR.
  Random guess-and-check training generalizes about as well as SGD at small scale, supporting the volume hypothesis.
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49.
  From a random start, gradient descent with a small step almost surely avoids strict saddles.
- Kleinberg, R., Li, Y. and Yuan, Y. (2018). An alternative view: when does SGD escape local minima? ICML.
  SGD behaves like gradient descent on a smoothed loss and can escape sharp local minima.
- Mingard, C., Valle-Pérez, G., Skalse, J. and Louis, A. A. (2021). Is SGD a Bayesian sampler? Well, almost. JMLR 22(79).
  The probability that SGD finds a function closely tracks its Bayesian posterior probability.

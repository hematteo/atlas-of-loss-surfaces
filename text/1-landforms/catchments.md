# Basins of attraction

## Subtitle

The map draws each basin of attraction and counts where particles come to rest.

## Lead

Under [[gradient flow|gflow]], almost every starting point ends at a minimum, so the plane splits into [[basins of attraction|basin]].
Wu, Zhu and E (2017) and Huang et al. (2020) argued that minima that generalize well have much larger basins; whether basin volume explains which minima training finds is open.

## In practice

Which minimum you reach depends on the seed, the step size and the gradient noise, so use several seeds.
That good minima win by basin volume is supported only in small networks.

## Figure caption

For each basin, its share of the area (outline) and, of each optimizer’s particles that came to rest, the share that came to rest in it. The eight largest basins are shown.

## Try

1. Let about a thousand drops fall → the [[gradient descent|gd]] bars match the outlines within a few percentage points: at η = 0.004 it follows gradient flow closely.
2. Read the [[SGD|sgd]] bars → they match too: at σ = 0.6 its noise rarely carries a particle across a [[divide|divide]].
3. Raise η to 0.02, above 2/λ<sub>max</sub> for the basin with the largest printed λ → no arrivals there: gradient descent is not [[stable|stab]] at that minimum.
4. Raise η to 0.05 → gradient-descent particles are thrown into neighbouring basins, and about 60% of SGD’s keep moving inside the wide basins and time out uncounted.

## Background

For a smooth loss, the starting points from which gradient flow ends at a saddle form a set of zero volume.
Lee et al. (2016) proved the same for gradient descent with a small fixed step: from a random start it almost surely does not converge to a strict saddle.
The divides between basins are made of the paths that run into saddles.
With a finite step the basins change: gradient descent cannot settle at a minimum with `λ_max > 2/η`, so that minimum attracts no runs (see <i>Sharp and flat minima</i>).
SGD’s noise effectively smooths the loss, which lets it escape sharp local minima (Kleinberg, Li and Yuan 2018), so its effective basins depend on η and the noise.

In a large network the basins cannot be mapped.
Wu, Zhu and E (2017) analysed two-layer networks and estimated volumes from the Hessian.
They argued that the basins of minima that generalize well take up far more volume than those of poor minima, so randomly initialized optimizers mostly find good ones.
Huang et al. (2020) made the same argument with visualizations: in high dimensions a small difference in width becomes a huge difference in volume.
Chiang et al. (2023) tested this volume hypothesis by drawing random weights until a network fit its training set; at small scale these networks generalized about as well as ones trained by SGD.
The test works only at small scale, so the question is open for large networks.

## Method

The surface is built like the survey sheet: a gentle bowl with Gaussian wells and hills, plus a faint ridged texture.
The basins are computed on a grid of 321 × 201 cells over the surface without the texture: each cell points to its steepest-descending neighbour, and cells that lead to the same lowest cell form one basin.
The dash-dot lines are the basin boundaries.
Basins larger than 0.8% of the sheet are lettered by area, A largest; each label gives the basin’s share of the area and λ<sub>max</sub> at its minimum.
Under gradient flow, a uniform random start reaches each minimum with probability equal to its basin’s share of the volume.

A drop is released every 5 steps at a uniformly random point, alternating between full-batch gradient descent and SGD, which move on the textured surface.
When a particle comes [[to rest|rest]], the basin under its averaged position gets one arrival.
Particles that leave the sheet, or time out after 2,475 steps, are not counted.
The readout 2/η is the sharpest minimum gradient descent can settle in.

## Caveat

The bars count only particles that came to rest, so at large η or σ they show where SGD settles, not where it is.
In a network, basin volumes cannot be counted like this; they are estimated from the Hessian or by sampling.

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

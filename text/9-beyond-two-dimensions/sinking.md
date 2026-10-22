# The sinking minima

## Subtitle

A random loss in 2 to 32 dimensions, seen through a slice that follows one descent, to ask why its minima sit near the bottom.

## Lead

In two dimensions a random landscape has wells at every height, and gradient descent can stop in a shallow one.
In many dimensions this changes.
A point is a minimum only if the loss curves up in every direction, and high on the landscape some direction almost always still curves down.
So the minima sit near the bottom, in a narrow band of loss (Bray and Dean 2007; Choromanska et al. 2015).

We cannot draw a loss over 32 parameters, but we can follow one descent through it.
The map is a [[slice|slice]] through the walkers, along their direction of travel and the direction that curves down most steeply.
When they leave it, the next slice is drawn at their new position, at its true depth.
So we can watch the floor drop away under them until every direction curves up.

## In practice

Large networks trained from different random seeds usually reach similar training losses.
This plate shows one reason: in many dimensions, the minima that gradient descent can stop in lie in a narrow band near the bottom.
In this picture a loss that stalls high is more likely near a [[saddle|saddle]] or on a plateau than in a bad minimum.
In real networks the evidence for this is weaker than it first looked (see <i>Saddle points</i>).

## Figure caption

Above: the loss per parameter L/d along the walkers' descent (red), and the bottom of each view while it was shown (black).
The numbers count the directions that curved down when each view was drawn.
Below: where descents from random starts come to rest at each d, with the mean ± one standard deviation.

## Try

1. Leave d at 32 and watch the walkers → they pass through about fifteen views on the way down, each lower than the last.
   A ring round the walkers marks the floor of each earlier view, and the pole rises to where they started.
   The stack of rings above them is how far they have sunk through floors that each looked like the bottom.
   The number of directions that curve down falls from 18 of 32 at the start to 0 or 1 near the end.
2. Set d to 2 → one view holds both directions, so the map is the whole landscape and is usually drawn only once.
   The walkers stop in whatever well they reach, and nothing below it is hidden.
3. Read the lower figure → descents from random starts end at L/d about −1.27 ± 0.54 at d = 2 and −1.73 ± 0.07 at d = 32.
   In many dimensions they stop at nearly the same depth, near the bottom of the range.
4. Set d to 8 → the walkers pass through a handful of views and stop higher, at L/d about −1.21.
   At d = 8, descents from random starts still end over a wide range, ± 0.23.

## Background

Bray and Dean (2007) counted the critical points of a Gaussian random field in d dimensions, by loss and by index.
Their field had no bowl around it, like the one on this plate.
At a critical point whose loss per parameter is e, they found that the Hessian’s eigenvalues fill Wigner’s semicircle, shifted by an amount proportional to e.
In this plate’s units the semicircle has radius 2 and is centred on −e.

The index fraction is the part of the semicircle below zero, so it is a function of the loss.
As d → ∞, every eigenvalue is positive only when e ≤ −2.
So minima exist only at the bottom of the range, and maxima only at the top.
As d grows, the losses of critical points with a given index concentrate around this curve.

Fyodorov (2004) counted the critical points of the same kind of field inside a bowl `(μ/2)|θ|²`.
Their number grows exponentially with d when the bowl is shallow, and it does not when the bowl is steep.

Auffinger, Ben Arous and Černý (2013) proved a similar picture for the spherical spin glass.
Its lowest critical values are layered by index, with minima lowest, then saddles of index 1, 2 and so on, in a band just above the global minimum.
Choromanska et al. related a simple network’s loss to this spin glass under strong assumptions, among them that its variables are independent.

Numerical studies followed.
Dauphin et al. found that the index of critical points in small networks rises with their loss.
Sagun et al. (2014) found the narrow band in spin-glass simulations and in teacher–student networks on MNIST, and found that gradient descent and SGD both reach it.

A slice that follows a descent has to contain its direction of travel.
A random plane holds only about 2/d of each step's squared length, 6% at d = 32.
So the walkers would leave it at once (see <i>What a slice hides</i>).

## Method

The loss is a sum of K = 256 random cosines, `L(θ) = √(2d/K) Σₖ cos(wₖ·θ + bₖ)`.
Here `wₖ ~ N(0, I/d)` and bₖ is uniform (Rahimi and Recht 2007).
This approximates a [[Gaussian random field|grf]] with covariance `d·exp(−|θ − θ′|²/2d)`, Bray and Dean's scaling.
So at a critical point the Hessian depends on the loss per parameter L/d in the same way in every d (see Background).
The correlation length is √d.

A descent is gradient descent with η = 0.1 from a random start `θ ~ N(0, 3²I)`, run until `|∇L|/√d < 10⁻⁴`.
Two starts drawn this way lie a root-mean-square distance of about 4.2 correlation lengths apart, in every d.
The plate computes the whole descent ahead, and three walkers (two on a phone) replay it.

Each view is the plane through the walkers spanned by two directions:

1. Their direction of travel, `u = −∇L/|∇L|`, drawn along θ₁.
2. The Hessian's eigenvector with the lowest eigenvalue, made orthogonal to u, along θ₂ (the next eigenvector if that one lies nearly along u).

So the slice contains the steepest way down, and the direction that curves down most steeply or one within about 11° of it.

One map unit is 0.6 correlation lengths.
When the view changes, the walkers keep their place on the map.
If they are past the middle of the map or near its edge, the new view starts them again on the left.

A new view is drawn when the walkers drift more than 0.05 correlation lengths off the plane, or near the edge of the sheet.
Short stretches of the descent are replayed slowly, so that each view stays up for at least 80 steps of the simulation.

When the view changes, the drawn terrain blends from the old slice into the new one over about a second.
During the blend the drawing is a mix of two slices, not a slice itself; the walkers' losses stay exact.
Heights are L/d + 2.2, drawn at twice the atlas's usual height scale, so every view stands at its true depth.
The contour labels and the hover read L/d.

In the background the plate runs descents from random starts on the same landscapes.
It runs 40 at d ≤ 8, 32 at d = 16 and 24 at d = 32.

## Limits

Each view shows two of the d directions.
Because a slice contains the steepest way down and the most downward-curving direction, it never hides that a way down exists.
It can still hide how the rest of the landscape bends.
The plate also follows only one descent at a time, so the claim about all minima rests on the lower figure.

At d = 32 the field has only 8 cosines per parameter, so it is only roughly Gaussian.
Thirty-two is also far from large, so the band of minima still has soft edges.

A network's loss is not a Gaussian field.
It has layers and symmetries, so many minima are copies of one another (see <i>Twins and re-basin</i>).
In an overparameterized network the global minima form manifolds, of dimension the number of parameters minus the number of training examples (Cooper 2018).
Minima are often joined by paths along which the loss barely rises (Draxler et al. 2018), so the bottom is connected, not a band of isolated points.

For networks themselves, exact results exist in simpler settings.
Huang, Loureiro and Sarao Mannelli (2026) described the local minima of two-layer ReLU networks learning from a teacher network exactly, through a few summary statistics.
They found that overparameterization makes the global minima easier to reach.
Baity-Jesi et al. (2018) found that training slows as flat directions multiply, with dynamics unlike those of mean-field glasses.
Frye et al. (2021) found that the methods used to find critical points of networks often stop at gradient-flat points instead.

"The floor keeps going" has two other senses in the atlas.
In <i>Mode connectivity</i>, minima are joined by paths of low loss, so the floor extends between them.
In <i>The road to infinity</i>, the loss has no minimum at all, and gradient descent travels outwards forever as the loss falls towards zero.

## References

- Bray, A. J. and Dean, D. S. (2007). Statistics of critical points of Gaussian fields on large-dimensional spaces. Physical Review Letters 98(15), 150201.
  At a critical point of a high-dimensional Gaussian field, the Hessian is a shifted semicircle, so the index is set by the loss.
- Fyodorov, Y. V. (2004). Complexity of random energy landscapes, glass transition, and absolute value of the spectral determinant of random matrices. Physical Review Letters 92(24), 240601.
  Counts the critical points of a random field in a bowl, and finds them exponentially many when the bowl is shallow.
- Auffinger, A., Ben Arous, G. and Černý, J. (2013). Random matrices and complexity of spin glasses. Communications on Pure and Applied Mathematics 66(2), 165–201.
  Proves that the low critical values of the spherical spin glass are layered by index, with minima at the bottom.
- Choromanska, A., Henaff, M., Mathieu, M., Ben Arous, G. and LeCun, Y. (2015). The loss surfaces of multilayer networks. AISTATS.
  Relates a network’s loss to a spin glass, and finds the test losses reached by SGD spreading less in larger networks.
- Sagun, L., Guney, V. U., Ben Arous, G. and LeCun, Y. (2014). Explorations on high dimensional landscapes. arXiv:1412.6615 (ICLR 2015 workshop).
  Finds the narrow band of critical values numerically, and finds that gradient descent and SGD reach it.
- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS.
  Argues that high-loss critical points in high dimensions are mostly saddles, and measures index against loss in small networks.
- Rahimi, A. and Recht, B. (2007). Random features for large-scale kernel machines. NeurIPS.
  Random Fourier features: a sum of random cosines whose covariance approximates a chosen kernel.
- Cooper, Y. (2018). The loss landscape of overparameterized neural networks. arXiv:1804.10200.
  With n parameters and d data points, the global minima form a manifold of dimension n − d.
- Draxler, F., Veschgini, K., Salmhofer, M. and Hamprecht, F. A. (2018). Essentially no barriers in neural network energy landscape. ICML.
  Builds paths of nearly constant loss between minima of CIFAR-10 and CIFAR-100 networks.
- Baity-Jesi, M., Sagun, L., Geiger, M., Spigler, S., Ben Arous, G., Cammarota, C., LeCun, Y., Wyart, M. and Biroli, G. (2018). Comparing dynamics: deep neural networks versus glassy systems. ICML.
  Training slows as flat directions multiply, and its dynamics differ from those of mean-field glasses.
- Frye, C. G., Simon, J., Wadia, N. S., Ligeralde, A., DeWeese, M. R. and Bouchard, K. E. (2021). Critical point-finding methods reveal gradient-flat regions of deep network losses. Neural Computation 33(6).
  The methods used to find critical points of network losses often stop at gradient-flat points instead.
- Huang, J., Loureiro, B. and Sarao Mannelli, S. (2026). Sharp description of local minima in the loss landscape of high-dimensional two-layer ReLU neural networks. arXiv:2604.09412.
  In a teacher–student ReLU network, local minima described exactly by summary statistics; overparameterization helps reach the global ones.

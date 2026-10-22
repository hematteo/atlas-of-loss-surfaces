# Minima in many dimensions

## Subtitle

A random loss in 2 to 32 dimensions, searched for critical points, to see where its minima sit as the dimension grows.

## Lead

The [[index|index]] of a [[critical point|crit]] counts the directions in which the loss falls there: the negative eigenvalues of its [[Hessian|hessian]].
Divided by the number of parameters d, it becomes a fraction: 0 at a minimum, 1 at a maximum, and in between at a [[saddle|saddle]].

On a random loss over many parameters, this fraction rises with the loss (Bray and Dean 2007).
High critical points are saddles, and minima exist only near the bottom, where they crowd into a narrow band of loss.
Choromanska et al. (2015) argued that the losses of large networks share this structure.

So in many dimensions the minima do not keep sinking.
They sit at nearly the same loss, and descent from a random start stops among them.
This plate builds one random loss in d dimensions, for d from 2 to 32, and lets us watch that band form.

## In practice

Choromanska et al. trained a thousand small networks of each size on MNIST.
The larger the network, the less the test losses that SGD reached spread from run to run.
If a loss stalls at a high value, a saddle or a plateau is a likelier cause than a poor minimum (Dauphin et al. 2014).

## Figure caption

Above: every critical point found so far, by its loss per parameter L/d and the fraction of its Hessian’s eigenvalues that are negative.
Minima are red, and the dashed curve is Bray and Dean’s limit for d → ∞.
Below: the losses of the minima found (outlined) and of the particles at rest (filled).

## Try

1. Read the figure at d = 2 → three rows, at index fractions 0, ½ and 1: 10 minima, 16 saddles and 6 maxima.
   The minima span L/d from −1.45 to −0.09, and the lowest saddle lies at −0.70, below the highest minimum.
   In two dimensions a minimum needs only two positive curvatures, so minima and saddles overlap in loss.
2. Set d to 32 → the 161 critical points fall on one rising curve, 0.02 from the dashed limit on average, with correlation 0.998.
   All 61 minima lie between −1.92 and −1.57, and every saddle lies above them.
   A minimum now needs 32 positive curvatures, which happens only near the bottom of the range.
3. Read ‘descent at rest’ at d = 2, then set d to 32 → the final L/d goes from about −0.7 ± 0.4 to −1.73 ± 0.08.
   The spread falls from between a fifth and a third of the depth to about 4%.
   In two dimensions each particle stops at the minimum below its start, and those minima differ widely in loss.
4. Set d to 4, 8 and 16 in turn → the standard deviation of the minima’s L/d is 0.25, 0.21 and 0.13.
   It is 0.36 at d = 2 and 0.08 at d = 32, so the band narrows steadily as d grows.
   The spread of ‘descent at rest’ falls with it, to about 12%, 10% and 7% of the depth.
5. At d = 32, click the map → six particles start from one point of the map, each moved off the plane in its own direction.
   They reach six different minima, their projections scatter over about half a unit, and ‘descent at rest’ reads about −1.68 ± 0.05.
   The map is a slice, so the particles’ paths run mostly in directions it does not show.

## Background

Bray and Dean (2007) counted the critical points of a Gaussian random field in d dimensions, by loss and by index.
Their field had no bowl around it, like the one on this plate.
At a critical point whose loss per parameter is e, they found that the Hessian’s eigenvalues fill Wigner’s semicircle, shifted by an amount proportional to e.
In this plate’s units the semicircle has radius 2 and is centred on −e.

The index fraction is the part of the semicircle below zero, so it is a function of the loss: the dashed curve.
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

## Method

The loss is a [[Gaussian random field|grf]] made of K = 256 random Fourier features (Rahimi and Recht 2007):
`L(θ) = √(2d/K) Σₖ cos(wₖ·θ + bₖ)`, with `wₖ ~ N(0, I/d)` and `bₖ` uniform on [0, 2π).
Its covariance approaches `d·exp(−|θ − θ′|²/2d)`, Bray and Dean’s scaling.
With it the loss per parameter L/d, the semicircle and the curve are the same for every d, so we compare dimensions by L/d.
The correlation length is √d.

Each search starts at a random point and runs [[eigenvector following|efollow]] towards a target index k.
The target is 0 a third of the time and otherwise uniform from 1 to d.
Each step is a Newton step in the Hessian’s eigenbasis, uphill along the k lowest directions and downhill along the rest.
Its curvatures enter as |λ|, floored at 0.03, and it is at most half a correlation length long.
With k = 0 this is [[saddle-free Newton|sfn]].

A search ends at a critical point when `|∇L| < 10⁻⁷√d`, or gives up after 80 steps.
The index is counted from the eigenvalues there, and may differ from k.
Duplicates are dropped.
There are 240 searches, or 160 at d = 32, run a few steps per frame.

The map is the plane through the three lowest of the minima reached from eight starts (four for d ≥ 16), centred on their centroid.
One unit of the sheet is three correlation lengths, or more if the three minima need room.
At d = 2 the plane is the whole space, so the map is the landscape, and every critical point on it is marked.

Starts are uniform over the middle of the sheet, moved off the plane by a Gaussian offset of one correlation length in each other direction.
[[Particles|particle]] run [[gradient descent|gd]] `θ ← θ − 0.1∇L(θ)` in all d coordinates and are drawn at their projections.
A particle comes to rest when `|∇L|/√d < 10⁻³`, and its L/d enters ‘descent at rest’.

The depth is the mean L/d at the starts minus the lowest L/d found.
‘Descent at rest’ reports the standard deviation of the final L/d as a share of it.
The correlation is between L/d and the index fraction over the critical points found.
The gap ‘off the d → ∞ curve’ is the mean distance between a point’s index fraction and the curve at its L/d.

## Limits

The search is steered to chosen indices and starts near the sheet, so the figure does not show how many critical points of each kind exist.
Only their positions in loss and index carry meaning.

At d = 32 the field has only 8 cosines per parameter, so it is only roughly Gaussian.
Its points still follow the curve within 0.02 on average.
Thirty-two is also far from large.
The minima found sit between −1.92 and −1.57, above the limit of −2, because the edges of a finite matrix’s spectrum are soft.

A network’s loss is not a Gaussian field.
It has layers and symmetries, so many minima are copies of one another (see <i>Twins and re-basin</i>).
In an overparameterized network the global minima form manifolds, of dimension the number of parameters minus the number of training examples (Cooper 2018).
Minima are often joined by paths along which the loss barely rises (Draxler et al. 2018), so the bottom is connected, not a band of isolated points.

Baity-Jesi et al. (2018) compared training with the dynamics of glassy systems.
In overparameterized networks training slowed as flat directions multiplied, and near zero loss the weights drifted along a flat bottom.
Like mean-field glasses they crossed no barriers, but their dynamics differed, which points to differently organized landscapes.
Frye et al. (2021) found that the methods used to find critical points of networks often stop at gradient-flat points instead.

“The floor keeps going” has two other senses in the atlas.
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

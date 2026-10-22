# Survey of a loss surface

## Subtitle

SGD, the heavy ball and Adam descend a two-parameter surface built from features found in real networks.

## Lead

A neural network maps inputs to predictions using its parameters, the weights and biases, which we collect into a single vector θ.
The loss `L(θ)` measures the error of those predictions on the training data, and training minimizes it.

Every θ in parameter space has a loss value, so `L` defines a surface over that space: the [[loss surface|loss]].
Parameters that fit the training data well sit low on this surface, so training is a descent on it.
At each step an optimizer computes the gradient `∇L(θ)`, or a noisy estimate of it from a minibatch, and uses it to update θ.

How that descent goes depends on the geometry of the surface.
The geometry decides which minimum training converges to and how quickly, and it may also affect how well the trained network generalizes.
Studies of real networks keep finding four recurring features:

1. Minima of very different [[sharpness|sharpness]]: narrow wells and wide basins.
2. [[Ill-conditioned|cond]] valleys, with far higher curvature across the valley than along it.
3. [[Saddle points|saddle]], where the loss curves up in some directions and down in others.
4. [[Plateaus|plateau]], regions where both the gradient and the curvature are close to zero.

Real loss surfaces have millions or billions of dimensions and cannot be plotted directly.
This sheet builds all four features into a loss over just two parameters, θ₁ and θ₂, so we can plot it in full and watch [[SGD|sgd]], the [[heavy ball|hb]] and [[Adam|adam]] on each one.

## In practice

Treat a one- or two-dimensional loss plot as a slice, not a map: it shows only the directions it was cut along.
Normalize its directions filter by filter (Li et al. 2018), and check its apparent sharpness against [[Hessian|hessian]] eigenvalues.

## Figure caption

Where particles came to rest, by the loss of their minimum.
Columns are tinted by optimizer.

## Try

1. Click the curved ravine’s floor to release a [[cohort|cohort]] → [[SGD|sgd]] creeps along the floor.
   Across the floor the curvature λ is 210 to 330, so ηλ is already about 1 at the default [[learning rate|lr]] η.
   Each step multiplies the distance to the floor by 1 − ηλ, so one step across lands close to the floor.
   But a step small enough to be stable across the ravine makes little progress along it.
2. Watch the [[heavy ball|hb]] in the same cohort → it runs down the floor far ahead of SGD.
   Along the floor the gradient keeps its direction, so the heavy ball’s velocity builds up there (see <i>Ravines</i> and <i>Momentum</i>).
3. Raise η to about 1.3 times the 2/λ printed at the [[Sharp Minimum|@Sharp Minimum]] → SGD’s particles there no longer come [[to rest|rest]].
   Gradient descent is [[stable|stab]] only if `η < 2/λ_max`, and above 2/λ each step overshoots the minimum by more than the last.
   The heavy ball is stable up to `2(1 + β)/λ_max`, so it still settles there, and so does Adam (see <i>Stability and catapults</i>).

## Background

Real loss surfaces are studied in two indirect ways:

1. Slices plot the loss along a line or a plane through parameter space.
   Along the straight line from initialization to the trained solution, the loss falls monotonically for a range of standard networks (Goodfellow, Vinyals and Saxe 2015).
   Two-dimensional slices by Li et al. (2018) are nearly convex for networks with skip connections and chaotic for deep networks without them.
2. The [[Hessian|hessian]], the matrix of second derivatives of the loss, measures curvature.
   At the end of training its spectrum is a bulk of eigenvalues near zero plus a few large outliers (Sagun et al. 2018; Ghorbani, Krishnan and Xiao 2019).

Each feature also has its own literature:

1. Minima differ in sharpness, which has been linked to generalization (Keskar et al. 2017; see <i>Sharp and flat minima</i>).
2. Ill-conditioning limits the step size to `η < 2/λ_max`, so gradient descent moves slowly along directions of low curvature (LeCun et al. 1998).
3. [[Critical points|crit]] are points where the gradient is zero.
   Dauphin et al. (2014) argued that in high dimensions, those with high loss are mostly saddles, not local minima.
4. Plateaus appear when hidden units start nearly identical and training must break the symmetry between them (Saad and Solla 1995).

## Method

The sheet is an analytic function: a gentle bowl plus Gaussian wells and hills, a curved ravine, a high plateau and a faint ridged texture.
[[SGD|sgd]], the [[heavy ball|hb]] and [[Adam|adam]] start from the same points, so only the optimizer differs, and every step leaves ink.

Each [[particle|particle]] takes real optimizer steps on a gradient computed by central differences, with noise added: `g̃ = ∇L(θ) + σξ`, `ξ ~ N(0, I)`.
This noise is isotropic, the same size in every direction.
It is a simple stand-in for minibatch noise, which in real networks is anisotropic (see <i>The shape of the noise</i>).

[[Critical points|crit]] are found by Newton’s method, started wherever the gradient changes sign on a grid over the sheet without its texture.
Each is then refined on the full sheet and classified by the signs of the Hessian’s eigenvalues.
Saddles are drawn as passes, such as the [[Saddle of Hesitation|@Saddle of Hesitation]].

Among the minima more than 0.08 below their lowest pass, the [[Sharp Minimum|@Sharp Minimum]] is the one whose smaller Hessian eigenvalue is largest.
So it is sharp in every direction.
The [[Flat Basin|@Flat Basin]] is the one among them with the smallest λ<sub>max</sub>, so it is flat in every direction.
The figure is a histogram of the loss at which particles came [[to rest|rest]].

## Caveat

On this sheet a minimum is an isolated point and every feature is in view.
In an overparameterized network, which has more parameters than training examples, the global minima form high-dimensional manifolds (Cooper 2018).
Most Hessian eigenvalues there are near zero.

A two-dimensional slice through such a network shows only the directions it was cut along, and its apparent sharpness depends on the weights’ scale.
So the sheet shows kinds of feature, not any one network.

## At scale

In millions of dimensions, the curvature along a random direction weights all the Hessian’s eigenvalues nearly equally.
So it is roughly the average curvature, the Hessian’s trace divided by the dimension.
A random slice through a saddle with only a few directions of negative curvature then usually looks like a bowl.
Böttcher and Wheeler (2024) showed that slices along the top Hessian eigenvectors reveal what random ones hide.

The monotonic fall from initialization to solution is common but not universal.
Lucas et al. (2021) found that it fails systematically when training carries the weights far from their initialization.

In full-batch training λ<sub>max</sub> also climbs to 2/η and stays there while the loss keeps falling (see <i>The edge of stability</i>).
So training runs at the edge of the bound `η < 2/λ_max`, rather than safely inside it.

## References

- Robbins, H. and Monro, S. (1951). A stochastic approximation method. Annals of Mathematical Statistics 22(3).
  Stochastic approximation, the basis of SGD.
- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5).
  Introduces the heavy-ball method.
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR.
  Introduces Adam.
- LeCun, Y., Bottou, L., Orr, G. B. and Müller, K.-R. (1998). Efficient BackProp. In Neural Networks: Tricks of the Trade, Springer.
  Ties the largest stable learning rate to λ<sub>max</sub>, and the speed of convergence to the conditioning of the Hessian.
- Saad, D. and Solla, S. A. (1995). On-line learning in soft committee machines. Physical Review E 52(4), 4225–4243.
  Plateaus caused by symmetry between hidden units.
- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS.
  Argues that high-loss critical points in high dimensions are mostly saddles.
- Goodfellow, I. J., Vinyals, O. and Saxe, A. M. (2015). Qualitatively characterizing neural network optimization problems. ICLR.
  The loss along the straight line from initialization to solution usually falls monotonically.
- Keskar, N. S., Mudigere, D., Nocedal, J., Smelyanskiy, M. and Tang, P. T. P. (2017). On large-batch training for deep learning: generalization gap and sharp minima. ICLR.
  Large-batch training reaches sharper minima that generalize worse.
- Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018). Visualizing the loss landscape of neural nets. NeurIPS.
  Filter-normalized two-dimensional slices; skip connections keep them nearly convex.
- Sagun, L., Evci, U., Güney, V. U., Dauphin, Y. and Bottou, L. (2018). Empirical analysis of the Hessian of over-parametrized neural networks. ICLR Workshop Track.
  The Hessian spectrum after training: a bulk near zero and a few outliers.
- Cooper, Y. (2018). The loss landscape of overparameterized neural networks. arXiv:1804.10200.
  With n parameters and d data points, the global minima form a manifold of dimension n − d.
- Ghorbani, B., Krishnan, S. and Xiao, Y. (2019). An investigation into neural net optimization via Hessian eigenvalue density. ICML.
  Large outlier eigenvalues, and their suppression by batch normalization.
- Imhof, E. (1965). Kartographische Geländedarstellung. De Gruyter. English edition: Cartographic Relief Presentation (1982).
  The relief-shading conventions used for every sheet.
- Lucas, J., Bae, J., Zhang, M. R., Fort, S., Zemel, R. and Grosse, R. (2021). On monotonic linear interpolation of neural network parameters. ICML.
  The monotonic fall along the line from initialization is common but fails when the weights travel far.
- Böttcher, L. and Wheeler, G. (2024). Visualizing high-dimensional loss landscapes with Hessian directions. Journal of Statistical Mechanics: Theory and Experiment 2024, 023401.
  Random projections see the average curvature and misrepresent saddles; Hessian directions do not.

# Survey of a loss surface

## Subtitle

SGD, the heavy ball and Adam descend a two-parameter surface built from features described in studies of real networks.

## Lead

Training a network moves its parameters θ downhill on the [[loss surface|loss]] `L(θ)`.
The shape of that surface affects which minimum training reaches, how quickly, and possibly how well the result generalizes.
Studies of real networks most often describe minima of very different [[sharpness|sharpness]], [[ill-conditioned|cond]] valleys, [[saddle points|saddle]] and [[plateaus|plateau]].

## In practice

Treat a one- or two-dimensional loss plot as a slice, not a map.
Normalize its directions filter by filter (Li et al. 2018) and check its apparent sharpness against Hessian eigenvalues.

## Figure caption

Where particles came to rest, by the loss of their minimum. Columns are tinted by optimizer.

## Try

1. Click the curved ravine’s floor to release a [[cohort|cohort]] → [[SGD|sgd]] zigzags between the walls: a step small enough to be stable across the ravine makes little progress along it.
2. Watch the [[heavy ball|hb]] in the same cohort → it moves along the floor: its velocity averages out the zigzag (see <i>Ravines</i> and <i>Momentum</i>).
3. Raise η above the 2/λ printed at the [[Sharp Minimum|@Sharp Minimum]] → particles there stop converging: gradient descent is [[stable|stab]] only if `η < 2/λ_max` (see <i>Stability and catapults</i>).

## Background

Real loss surfaces have millions of dimensions, so they are studied indirectly.
One method plots the loss along a line or a plane through parameter space.
Goodfellow, Vinyals and Saxe (2015) found that, for a range of standard networks, the loss falls monotonically along the straight line from the initialization to the trained solution.
Li et al. (2018) showed two-dimensional slices that are nearly convex for networks with skip connections and chaotic for deep networks without them.
The other method measures curvature through the [[Hessian|hessian]].
At the end of training its spectrum is a bulk of eigenvalues near zero plus a few large outliers (Sagun et al. 2018; Ghorbani, Krishnan and Xiao 2019).

Each feature on this sheet has its own literature.
Minima differ in sharpness, which has been linked to generalization (Keskar et al. 2017; see <i>Sharp and flat minima</i>).
Dauphin et al. (2014) argued that in high dimensions, [[critical points|crit]] with high loss are mostly saddles, not local minima.
Plateaus appear when hidden units start nearly identical and training must break the symmetry between them (Saad and Solla 1995).
Ill-conditioning limits the step size: gradient descent needs `η < 2/λ_max`, so it moves slowly along directions of low curvature (LeCun et al. 1998).

## Method

The sheet is an analytic function: a gentle bowl plus Gaussian wells and hills, a curved ravine, a high plateau and a faint ridged texture.
[[SGD|sgd]], the [[heavy ball|hb]] and [[Adam|adam]] start from the same points, and every step leaves ink.
Each particle takes real optimizer steps on the gradient, computed by central differences, with noise added: `g̃ = ∇L(θ) + σξ`, `ξ ~ N(0, I)`.
This isotropic noise is a simple stand-in for minibatch noise, which in real networks is anisotropic (see <i>The shape of the noise</i>).

[[Critical points|crit]] are found by Newton’s method, started wherever the gradient changes sign on a grid, and classified by the signs of the Hessian’s eigenvalues.
Saddles are drawn as passes, such as the [[Saddle of Hesitation|@Saddle of Hesitation]].
Among the minima that lie more than 0.08 below their lowest pass, the one whose smaller Hessian eigenvalue is largest, so sharp in every direction, is labelled the [[Sharp Minimum|@Sharp Minimum]].
The one with the smallest λ<sub>max</sub>, so flat in every direction, is labelled the [[Flat Basin|@Flat Basin]].
The figure is a histogram of the loss at which particles came [[to rest|rest]].

## Caveat

On this sheet a minimum is an isolated point and every feature is in view.
In an overparameterized network the global minima form high-dimensional manifolds (Cooper 2018), most Hessian eigenvalues are near zero, and a two-dimensional slice shows only the directions it was cut along.
The apparent sharpness of a slice also depends on the weights’ scale, so Li et al. (2018) normalize each direction filter by filter.

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

# Double descent

## Subtitle

Gradient descent fits p random features to 40 examples, and the test error peaks at p = 40 before falling again.

## Lead

Classical statistics expects test error to fall and then rise as a model gains parameters, tracing a U-shaped curve.
[[Double descent|ddescent]] adds a second fall.
The error peaks where the model can just fit every training example, the [[interpolation threshold|interp]].
It then falls again as the parameters keep growing (Belkin et al. 2019).

This is part of why networks large enough to fit their training data exactly can still generalize well.
It also means that a model with just enough parameters to fit its data can be the worst size to choose.

Here the model is linear in its p parameters, so the training loss is a quadratic function of p variables.
With fewer parameters than the n = 40 examples, it is a bowl with one minimum.
As p nears n, the bowl’s flattest direction loses almost all its curvature.
Noise in the labels then carries the minimum far along that direction.
Beyond n, the minimum becomes a flat set of exact fits.

The map is a plane through this loss, redrawn for each p.
On it, [[gradient descent|gd]] from zero lands on the [[minimum-norm solution|minnorm]].
A random initialization lands elsewhere on the same flat floor, with a larger norm.

## In practice

Near the interpolation threshold, adding parameters, data or epochs can raise the test error, so compare model sizes on both sides of it.
Tuned weight decay removes the peak (Nakkiran et al. 2021), and on this plate so does [[early stopping|earlystop]].
Past the threshold, many parameter settings fit the training set exactly, and the optimizer and its initialization decide which one training returns.

## Figure caption

Top: test error against the number of parameters p, on this plate’s training set.
The curves are for gradient descent from zero, for random inits of scale s on average, and for weight decay tuned at each p.
Dashed: p = n = 40; solid: the current p; dots: where this plate’s particles ended.
Bottom: the latest race against iterations of gradient descent, with test error solid and training loss dashed.
The circle marks the lowest test error of gradient descent from zero.

## Try

1. Set p = 10 → the plane shows a bowl with one minimum, at training loss 0.221 and test error 0.645.
   Gradient descent from zero and from a random init end at the same point.
   With fewer parameters than examples, the least-squares solution is unique.
2. Set p = 40 → the bowl stretches into a long trough with an almost flat floor, and the smallest eigenvalue of the [[Hessian|hessian]] falls to 5.4×10⁻⁷.
   The minimum lies far along the floor, at ‖θ‖ 154 and test error 44.
   Along that direction the fit divides the matching component of the labels by √(nλ), so a little label noise becomes a long step in θ.
3. Watch the lower panel at p = 40 → gradient descent from zero reaches its lowest test error, 0.199, at iteration 83.
   It then climbs to 44 over 1.3×10⁶ iterations, while weight decay stops at 0.179.
   The flat direction is learned last, at rate ηλ per iteration, so stopping early or decaying the weights leaves its noise out.
4. Set p = 120 → gradient descent from zero climbs straight from the [[Origin|@Origin]] to the [[Minimum-norm solution|@Minimum-norm solution]], at ‖θ‖ 12.3 and test error 0.209.
   The random init comes down onto the flat floor further right, at ‖θ‖ 15.1 and test error 0.229.
   Gradient descent never changes the part of θ in the [[null space|nullspace]] of X, so each start lands on the exact fit nearest to it.
   At init scale s = 3 the random init ends at test error 0.608.
5. Click the map above the floor, left of the minimum-norm solution → the random init starts there and walks straight down onto the floor below the click.
   It ends at ‖θ‖ 14.9 and test error 0.298.
   Its position along the floor is a null-space coordinate, which gradient descent leaves unchanged.
6. Set σ = 0 at p = 40 → the peak falls from 44 to 14 but does not vanish.
   The labels are now exact, but 40 random features represent the target only roughly, and the part they miss acts like noise.

## Background

The peak is old.
Loog et al. (2020) trace it back to 1989, in physics studies of the minimum-norm linear classifier, followed by pattern-recognition studies on real data.
Belkin et al. (2019) named double descent and argued that it is general, showing it for random Fourier features on MNIST among other models.
The norm of their fitted coefficients peaks at the threshold and falls beyond it, since larger models contain smoother exact fits.

Nakkiran et al. (2020) found double descent in CNNs, ResNets and transformers, both as width grows and as training goes on.
It is strongest with label noise in the training set.
They also found settings in which more training data hurts.

In least squares the peak has a simple cause.
At p = n the matrix X of training features is square, and its smallest singular value is typically tiny.
The solution divides the labels’ component along that direction by it, so label noise is amplified.
Hastie et al. (2022) computed the risk exactly as p and n grow together.
Below the threshold it is pure variance, which diverges as p/n → 1.
With isotropic features, Nakkiran et al. (2021) proved that optimally tuned ridge regression has no peak: its test risk falls monotonically as samples or features are added.
Mei and Montanari (2022) derived exact curves for random features regression, whose lowest test error lies above the threshold.

The second half of the plate is about [[implicit bias|implicit]].
Every gradient `Xᵀ(Xθ − y)/n` lies in the row space of X, which is why the part of θ in the null space never changes (Try 4).
Started from zero, gradient descent therefore converges to the exact fit of least norm (Zhang et al. 2017).
Advani, Saxe and Sompolinsky (2020) call this part of the weights a frozen subspace, and found that low test error in high dimensions requires small initial weights.
d’Ascoli et al. (2020) traced the peak to the variance due to label noise and to the random draw of the features, which is the initialization in their model, and found that ensembling independently initialized models suppresses both.
This plate keeps its features fixed, so its θ₀ is a different kind of initialization from theirs.

Whether fitting noisy labels exactly is harmless depends on the features.
Bartlett et al. (2020) showed that the minimum-norm fit is nearly optimal only when the features have far more than n directions that matter little for prediction.
Those directions absorb the noise.
On this plate they absorb it only in part: at σ = 1 the test error at p = 200 is 1.5, worse than predicting zero.
For the same bias in classification, where the loss has no minimum, see <i>The road to infinity</i>.

## Method

The inputs z are 10-dimensional standard Gaussian vectors, and the target is linear, `f(z) = ⟨β, z⟩` with ‖β‖ = 1.
The n = 40 training labels are `y = f(z) + σε`, with ε a fixed draw of standard Gaussian noise.
The features are 200 random ReLU features `φⱼ(z) = max(0, ⟨wⱼ, z⟩)` less their mean, with `wⱼ ~ N(0, I/10)`, divided by √p.
A model with p parameters uses the first p of them, so the models are nested.

The training loss is `L(θ) = ‖Xθ − y‖²/2n`, where row i of X holds the p features of example i, and its Hessian is `H = XᵀX/n`.
The test error is the mean squared error against f on fresh inputs, so predicting zero scores 1.
It is computed exactly, not on a test sample, because two ReLU features of a Gaussian input have a closed-form covariance, the arc-cosine kernel.

Each particle holds θ in the eigenbasis of H, where gradient descent with learning rate `η = 1/λ_max` acts on each coordinate separately.
So it can jump any number of iterations exactly, however small the curvature.
A particle advances a quarter of an iteration per step at first, drawn as a straight line between iterates, and later 1.5% more iterations per step.
A race ends once the slowest direction has shrunk by a factor e⁹, after at least 10⁴ iterations.

The random init is a fixed draw `θ₀ ~ N(0, s²I)`, with a little jitter for each particle.
Weight decay starts from zero.
Its λ is the one of 29 values from 10⁻⁷ to 1 that gives the lowest test error at the current p and σ.
This tuning uses the test error itself, as in Nakkiran et al. (2021).
The curves are computed a few values of p per frame.
The average over random inits adds `s² tr(PΣ)` to the minimum-norm test error, where P projects onto the null space and Σ is the features’ covariance.

The map is the plane through the minimum-norm solution θ̂ spanned by two directions.
The first is the softest eigenvector of H when p ≤ n.
When p > n it is the null-space part of the random init, so that the init’s end lies on the plane.
The second points from the origin to θ̂.
Particles are drawn at their projections onto the plane, but their losses are the full p-dimensional ones.
Heights are `L/(L + L(0))`, which increases with the training loss.
So contours are still its level sets, while the steep walls near p = n stay in view.

## Limits

The model is linear in θ because the random features are fixed, so the training loss is exactly quadratic.
It is a bowl, or a trough with no curvature at all along the null space.
In a network the features change during training, and the exact fits form curved manifolds rather than flat sets (see <i>Minima in many dimensions</i>).

The figure shows one training set.
The height of the peak varies widely between training sets, from about 1 to several thousand, so change the seed to compare.
The peak can also sit a step or two to either side of p = n.
The smallest eigenvalue of H is almost always lowest exactly at p = n.

This plate’s random init ends with a higher test error than gradient descent from zero at every p from 43 to 200.
At p = 41 and 42, where the null space has only one or two dimensions, it ends slightly lower.
Averaged over inits, it ends higher at every p above n.

The weight decay is tuned on the test error, which a real run cannot see.
Hastie et al. (2022) show that leave-one-out cross-validation reaches the same tuning in their setting.

In deep networks, optimally tuned weight decay can flatten the peak as well (Nakkiran et al. 2021).
The second descent also depends on what we count as a parameter.
Curth, Jeffares and van der Schaar (2023) studied linear regression, trees and boosting.
There the second descent appears where the count switches from one kind of added complexity to another.
Counted in effective parameters, those curves fold back into the classical U.

## References

- Belkin, M., Hsu, D., Ma, S. and Mandal, S. (2019). Reconciling modern machine-learning practice and the classical bias–variance trade-off. PNAS 116(32).
  Names double descent and shows it for random features and other models; the norm of the fit peaks at the interpolation threshold.
- Nakkiran, P., Kaplun, G., Bansal, Y., Yang, T., Barak, B. and Sutskever, I. (2020). Deep double descent: where bigger models and more data hurt. ICLR.
  Model-wise and epoch-wise double descent in CNNs, ResNets and transformers, strongest with label noise; more data can hurt.
- Hastie, T., Montanari, A., Rosset, S. and Tibshirani, R. J. (2022). Surprises in high-dimensional ridgeless least squares interpolation. Annals of Statistics 50(2).
  Exact risk of minimum-norm least squares as p and n grow together; tuned ridge dominates it, and cross-validation can tune it.
- Mei, S. and Montanari, A. (2022). The generalization error of random features regression: precise asymptotics and the double descent curve. Communications on Pure and Applied Mathematics 75(4).
  Exact double-descent curves for random features regression, with the lowest test error above the interpolation threshold.
- Advani, M. S., Saxe, A. M. and Sompolinsky, H. (2020). High-dimensional dynamics of generalization error in neural networks. Neural Networks 132.
  Overtraining is worst when the parameters match the examples; gradient descent leaves a frozen subspace, so small initial weights matter.
- Bartlett, P. L., Long, P. M., Lugosi, G. and Tsigler, A. (2020). Benign overfitting in linear regression. PNAS 117(48).
  When the minimum-norm interpolant of noisy labels is nearly optimal: many directions unimportant for prediction must absorb the noise.
- Nakkiran, P., Venkat, P., Kakade, S. and Ma, T. (2021). Optimal regularization can mitigate double descent. ICLR.
  Optimally tuned ℓ₂ regularization makes the test error monotone in model size for isotropic linear regression, and mitigates the peak in networks.
- Zhang, C., Bengio, S., Hardt, M., Recht, B. and Vinyals, O. (2017). Understanding deep learning requires rethinking generalization. ICLR.
  Gradient descent from zero on least squares stays in the span of the data and converges to the minimum-norm exact fit.
- d’Ascoli, S., Refinetti, M., Biroli, G. and Krzakala, F. (2020). Double trouble in double descent: bias and variance(s) in the lazy regime. ICML.
  The peak comes from the variance due to label noise and to initialization; ensembling over initializations suppresses both.
- Loog, M., Viering, T., Mey, A., Krijthe, J. H. and Tax, D. M. J. (2020). A brief prehistory of double descent. PNAS 117(20).
  The peak was observed for minimum-norm linear classifiers from 1989 onwards.
- Curth, A., Jeffares, A. and van der Schaar, M. (2023). A U-turn on double descent: rethinking parameter counting in statistical learning. NeurIPS.
  In classical methods the second descent marks a change in how parameters are added; in effective parameters the curves are U-shaped.

# About

I started this after taking the Theory of Deep Learning course at Cambridge, curious about the optimization results behind it.
I wanted a survey of them in one place that was pleasant to look at.
So each plate takes one result and builds a small surface where you can watch it happen.

Each surface is a seeded loss `L(θ₁, θ₂)` over two parameters, shaped to show one phenomenon from the optimization literature.
The atlas draws it as a raised-relief map, printed in the manner of a Swiss topographic sheet.
Height on the model is the loss, and the model can be turned, tilted and approached.
Cohorts of particles cross it, each moved by an optimizer, and leave ink.

Two parameters are not a neural network, and the last section below says what that costs.
They are enough, though, to show most of what people mean by the usual vocabulary of optimization.
In two dimensions, sharp and flat minima, saddles, ravines, the edge of stability, catapults, temperature, warmup and mode connectivity can each be pointed at.

## How it works

Every sheet is an analytic function of θ₁ and θ₂, built from a few kinds of terms.
On most sheets, the terms are these:

1. A bowl.
2. Anisotropic Gaussian wells and hills.
3. Plate-specific terms: a ravine, a mesa, a cliff, a river valley, or a funnel whose curvature grows downstream.
4. A faint ridged texture.

Other sheets are built differently.
The proving grounds use the textbook test functions, and the last chapters use games and softmax policies.
On <i>A sheet of your own</i>, you dig the sheet yourself.

Particles take real optimizer steps on the gradient of the sheet’s function, estimated by central differences.
Critical points, where the gradient vanishes, are found by Newton’s method.
Each one is classified by the signs of the Hessian’s eigenvalues there.
Every number printed on a plate is computed from the surface it is printed on.

The relief is shaded after Imhof, whose book is listed below.
The shading uses a key light from the north-west with softer fills, and a vertical light that darkens the steeper slopes.
Contrast grows with height, and a faint hypsometric tint colours the sheet by height.

Contours, the lines of equal loss, are drawn per pixel at a fixed interval.
Every fifth contour is bolder and numbered, with the figures set to read uphill, so their tops point up the slope.
The margin carries the neatline (the border round the map), a scale bar measured in learning rates rather than kilometres, and the key to the inks.

## Look for

Each plate card says what to try.
Use <kbd>↑</kbd> and <kbd>↓</kbd> or the contents list on the plate card to move through the atlas.
Drag to turn the model, right-drag to pan, and scroll to approach.

Come close and the particles become stick men.
A stick man is one particle, drawn as a figure standing at the current iterate <code>θ<sub>t</sub></code> of its optimizer.

Point at one to read its card: its number, optimizer, step and loss, and what it is doing.
Click it to walk with it.
Press <kbd>O</kbd> to watch a few stick men up close, each in its own small view, and <kbd>N</kbd> for dusk, when they light lanterns.

Each stick man carries something that stands for its optimizer:

1. The heavy ball rolls a ball ahead of it.
2. Adam carries a surveyor’s rod for rescaling each step.
3. Newton carries a lantern to see the curvature ahead.
4. SAM aims a spyglass at the point uphill where it checks for the worst loss nearby.
5. Sign descent marches behind a flag.

A stick man also reacts to the surface it is crossing:

1. At a saddle, where the gradient vanishes and the loss curves down in one direction, it scratches its head.
   When it finds the way down, it gets a “!”, and its card then says after how many steps.
2. On a plateau, where both the gradient and the curvature are near zero, it trudges.
   After long enough, it falls asleep on its feet and sleepwalks.
   It wakes with a stretch when the gradient comes back.
3. In a ravine, it bounces off the walls in a puff of dust when its step reverses.
4. When one step is long enough to clear a cliff, it is thrown through the air.
5. If a throw is a catapult, it cartwheels.
   A catapult is a throw by gradient descent or SGD whose loss spiked.
   The spike came because its step was too long for the curvature where it stood.
   With learning rate η and curvature λ, that means `ηλ > 2`.
   The throw lands it where the curvature is low enough to settle (`ηλ < 2`).
6. When it walks off the sheet, it waves.
7. When it diverges, each step is longer than the last until it is thrown off the sheet.
   It then bursts into ink and loses its hat.

The gait of a stick man shows the state of its optimizer.
The stride follows the step length, momentum makes it run and lean, and gradient noise makes it stagger.
Newton’s stick men hop, and sign descent’s march.

Overshooting shows in the gait too.
When its steps keep reversing, each overshooting the valley floor, a stick man throws its arms up.
A heavy ball carried past the bottom by its momentum skids up the far side, windmilling its arms.

Stick men that come to rest gather under a tent, with a head-count beside it.
How they settle in depends on the curvature there, measured against the step size.

The measure is `ηλ/2`, with λ the largest curvature.
This is λ as a fraction of 2/η, the curvature above which gradient descent can no longer settle.
So it reaches 1 at the edge of stability, and a camp’s pose shows how close its minimum is to that edge:

1. Above 0.3, in a sharp minimum, they stand hunched round the fire.
2. Below 0.03, in a flat basin, they lie back.
3. In between, they sit, toast something on a stick and write up the log.

Stick men in camp wave to a newcomer that uses their optimizer and raise their hats to one that does not.
At dusk, some lie back and point at the stars.

## What a map cannot show

Every plate has two parameters.
Real networks have millions or billions, and several of the best-established facts about their loss surfaces have no two-dimensional picture:

1. The Hessian of a trained network is mostly flat.
   Its eigenvalues form a large bulk near zero and a handful of large outliers, roughly one per class for a classifier.
2. The gradient lies mostly in the small subspace those outliers span.
   But that part of the gradient mainly drives oscillation, and the loss falls through the bulk directions (Song, Ahn and Yun 2025).
3. Many tasks can be solved by training only inside a random subspace of far lower dimension than the network.
4. With more parameters than data, the minima are not points but manifolds of high dimension.
   Intuitively, each training example fitted exactly is one equation, and more unknowns than equations leave a family of solutions.
   This makes the singular minima of <i>Singular minima and the learning coefficient</i> the rule rather than the exception.
5. Large language models appear to sit in basins that are broad along random perturbations of their weights.
   The same basins are sharp along worst-case directions, which adversarial fine-tuning follows.
   Inside these basins, benign fine-tuning forms smaller basins of its own.

Pictures of real networks are slices, and slices mislead in a particular way.
A random direction is nearly orthogonal to the few outlier eigenvectors.
So a random two-dimensional slice shows curvature near the average eigenvalue, `tr(H)/d`, with d the number of parameters.

That average dilutes the few large and the few negative eigenvalues among the many near zero.
The slice then looks flatter and more convex than the landscape is.
A saddle with a few directions of negative curvature looks like a bowl (Böttcher and Wheeler 2024).

Slices can also miss the topology of the full landscape.
At high loss, the critical points of a high-dimensional landscape are overwhelmingly saddles (Dauphin et al. 2014).
So the many local minima of the proving grounds are a low-dimensional picture.

Real gradient noise differs too.
It is anisotropic and concentrated in the sharp directions.
Most plates instead add the same noise in every direction (see <i>The shape of the noise</i>).
Each plate's <i>Limits</i> section says what its sheet simplifies and how the result changes at scale.

Some optimizers have no two-dimensional version either.
Shampoo and Muon treat each weight matrix as a matrix, preconditioning or orthogonalizing it as a whole.
Two parameters make only a 1×2 matrix, on which both reduce to simpler methods.

A 1×2 matrix has a single singular value, and orthogonalizing it only sets that value to one.
So, applied to a single vector, Muon’s orthogonalized update only divides the momentum by its length.
That is a step of normalized SGD with momentum.
Muon has since been used to train large language models (Liu et al. 2025).

Natural gradient descent and K-FAC measure steps in the Fisher information of a probabilistic model.
Most of these sheets are bare functions with no model behind them.
The exceptions are the softmax policies of <i>The pull of softmax</i> and <i>RL’s razor</i>, where natural policy gradient does run.

Sagun, L., Evci, U., Güney, V.
U., Dauphin, Y. and Bottou, L. (2018).
Empirical analysis of the Hessian of over-parametrized neural networks.
ICLR Workshop Track.
Ghorbani, B., Krishnan, S. and Xiao, Y. (2019).
An investigation into neural net optimization via Hessian eigenvalue density.
ICML.
Papyan, V. (2019).
Measurements of three-level hierarchical structure in the outliers in the spectrum of deepnet Hessians.
ICML.
Gur-Ari, G., Roberts, D.
A. and Dyer, E. (2018).
Gradient descent happens in a tiny subspace. arXiv:1812.04754.
Li, C., Farkhoor, H., Liu, R. and Yosinski, J. (2018).
Measuring the intrinsic dimension of objective landscapes.
ICLR.
Cooper, Y. (2018).
The loss landscape of overparameterized neural networks. arXiv:1804.10200.
Chen, H., Wei, Z., Huang, Y., Zhang, Y., Dong, Y. and Zhu, J. (2026).
Unveiling the basin-like loss landscape in large language models.
ICLR.
Song, M., Ahn, K. and Yun, C. (2025).
Does SGD really happen in tiny subspaces?
ICLR.
Böttcher, L. and Wheeler, G. (2024).
Visualizing high-dimensional loss landscapes with Hessian directions.
Journal of Statistical Mechanics: Theory and Experiment, 023401.
Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014).
Identifying and attacking the saddle point problem in high-dimensional non-convex optimization.
NeurIPS.
Chen, J. et al. (2026).
Landscaper: understanding loss landscapes through multi-dimensional topological analysis. arXiv:2602.07135.
Amari, S. (1998).
Natural gradient works efficiently in learning.
Neural Computation 10(2).
Martens, J. and Grosse, R. (2015).
Optimizing neural networks with Kronecker-factored approximate curvature.
ICML.
Gupta, V., Koren, T. and Singer, Y. (2018).
Shampoo: preconditioned stochastic tensor optimization.
ICML.
Jordan, K., Jin, Y., Boza, V., You, J., Cesista, F., Newhouse, L. and Bernstein, J. (2024).
Muon: an optimizer for hidden layers in neural networks.
Blog post.
Liu, J., Su, J., Yao, X., Jiang, Z., Lai, G. et al. (2025).
Muon is scalable for LLM training. arXiv:2502.16982.

## References

Each plate carries its own references.
General: Imhof, E. (1965).
<i>Kartographische Geländedarstellung</i>.
De Gruyter.
Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018).
Visualizing the loss landscape of neural nets.
NeurIPS.
Goodfellow, I., Bengio, Y. and Courville, A. (2016).
<i>Deep Learning</i>, chapter 8.
MIT Press.

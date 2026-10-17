# About

The atlas is built as a raised-relief map.
Each plate is a seeded surface `L(θ₁, θ₂)` shaped to show one phenomenon from the optimization literature, printed in the manner of a Swiss topographic sheet and modelled in relief so it can be turned, tilted and approached.
Cohorts of particles cross it, each moved by an optimizer, and leave ink.

Two parameters are not a neural network.
They are enough to show most of what people mean when they speak of sharp and flat minima, saddles, ravines, the edge of stability, catapults, temperature, warmup or mode connectivity, and they let every one of those words be pointed at.

## How it works

Every sheet is an analytic function: a bowl, anisotropic Gaussian wells and hills, and plate-specific terms (a ravine, a mesa, a cliff, a river valley, a funnel whose curvature grows downstream), with a faint ridged texture.
Particles take real optimizer steps on central-difference gradients of that function.
Critical points are found by Newton's method and classified by the Hessian, and every number printed on a plate is computed from the surface it is printed on.

The relief follows Imhof: a north-west key light with softer fills and a vertical light for slope, contrast that grows with height, a faint hypsometric tint.
Contours are drawn per pixel at a fixed interval; every fifth is bolder and numbered so that the figures read uphill.
The margin carries the neatline, a scale bar measured in learning rates, and the key to the inks.

## Look for

Use <kbd>↑</kbd> and <kbd>↓</kbd> or the contents list on the plate card to move through the atlas.
Drag to turn the model, right-drag to pan, scroll to approach.
Each plate card says what to try.

Come close and the particles become stick men (each is one particle, the current iterate <code>θ<sub>t</sub></code> of its optimizer, drawn as a figure).
Each carries its optimizer’s method: the heavy ball rolls a ball ahead of it, Adam a surveyor’s rod for rescaling each step, Newton a lantern to see the curvature ahead, SAM a spyglass, aimed at the point uphill where it checks for the worst loss nearby, sign descent a flag it marches behind.
A stick man scratches its head at a saddle, where the slope vanishes and one direction curves down, and gets a “!” when it finds the way down (its papers then say how many steps that took); trudges across a plateau, where nothing slopes or curves, and after long enough falls asleep on its feet and sleepwalks, waking with a stretch when the slope comes back; bounces off the walls of a ravine in a puff of dust when its step reverses; is thrown through the air when one step is long enough to clear a cliff, and cartwheels when the throw is a catapult: plain gradient descent whose loss spiked because its step was too long for the curvature where it stood (`ηλ > 2`), landing where the curvature is low enough to settle (`ηλ < 2`); waves when it walks off the sheet; and bursts into ink, losing its hat, when it diverges, each step longer than the last until it is thrown off the sheet.
Point at one to read its number, optimizer and loss, click it to walk with it, press <kbd>O</kbd> to watch a few stick men up close, each in its own small view, and press <kbd>N</kbd> for dusk, when the stick men light lanterns.

Their gait is their optimizer’s state: the stride follows the step length, momentum makes them run and lean, gradient noise makes them stagger, a step size past the edge of stability throws their arms up, Newton’s stick men hop and sign descent marches.
A heavy ball carried past the bottom by its momentum skids up the far side, windmilling its arms.
Those that come to rest gather under a tent, with a head-count beside it, and settle in by the curvature there measured against the step size, `ηλ/2` with λ the largest curvature, which reaches 1 at the edge of stability: above 0.3, in a sharp minimum, they stand hunched round the fire; below 0.03, in a flat basin, they lie back; in between they sit, toast something on a stick and write up the log.
They wave to a newcomer that uses their optimizer and raise their hats to one that does not, and at dusk some lie back and point at the stars.

## What a map cannot show

Every plate has two parameters.
Real loss surfaces have millions, and several of their best-established features have no two-dimensional picture.

The Hessian of a trained network is mostly empty: a large bulk of eigenvalues near zero and a handful of large outliers, roughly one per class.
Gradient descent moves mostly within the small subspace those outliers span, and many tasks can be solved inside a random subspace of far lower dimension than the network.
With more parameters than data the minima are not points but manifolds of high dimension, which makes the singular minima of plate 27 the rule rather than the exception.
Large language models appear to sit in broad basins, robust to random perturbations of their weights, inside which fine-tuning forms smaller basins of its own.
And the low-dimensional slices that maps like these are cut from can miss the topology of the full landscape.

Some optimizers have no two-dimensional version either.
Shampoo and Muon treat each weight matrix as a matrix, preconditioning or orthogonalizing it as a whole, and two parameters do not make a matrix: Muon's orthogonalized update, applied to a single vector, only divides the momentum by its length, a step of normalized gradient descent.
Natural gradient descent and K-FAC measure steps in the Fisher information of a probabilistic model, and these sheets are bare functions with no model behind them.

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

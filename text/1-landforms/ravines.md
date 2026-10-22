# Ravines

## Subtitle

Gradient descent, the heavy ball and Nesterov’s method descend one curved ravine, to ask how much momentum gains where the walls cap the step.

## Lead

A ravine is a narrow valley whose floor slopes gently between steep walls.
The loss there is [[ill-conditioned|cond]], with far higher curvature across the valley than along it.
The steep walls set [[λ<sub>max</sub>|sharpness]], the largest curvature.
Gradient descent is [[stable|stab]] only if `η < 2/λ_max`, so it moves slowly along the floor (LeCun et al. 1998).

The condition number κ is the ratio of the largest curvature to the smallest.
On a quadratic with tuned hyperparameters, momentum cuts the number of steps from order κ to order √κ (Polyak 1964; see <i>Momentum</i>).
This plate measures that gain on a curved ravine.

## In practice

In low-noise training, slow progress with a zigzag suggests ill-conditioning: the steepest direction caps the stable η.
Momentum or a [[preconditioner|precond]] can help, since both lengthen the step along the floor without lengthening it across.
Lowering η trades the zigzag for a crawl.

## Figure caption

Mean loss above the mouth of the ravine for the latest cohort, on a logarithmic scale.

## Try

1. Read the arrival readouts → the [[heavy ball|hb]] reaches the [[Mouth|@Mouth]] in about 65 steps, [[Nesterov|nag]] in about 75 and gradient descent in about 1,300.
2. Watch the floor → gradient descent stalls on a nearly flat stretch.
   Under a constant gradient the heavy ball’s step grows to `1/(1 − β)` = 10 gradient steps.
   Each step adds β times the last, so the sum 1 + β + β² + … approaches 1/(1 − β).
3. Watch the mouth → gradient descent and most Nesterov particles keep bouncing there.
   There ηλ exceeds the stability limits of both methods.
   So gradient descent’s zigzag grows until it reaches the gentler upper walls.
4. Lower η until ‘ηλ across’ reads 1.2 → all three come [[to rest|rest]] at the mouth, Nesterov in a small two-step cycle.
   At the mouth ηλ is about 1.8, above Nesterov’s limit of 1.36.
   Gradient descent and the heavy ball are stable up to ηλ = 2 and 2(1 + β), both above 1.8.

## Background

Near a minimum the loss is close to a quadratic with Hessian H.
Along an eigenvector with eigenvalue λ, gradient descent multiplies the error by `1 − ηλ` per step.
So it converges only if `η < 2/λ_max`.

When `1 < ηλ < 2`, the iterate overshoots the floor at every step and crosses the valley.
This is the zigzag.
The factor 1 − ηλ is negative, so the error changes sign at each step while it shrinks.

For the [[heavy ball|hb]], successive gradients along the floor point the same way and add up.
Across it, they alternate in sign and largely cancel.
So the heavy ball accumulates the steady component along the floor and cancels the zigzag.

Nesterov’s method (1983) evaluates the gradient after the momentum step.
On a quadratic it acts along each eigenvector like the heavy ball with momentum `β(1 − ηλ)` (Sutskever et al. 2013).
While ηλ &lt; 1, this effective momentum damps oscillation along steep directions.

Above 1 the factor turns negative, and a short calculation shows the method is stable only for `ηλ < 2(1 + β)/(1 + 2β)`.
That limit is about 1.36 at β = 0.9.
So Nesterov’s method trades a lower stability limit for this damping.

Sutskever et al. also showed that momentum with a good initialization trains deep and recurrent networks once thought to need second-order methods.
Goh (2017) gives an interactive account of these dynamics.

## Method

The ravine is a Gaussian trough about 0.055 wide, bent along a circular arc.
Its floor falls to a well at its lower end, the [[Mouth|@Mouth]].
On the default sheet the curvature across the floor rises along the arc, from about 120 near the head to 360 near the mouth.
At the mouth λ<sub>max</sub> is 388.

The plate sets η = 1.8/λ, where λ is the curvature across the floor at the middle of the arc.
That λ is printed on the floor mark, with the floor’s slope.
So gradient descent zigzags at the middle of the arc, where the readout ηλ is measured.

Noise is off.
Each [[cohort|cohort]] of 12 particles per optimizer starts on the wall near the head, and only the mouth counts as a rest point.
The readouts give the mean number of steps until a particle first comes within 0.05 of the mouth, over the latest 200 arrivals per optimizer.

## Limits

The curvature across this ravine varies threefold along it, so no single η gives the same ηλ everywhere.
The tuning behind the √κ result can then fit only one stretch of this ravine at a time.
In a network the steep directions also change during training (see <i>The edge of stability</i>).

In many networks the Hessian’s spectrum is a bulk near zero, some of it negative, plus a few large outliers (see <i>Survey of a loss surface</i>).
Papyan (2020) tied the outliers to the classes.
A ravine in such a network has a handful of steep walls and millions of nearly flat directions along its floor.
There κ says little, because it divides by the smallest curvature, which is near zero or negative.
What matters is how many steep directions there are and how far their curvatures spread.

Gradient noise changes the comparison too.
Zhang et al. (2019) found that below a [[critical batch size|cbs]], momentum and preconditioning gain little over plain SGD.
Their speedups appear only with large batches.

## References

- LeCun, Y., Bottou, L., Orr, G. B. and Müller, K.-R. (1998). Efficient BackProp. In Neural Networks: Tricks of the Trade, Springer.
  The largest stable learning rate is 2/λ<sub>max</sub>, and the condition number of the Hessian sets the speed of convergence.
- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5).
  Introduces the heavy ball; with tuned settings it needs order √κ steps on a quadratic.
- Nesterov, Y. (1983). A method for solving the convex programming problem with convergence rate O(1/k²). Soviet Mathematics Doklady 27.
  Introduces the accelerated gradient method.
- Sutskever, I., Martens, J., Dahl, G. and Hinton, G. (2013). On the importance of initialization and momentum in deep learning. ICML.
  Writes Nesterov’s method as momentum, shows it acts with momentum β(1 − ηλ) on a quadratic, and trains deep networks with it.
- Goh, G. (2017). Why momentum really works. Distill.
  An interactive analysis of momentum on quadratics.
- Ghorbani, B., Krishnan, S. and Xiao, Y. (2019). An investigation into neural net optimization via Hessian eigenvalue density. ICML.
  Tracks the full Hessian spectrum in training: large isolated eigenvalues appear quickly without batch normalization and the gradient concentrates in them.
- Zhang, G., Li, L., Nado, Z., Martens, J., Sachdeva, S., Dahl, G., Shallue, C. and Grosse, R. (2019). Which algorithmic choices matter at which batch sizes? Insights from a noisy quadratic model. NeurIPS.
  Momentum and preconditioning pay off only at large batch sizes, where they raise the critical batch size.
- Papyan, V. (2020). Traces of class/cross-class structure pervade deep learning spectra. JMLR 21(252).
  The Hessian’s outlier eigenvalues are organized by the classes, above a bulk near zero.

# Same loss, different minima

## Subtitle

Two minima with the same loss and Hessian, where two data sources agree at one and pull apart at the other, to ask what tells them apart.

## Lead

Pretraining mixes data from several sources and minimizes the sum of their losses.
A minimum of that sum need not be a minimum of each source.
At a common minimum, each source is also close to a minimum of its own.
At a compromise minimum, the sources pull in opposite directions, and only their sum is at rest.

Chen et al. (2026) proposed that the two kinds can share a pretraining loss and still differ downstream.
They reported that AdamW often ends where the sources’ own minima lie far apart.
Their optimizer, Nexus, rewards agreement between the sources’ gradients.
It reached nearly the same pretraining loss as AdamW and did better on downstream tasks.

If they are right, the pretraining loss alone cannot rank two models.
Here the total loss has one minimum of each kind, with the same loss and the same Hessian.
We can watch SGD settle at both, and a Nexus-style optimizer settle only at the common one.

## In practice

Two pretrained models with the same validation loss can still differ downstream, so compare them on downstream tasks as well.
To tell a common minimum from a compromise, look at each data source’s gradient separately.
At a compromise these gradients are large and opposed, although their sum is near zero.
Chen et al. measured the cosine similarity of gradients on different data alongside the distances between minima.

## Figure caption

Above: along θ₂ = 0, through both minima, the loss L, the loss the Nexus-style optimizer descends on average, and the downstream loss.
Below: how many particles of each optimizer came to rest at each minimum, and their mean downstream loss there.
The readouts give the common minimum first.

## Try

1. Watch the readouts → SGD’s particles come to rest about half at each minimum, and the Nexus-style ones all at the [[common minimum|@Common minimum]].
   The total loss is its own mirror image, and the [[cohorts|cohort]] are released in mirrored pairs.
   SGD follows only the total, so it has no reason to prefer either minimum.
2. Release a cohort at the [[compromise minimum|@Compromise minimum]] → SGD’s particles stay there, and the Nexus-style ones cross over to the common minimum.
   At the compromise the two sources’ gradients are large and opposed.
   The alignment term lifts it by 0.12 (the green curve), more than the [[barrier|barrier]] of 0.043 between the minima.
3. Set γ to 0 → the Nexus-style particles split about evenly too.
   With γ = 0 both inner steps are taken at the same point, so together they make one gradient step on L.
4. Set γ to 0.05 → about two in five Nexus-style particles stop at the compromise again.
   The lift is now 0.03, so the green curve still has a minimum there.
   Raise γ slowly and watch that minimum: it disappears near γ = 0.14.
5. Set σ to 0 → SGD still splits evenly, and every Nexus-style particle still ends at the common minimum.
   Here the alignment term alone makes the choice, so no noise is needed.

## Background

A pretraining corpus mixes sources such as web text, code and mathematics, each with a sampling weight.
The loss of this [[data mixture|datamix]] is the weighted sum of the sources’ losses.

Fort et al. (2019) noted that a small gradient step on one example changes the loss on another by `−ε g₁·g₂`, to first order.
So when two gradients point the same way, progress on one helps the other.
When their inner product is negative, the gradients [[conflict|conflict]]: a step that lowers one loss raises the other.
Yu et al. (2020) found that such conflicts hamper multi-task learning.
Their remedy projects each conflicting gradient onto the plane normal to the other.

Liu et al. (2023) showed that language models with the same pretraining loss can transfer differently.
Among such models, the flatter ones, by the trace of the Hessian, did better downstream.
They also proved that SGD’s minibatch noise favours flatter minima (see <i>Sharp and flat minima</i>).

Chen et al. proposed a second explanation, the [[closeness|closeness]] of the sources’ minima.
In their model, each task’s loss is quadratic near a minimum, and the tasks’ minimizers are scattered around a centre.
A downstream task drawn like the training tasks then has an expected loss above the training loss, in proportion to the variance of that scatter.
They also bounded the distance to the tasks’ minimizers by how dissimilar the tasks’ gradients are.

Nexus follows from that bound.
It takes K normalized SGD steps of size γ, each on a source drawn at random.
It then hands the displacement to an outer optimizer as a gradient, [[AdamW|adamw]] in most of their runs.
To second order, its expected update descends the summed loss minus a multiple of the cosine similarities between source gradients.
Nichol et al. (2018) made the same kind of expansion for Reptile, a meta-learning method with the same inner loop.

Chen et al. trained models from 130M to 3B parameters.
At 3B the pretraining loss differed from AdamW’s by 0.004, while the out-of-distribution loss fell by 0.012.
Accuracy on reasoning tasks such as GSM8k rose by up to 15.0 percentage points.

## Method

The total loss L is mirror-symmetric in θ₁: each point’s value is averaged with its mirror image’s.
Its two minima lie at θ₁ = ±0.75 on θ₂ = 0, with the barrier between them along the same line.
Near that line the sheet has no fine texture, so both minima have L = 0.030 and [[Hessian|hessian]] eigenvalues 0.61 and 8.20.

The two sources share the total’s shape and differ by a tilt across θ₂:
`L₁ = L/2 + p(θ₁)T(θ₂)` and `L₂ = L/2 − p(θ₁)T(θ₂)`, with `T(θ₂) = 0.4 tanh(θ₂/0.4)`.
Their sum is exactly L.
The tilt p is slight at the common minimum and rises steeply towards the compromise.
So near the compromise each source’s own minimum lies off θ₂ = 0, one on each side.

Each source’s own minima are found by Newton’s method, and the shaded regions are where its loss is within 0.006 of them.
At the common minimum each source sits next to its own minimum, while at the compromise each sits well above its own.
As in Chen et al.’s analysis, closeness costs intrinsic loss.
Each source’s own minimum near the common one is higher than its own minimum near the compromise.

The downstream loss follows their Theorem 2.1.
It is the expected loss of a third source, drawn like the two, with its own minimum as low as theirs.
Its tilt is zp, where z has mean 0 and variance 3: what two draws at ±1 predict for a third, about their mean.
To second order its expected loss is `L/2 + 2p²/λ`, where λ = 8.20 is the curvature across θ₂.
That is 0.017 at the common minimum and 0.317 at the compromise.

[[SGD|sgd]] runs with η = 0.008 and isotropic gradient noise σ = 0.3.
The Nexus-style optimizer is a simplification of the paper’s:

1. It draws an order for the two sources, a then b, and takes one inner step on the first: `θ′ = θ − γ∇Lₐ(θ)`.
2. It adds the second source’s gradient at θ′ to the first’s at θ, and takes an SGD step of η on the sum, with SGD’s noise.
3. That sum is the inner displacement divided by γ, so with γ = 0 the step is SGD’s.

The paper instead normalizes each inner step, draws K sources at random and uses AdamW outside.
To second order in γ, the plate’s expected step is the gradient of `L − (γ/2)∇L₁·∇L₂`: a dot product where the paper has a cosine similarity.
On θ₂ = 0, `∇L₁·∇L₂ = |∇L|²/4 − p²`, and ∇L vanishes at both minima.
So the term lifts the compromise relative to the common minimum by γ/2 times the difference in p² between them.
The green curve in the figure is this expected objective, shifted to meet L at the common minimum.

Cohorts of 14 particles per optimizer start on high ground, in mirrored pairs.
A particle comes [[to rest|rest]] as on other plates; a Nexus-style one also needs its expected step, averaged over both orders, below 0.02.
One that rests within 0.15 of a minimum counts for it.

## Limits

The sheet has two parameters and two sources, which differ only by a tilt.
The downstream loss is defined by Chen et al.’s model, so its lower value at the common minimum is built in.
The plate shows what follows from that model, not evidence for it.

On this sheet the alignment term removes the compromise as a resting point altogether.
In Chen et al.’s models, Nexus moved the sources’ minima moderately closer, without making them coincide.

The noise here is isotropic and the same at both minima.
In real training, minibatch noise grows with the disagreement between the sources’ gradients, which is largest at a compromise.
Liu et al. tie that noise to a preference for flatter minima, and here both minima are equally flat.

In a network, each source’s low-loss weights form a high-dimensional set rather than a point.
Chen et al. located each task’s minimizer by full-batch training on that task from the pretrained weights, then measured the distance.
The link between closeness and downstream performance rests so far on their quadratic model and experiments, so the plate’s status is open.

## References

- Chen, H., Zhang, H., Li, X., Dong, Y., Shen, K. and Zhu, J. (2026). Nexus: same pretraining loss, better downstream generalization via common minima. arXiv:2604.09258.
  Ties downstream loss at a fixed pretraining loss to the closeness of the sources’ minima, and proposes Nexus, which rewards gradient similarity between sources.
- Liu, H., Xie, S. M., Li, Z. and Ma, T. (2023). Same pre-training loss, better downstream: implicit bias matters for language models. ICML.
  Models with equal pretraining loss transfer differently; the flatter ones transfer better, and SGD’s noise favours them.
- Yu, T., Kumar, S., Gupta, A., Levine, S., Hausman, K. and Finn, C. (2020). Gradient surgery for multi-task learning. NeurIPS.
  Conflicting task gradients hamper multi-task optimization; projecting each onto the normal plane of the other removes the conflict.
- Fort, S., Nowak, P. K., Jastrzebski, S. and Narayanan, S. (2019). Stiffness: a new perspective on generalization in neural networks. arXiv:1901.09491.
  A gradient step on one example changes the loss on another by the inner product of their gradients, to first order.
- Nichol, A., Achiam, J. and Schulman, J. (2018). On first-order meta-learning algorithms. arXiv:1803.02999.
  The second-order expansion of an inner loop of SGD steps: its update increases the inner product between gradients of different minibatches.

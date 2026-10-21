# Twins and re-basin

## Subtitle

A network with one hidden unit and one symmetry, so we can see two minima that compute the same function.

## Lead

Swapping two hidden units of a layer, together with their incoming and outgoing weights, leaves the function unchanged.
So every solution has twins elsewhere in weight space with the same predictions.
Entezari et al. (2022) conjectured that once this [[permutation symmetry|permsym]] is accounted for, by reordering one network’s units to match the other’s, SGD solutions have no [[barrier|barrier]] on the straight segment between them.
Ainsworth et al. (2023) found near-zero barriers after matching units in wide networks, but not in narrow ones or on ImageNet.
Here a network with one unit has a single twin, its sign flip, so we can see the barrier and its removal exactly.

## In practice

Align the hidden units before averaging independently trained networks, because permutations explain much of the barrier.
Then check the barrier anyway: matching removed it for widened ResNets on CIFAR-10, but not at standard width or on ImageNet.
At standard width, rescaling the averaged network’s activations removes much of what remains (see At scale).

## Figure caption

Mean loss barrier over the latest 60 pairs of twins: on the straight segment between them, and between one twin and the flipped image of the other.
The difference is the part of the barrier the symmetry explains.

## Try

1. Watch ‘barrier between twins’ → it is the same for every pair, because the twins always sit at the two minima and the segment between them passes through the centre.
   Its midpoint is the [[saddle|saddle]], a network that outputs zero for every input.
2. Watch ‘after the flip’ → it reads 0.000: the flipped twin lies in the same basin as the other.
   The flip maps one minimum exactly onto the other, so the symmetry explains the whole barrier.
3. Lower the [[learning rate|lr]] η to 0.05 → particles creep along each valley floor, and about a tenth retire before coming [[to rest|rest]].
   The curvature along the floor is about 1/50 of the largest curvature, λ<sub>max</sub>.
   For small steps, progress along a direction scales with its curvature, so motion along the floor is slowest.

## Background

Hecht-Nielsen (1990) and Chen, Lu and Hecht-Nielsen (1993) showed that a layer of n tanh units has n!·2<sup>n</sup> weight settings that compute the same function.
These are the n! orderings of the units, times a sign flip of each unit’s incoming and outgoing weights.
The flip works because tanh is odd: tanh(−x) = −tanh(x).
So every minimum has that many copies, and two training runs can find the same function at different points.

Two independently trained networks usually have a large [[barrier|barrier]] on the straight segment between them.
Entezari et al. (2022) conjectured that most SGD solutions can be permuted so that the barrier vanishes.
They proved a version for wide one-hidden-layer networks at random initialization.
Their [[simulated-annealing|anneal]] search for permutations lowered the barrier for small MLPs but not for VGG or ResNet.
Ainsworth, Hayase and Srinivasa (2023) matched units by their activations, by their weights, or by learning the permutation with a straight-through estimator.
They reported the first zero-barrier connection between independently trained ResNets on CIFAR-10, for widened networks.
The barrier after matching fell as width grew and stayed large at standard width.
ResNet-50 on ImageNet kept a barrier, though matching cut it by about two-thirds.
Whether the conjecture holds for networks of ordinary width is unresolved.

## Method

The sheet is the training loss of the network `f(x) = a·tanh(wx)`: half the mean squared error on 16 points x evenly spaced in [−2, 2].
Its one hidden unit has incoming weight w and outgoing weight a.
The targets are `a₀ tanh(w₀x)`, w₀ ≈ 1.4 and a₀ ≈ 1.1, plus Gaussian noise of standard deviation 0.06; with the noise, the best fit is at w ≈ 1.50, a ≈ 1.08.
The axes are `w = 1.65θ₁` and `a = 1.85θ₂`.
The loss is rescaled like every sheet; no texture is added.
Because tanh is odd, the flip `(w, a) → (−w, −a)` leaves f unchanged; on the sheet it is a half-turn about the centre.
The sheet has two minima, the [[Solution|@Solution]] and [[Its twin|@Its twin]], and a [[saddle|saddle]] at the centre, where f is zero for every input.
Particles take true minibatch steps: the gradient on 4 of the 16 points, drawn with replacement, with η = 0.5.
So their noise comes from sampling the data.
The newest particle at rest with w &gt; 0 and the newest with w &lt; 0 form the pair, one in each basin.
The readouts give the barrier (largest loss on the segment minus the mean end loss) between them, and between the first and the flipped image of the second.

## Caveat

One unit has a single symmetry, so the right alignment is known in advance.
With n units per layer, re-basin methods must pick one of n! orderings per layer.
They find it with a linear assignment solver, in time polynomial in n, rather than by search.
The sign flip exists only for odd activations such as tanh.
ReLU units have a positive rescaling symmetry instead (see <i>Sharp and flat minima</i>).

## At scale

After matching, much of the barrier left at ordinary width has a second cause: the activations of the averaged network shrink in variance.
Jordan et al. (2023) rescaled them after averaging, which cut the barrier by 90% for ResNet-18 on CIFAR-10 and by 74% for ResNet-50 on ImageNet.
Verma and Elbayad (2024) carried matching over to transformers.
Attention layers also have a continuous symmetry: the query and key weights of a head can be rotated together, since attention sees them only through inner products (Zhang et al. 2025).
So in large networks each minimum has whole continuous families of copies, on top of the n!·2<sup>n</sup> discrete ones.

## References

- Hecht-Nielsen, R. (1990). On the algebraic structure of feedforward network weight spaces. In Eckmiller, R. (ed.), Advanced Neural Computers. Elsevier.
  The weight-space symmetries of feedforward networks: permutations of hidden units and sign flips.
- Chen, A. M., Lu, H. and Hecht-Nielsen, R. (1993). On the geometry of feedforward neural network error surfaces. Neural Computation 5(6).
  A tanh layer of n units has n!·2<sup>n</sup> equivalent weight settings.
- Entezari, R., Sedghi, H., Saukh, O. and Neyshabur, B. (2022). The role of permutation invariance in linear mode connectivity of neural networks. ICLR.
  Conjectures that SGD solutions are linearly connected once permutations are accounted for.
- Ainsworth, S. K., Hayase, J. and Srinivasa, S. (2023). Git Re-Basin: merging models modulo permutation symmetries. ICLR.
  Three matching algorithms; zero-barrier connections for wide ResNets on CIFAR-10, not for narrow networks or ImageNet.
- Jordan, K., Sedghi, H., Saukh, O., Entezari, R. and Neyshabur, B. (2023). REPAIR: REnormalizing permuted activations for interpolation repair. ICLR.
  The variance of activations collapses in averaged networks; rescaling them removes most of the barrier left after matching.
- Verma, N. and Elbayad, M. (2024). Merging text transformer models from different initializations. TMLR.
  Permutation matching for transformers lowers the barrier between independently trained masked language models.
- Zhang, B., Zheng, Z., Chen, Z. and Li, J. (2025). Beyond the permutation symmetry of transformers: the role of rotation for model fusion. ICML.
  Self-attention has a continuous rotation symmetry that generalizes permutations, and matching it improves model fusion.

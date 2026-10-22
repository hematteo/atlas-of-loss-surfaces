# Task arithmetic and merging

## Subtitle

Two cohorts fine-tune one pretrained model, one on each of two tasks, and their weight changes are added, to see when the sum does both tasks.

## Lead

Fine-tuning a pretrained model θ₀ on a task moves its weights to θ<sub>task</sub>.
The difference `τ = θ_task − θ₀` is that task’s [[task vector|taskvec]].

Ilharco et al. (2023) added task vectors from different tasks to the pretrained weights, `θ₀ + α(τ_A + τ_B)`.
The result often did nearly as well on each task as the separately fine-tuned models, with no further training.
This is [[task arithmetic|taskarith]], and with α = ½ it is the plain average of the two fine-tuned models.

So one model can be assembled from several fine-tuned ones without retraining on their data.
It does not always work: it depends on where fine-tuning starts and, as Zhang et al. (2026) found, on how noisy the optimizer is.
Here we add two task vectors on a map of both losses and see when their sum solves both tasks.

## In practice

Merge only models fine-tuned from the same pretrained checkpoint.
Choose α on held-out data, and check each task separately, not only their average.

Treat the fine-tuning learning rate and batch size as merging settings too.
Zhang et al. found that models trained with moderate gradient noise merged best.
In their fine-tuning experiment the best merged model came from a moderate learning rate, not the largest.

## Figure caption

Above: the mean of L<sub>A</sub> and L<sub>B</sub> after merging, against the gradient noise σ used for fine-tuning.
Each point averages 24 pairs of runs from the latest cohort’s starting point.
Solid: task arithmetic at the current α; dashed: the average; dotted: each fine-tuned model on its own task.
The dot is the latest cohort, and the vertical line marks the current σ.
Below: L<sub>A</sub> (red) and L<sub>B</sub> (blue) along `θ₀ + α(τ_A + τ_B)` for the latest cohort, averaged over its pairs.

## Try

1. Watch a cohort from the [[Pretrained model|@Pretrained model]] finish → task arithmetic keeps both losses near 0.02 to 0.03, against about 0.01 for each fine-tuned model alone.
   From θ₀, each task’s valley runs along the other task’s vector.
   So adding τ<sub>B</sub> moves the model fine-tuned on A along its own valley, where L<sub>A</sub> stays low.
2. Set σ to 0 → both cohorts stop in narrow pockets part-way down, at a loss of 0.11, and the merge’s losses are 0.13.
   Plain gradient descent cannot leave a local minimum, so both task vectors fall short of their valleys.
   Most of the merge’s loss is the fine-tuned models’ own: merging adds only 0.02.
3. Set σ to 2.5 → the fine-tuned models still reach their valleys, at about 0.02, but the merge’s losses rise to about 0.1.
   The noise moves each model along its own valley, which costs its own task nothing.
   That is the direction in which the other task’s loss is steep, so the merge pays for it.
   In the upper figure, task arithmetic does best near σ = 0.8, at about 0.02, and reaches about 0.13 at both σ = 0 and σ = 3.
4. Release from the [[Random init|@Random init]] → each fine-tuned model solves its own task, at about 0.02, yet the merge leaves L<sub>A</sub> at 0.28 and L<sub>B</sub> at 0.20.
   From there each task’s minimum is a round basin, steep in every direction, so the other task’s vector carries the model out of it.
   The two vectors are as close to orthogonal as from θ₀, with cos(τ<sub>A</sub>, τ<sub>B</sub>) about 0.05, so orthogonality alone does not make them add.
   No α up to 1.5 brings L<sub>A</sub> below 0.25, and at α = 1 the upper curve stays above 0.2 at every σ.
5. Set α to ½ → the merge becomes the plain average, and both losses sit at about 0.12.
   Halving both task vectors leaves each model only half-way to its valley, so both curves in the lower panel are lowest near α = 1 instead.
   Then set α to 1.5 → the upper curve now starts at 0.07 at σ = 0 and rises from there.
   A longer step makes up for task vectors cut short by the pockets, and overshoots the others.

## Background

Ilharco et al. built task vectors for CLIP image models on eight classification tasks.
Adding two of them kept 98.9% of the fine-tuned models’ accuracy on average, normalized task by task.
Adding all eight kept 91.2%.
They chose α on held-out validation data, and noted that task vectors from different tasks were close to orthogonal.

Ortiz-Jimenez, Favero and Frossard (2023) named the property that task arithmetic needs: [[weight disentanglement|disent]].
Each task vector should change the model’s outputs only on its own task’s inputs.
Task addition failed for randomly initialized vision transformers, so they concluded that this property is acquired in pretraining.

They also fine-tuned the model’s linearization around θ₀, its tangent space, instead of the model itself.
That raised the accuracy of task addition by up to 5.8 points.
Yet CLIP models do not fine-tune in this linear regime, so the [[kernel regime|lazy]] alone does not explain task arithmetic.

The plain average works when both models lie in one basin, as in <i>Weight averaging</i>.
Fine-tunes of one pretrained model often do (Wortsman et al. 2022).
Runs from one random initialization with different minibatch orders are often separated by a [[barrier|barrier]], unless they share the first part of training (Frankle et al. 2020).
Curved low-loss paths between minima are the subject of <i>Mode connectivity</i>.

In a network, task vectors also interfere coordinate by coordinate.
Yadav et al. (2023) traced the loss from merging to small, redundant changes and to parameters whose sign differs between vectors.
Their TIES-merging trims the small changes, elects one sign per parameter and merges only the values that agree with it.

Zhang et al. (2026) asked how the optimizer shapes merging.
They gathered learning rate, batch size, momentum, weight decay and data augmentation into one [[effective noise scale|noisescale]], roughly `η/(B(1 − μ))`.
In networks with normalization layers, they argue, weight decay acts through the [[effective learning rate|efflr]].

In their main experiment, two runs branch from a shared checkpoint, train on, and are averaged.
For ResNet-18 on CIFAR-100, the gain from merging over a single run rose with the noise scale to a best value, then fell.
DenseNet-121 on Tiny ImageNet showed the same shape.
Merging fine-tuned CLIP models by task arithmetic and TIES-merging, they also found a best learning rate below the largest stable one.

## Method

The sheet is the sum of two task losses on the same two parameters, `L_A + L_B`, plus 0.03.
Each task loss has four parts:

1. A shared term, nearly zero inside the [[Shared Basin|@Shared Basin]], a disc of radius 0.8, and growing as `0.35(r − 0.8)²` outside it, with r the distance from its centre.
   It stands for what pretraining supplied to both tasks.
2. A straight valley, `0.08 log(1 + (d/0.12)²)`, with d the distance from the task’s line.
   The two lines cross at right angles at [[Both tasks|@Both tasks]], where both losses are 0.
3. A narrow pocket of depth 0.026 and width 0.025, 40% of the way from θ₀ to the valley.
4. A Gaussian basin of width 0.13 near the random initialization, with its centre at a loss of 0.02.

The [[Pretrained model|@Pretrained model]] θ₀ lies 0.42 from each valley, where L<sub>A</sub> = L<sub>B</sub> = 0.21.
The hatching marks where each loss is below 0.05: red for A, blue for B.

Each cohort has eight particles per task, five on a phone, all starting at θ₀.
They run SGD on their own task for 300 steps, `θ ← θ − η(∇L + σξ)`, with ξ standard Gaussian.
The learning rate η starts at 0.01 and decays to 0 on a cosine.
A minibatch of B examples has gradient-noise variance proportional to 1/B, so σ² stands for 1/B, and ησ² for the noise scale.

Merges pair the k-th particle on A with the k-th on B, and the readouts average over the pairs.
The upper figure repeats the fine-tuning for 24 pairs at each of 16 values of σ, from 0 to 3.
Each pair reuses its noise draws at every σ, which keeps the curves smooth.
A click on the map sets θ₀ there and releases a new cohort.

## Limits

The sheet has two parameters, so each task’s flat direction is the other task’s steep one.
Wandering along a valley therefore always costs the other task here.
In a network most directions are flat for both tasks, so most of that wandering costs neither.
The noise is also isotropic here, while SGD’s noise concentrates in directions of high curvature (see <i>The shape of the noise</i>).

The pockets were placed by hand, to give gradient descent somewhere to stop.
At low noise the merge does badly mainly because the fine-tuned models do.
So the plate reproduces the shape of Zhang et al.’s curve, not its cause.

That cause is not settled, and Zhang et al. give no theory for it.
Their evidence on flatness points both ways.
For fine-tuned pretrained models, larger learning rates gave flatter landscapes; for networks trained from scratch on CIFAR, they gave sharper minima.
They also link the gain to the two branches learning less similar features, which two parameters cannot show.

Their fine-tuning results also differ from the plate at high noise.
When they fine-tuned CLIP on satellite images, the gain from merging grew almost linearly with the learning rate (r = 0.981).
The best merged model still came from a moderate rate, because the largest gave the worst single model.
On the plate, by contrast, high noise harms the merge more than the fine-tuned models.

Weight decay changes nothing here, since the sheet has no scale invariance (see <i>Weight decay and scale invariance</i>).
TIES-merging needs many coordinates to vote on signs, so it has no counterpart in two dimensions.
Networks trained separately from random initializations usually merge badly until their hidden units are matched (see <i>Twins and re-basin</i>).
Zhang et al. found that higher noise made that matching easier.

## References

- Frankle, J., Dziugaite, G. K., Roy, D. M. and Carbin, M. (2020). Linear mode connectivity and the lottery ticket hypothesis. ICML.
  Runs from one initialization with different minibatch orders are often separated by a loss barrier.
- Wortsman, M., Ilharco, G., Gadre, S. Y., Roelofs, R., Gontijo-Lopes, R., Morcos, A. S., Namkoong, H., Farhadi, A., Carmon, Y., Kornblith, S. and Schmidt, L. (2022). Model soups: averaging weights of multiple fine-tuned models improves accuracy without increasing inference time. ICML.
  Averaging the weights of fine-tunes of one pretrained model works because they share a basin.
- Ilharco, G., Ribeiro, M. T., Wortsman, M., Gururangan, S., Schmidt, L., Hajishirzi, H. and Farhadi, A. (2023). Editing models with task arithmetic. ICLR.
  Task vectors; adding them builds multi-task models, negating one forgets a task; vectors of different tasks are nearly orthogonal.
- Ortiz-Jimenez, G., Favero, A. and Frossard, P. (2023). Task arithmetic in the tangent space: improved editing of pre-trained models. NeurIPS.
  Weight disentanglement explains task arithmetic and is acquired in pretraining; fine-tuning in the tangent space strengthens it.
- Yadav, P., Tam, D., Choshen, L., Raffel, C. and Bansal, M. (2023). TIES-Merging: resolving interference when merging models. NeurIPS.
  Interference from redundant changes and sign conflicts; trim, elect a sign, then merge only agreeing values.
- Zhang, C., Theus, A., Teney, D., Orvieto, A., Pang, J. and Mauw, S. (2026). How does the optimizer implicitly bias the model merging loss landscape? ICLR.
  One effective noise scale gathers the optimizer’s settings; merging works best at an intermediate value of it.

# LoRA’s saddle

## Subtitle

A rank-one LoRA adapter’s loss over its two factors, with LoRA, LoRA+ and LoRA from the other zero start, to compare their paths, ends and stable steps.

## Lead

[[LoRA|lora]] fine-tunes a pretrained weight matrix W₀ by adding a low-rank product BA and training only the factors A and B (Hu et al. 2022).
The loss depends on the two factors only through that product.
So every pair with the right product fits equally well, and these pairs form a curved [[valley of solutions|@Valley of solutions, zb = δ]].

Fine-tuning should start from the pretrained model, with BA = 0.
Setting both factors to zero would do that, but the origin is a [[saddle point|saddle]] where the gradient vanishes.
So the standard recipe sets B = 0 and draws A at random, which zeroes the product but not the gradient.

Which factor starts at zero, and the learning rate each factor gets, then decide which solution a run reaches.
In wide layers they also decide which learning rates are stable and which factor does the learning (Hayou, Ghosh and Yu 2024a, 2024b).
This plate shows these effects for LoRA, for [[LoRA+|loraplus]] and for LoRA started from A = 0.

## In practice

Keep the standard start, B = 0 with A random, which is also the default in the PEFT library.
Hayou, Ghosh and Yu (2024b) found that it trains better on average than the reverse start, and their analysis suggests why: it tolerates larger learning rates.
If B gets a larger learning rate than A, as in LoRA+, tune A’s rate again, since the ratio lowers the largest stable one.
In their RoBERTa runs the best ratio was about 2⁴ from A = 0 and 2² to 2³ from B = 0 (Hayou, Ghosh and Yu 2024a).

## Figure caption

Above: the loss of the latest cohort against steps, on a log scale, with a dashed line where zb comes within 1% of the target δ.
Below: steps to reach that line from the designed starts, against the learning rate η, from separate noise-free runs.
Each curve ends with a cross at the largest η before a run leaves the map or never settles, and the dotted line marks the current η.

## Try

1. Watch the first cohort → the red LoRA and blue LoRA+ particles first climb straight off the z axis, and only then bend.
   On that axis b = 0, and the gradient for A is proportional to b, so the first steps change only B.
   The orange particles start from A = 0, where the roles swap: they first move straight along z.
2. Wait for the readouts to settle → LoRA ends at about z/b = 4.5 and LoRA+ at 1.6.
   The A = 0 start ends near 1, with b still about 0.50.
   Each particle has followed its dashed line, on which [[gradient flow|gflow]] conserves `‖a‖² − b²/λ` (λ = 1 without LoRA+; see <i>Implicit gradient regularization</i>).
   So where a run starts decides where it ends.
   From A = 0, B hardly changes, because a step on z carries a factor n that the step on b lacks.
3. Set n and λ to 1 and η to 0.05 → LoRA ends near (0.64, 0.39), and the A = 0 start near its mirror image, (0.40, 0.63).
   LoRA+ now runs with LoRA.
   On a single weight the two factors are interchangeable, so every difference between A and B on this plate comes from the width.
4. Lower σ to 0.0005 → all three wait near the [[saddle|@Saddle]] before they leave, and then end at z/b = 4.0 and 1.0.
   Each tenfold drop in σ adds about 290 steps for LoRA and 72 for LoRA+.
   Near the saddle each step stretches the offset by `1 + ηδ√(nλ)`, so the first readout predicts 289 and 73 (see <i>Saddle points</i>).
   From the saddle the conserved quantity is zero, so ‖a‖ = |b|/√λ, and z = √n‖a‖ gives z/b = √(n/λ).
5. Raise η to 0.3 → LoRA+ never settles but keeps jumping across zb = δ.
   LoRA comes within 1% in 11 steps and the A = 0 start in 3 to 5.
   At a solution, a step is stable only while `η_A·nb² + η_B·z² < 2`, and λ multiplies the second term.
   So the ratio trades stability for speed: at η = 0.008, LoRA+ took about 80 steps to LoRA’s 450.
   But LoRA+ fails above η ≈ 0.23, and LoRA only above 0.97.
   Tuned to its own best η, each optimizer comes within 1% in under 10 steps, at the lowest point of its curve below.
6. Set n to 64 → the largest stable η falls from 0.97 to 0.47 for LoRA, and from 0.73 to 0.15 for the A = 0 start.
   From B = 0 the run ends with ‖a‖ ≈ |b|, where the curvature is about 2δ√n, so the limit falls only as 1/√n.
   From A = 0, b stays near σ, so `ηnσ²` must stay below about 2 and the limit falls about as 1/n (Hayou, Ghosh and Yu 2024b).

## Background

Hu et al. (2022) froze the pretrained weights and trained, beside each chosen matrix W₀, a product BA whose rank r is far below W₀’s dimensions.
They drew A’s entries from a Gaussian and set B to zero, so that BA = 0 at the start.
They also scaled BA by a constant α/r, which this plate leaves out.

For a product of two factors, gradient flow conserves `‖A‖² − ‖B‖²`, the difference of their squared norms (Du, Hu and Lee 2018).
In the rank-one case that is `‖a‖² − b²`, the quantity that <i>Implicit gradient regularization</i> follows for a model of the same shape.
If B’s learning rate is λ times A’s, the conserved quantity becomes `‖a‖² − b²/λ`.
So the start alone fixes which solution gradient flow reaches.

Hayou, Ghosh and Yu (2024a) analysed this rank-one model as the width n grows.
With one learning rate, they showed that A and B cannot both change the output at order one in every step.
Learning rates `η_A = Θ(1/n)` and `η_B = Θ(1)` achieve it, so the ratio between them should grow with width.
They call LoRA with a fixed ratio λ = η<sub>B</sub>/η<sub>A</sub> LoRA+.

Hayou, Ghosh and Yu (2024b) then compared the two zero starts under one learning rate, for updates normalized as in Adam.
The largest stable learning rate scales as n<sup>−1/2</sup> from B = 0, and as n<sup>−1</sup> from A = 0.
At the larger rate the features Ax grow with width while the output BAx stays bounded, which they call internal instability.
From A = 0, B barely moves in wide layers, so only A learns.

This sheet, with plain gradient descent, shows both effects.
From B = 0 under one learning rate, the feature z grows from σ to about (nδ²)<sup>1/4</sup>: 1.07 at n = 16 and 1.46 at n = 64.
From A = 0 at σ = 0.5, b still reads 0.50 at the end, its starting scale.

## Method

The model is the one Hayou, Ghosh and Yu analysed: one output, `f(x) = (W₀ + baᵀ)x`, with a ∈ Rⁿ and b ∈ R.
It is fitted to one input x, with `‖x‖² = n`, and the adapter must raise that input’s output by δ = 0.25.
Only a’s component along x affects the output, and the gradient never changes the rest, so the loss is exactly two-dimensional.

The map is drawn in LoRA’s features: θ₁ = z = aᵀx, what A computes from the input, and θ₂ = b.
The loss is `L = ½(zb − δ)²`, so the [[valley|@Valley of solutions, zb = δ]] is the hyperbola zb = δ and the [[saddle|@Saddle]] is the origin.
The relief shows `0.27 ln(1 + L/0.002)`, which keeps both the solutions and the saddle visible, and hovering reads that height.

With r = zb − δ, a gradient step on a changes z by `−η_A·nbr`, and a step on b changes b by `−η_B·zr`.
The factor n is ‖x‖²: A’s gradient is `b·r·x`, and moving a by that much changes z = aᵀx by `b·r·‖x‖²`.
LoRA uses η<sub>A</sub> = η<sub>B</sub> = η, LoRA+ uses η<sub>B</sub> = λη, and the third optimizer is LoRA started from A = 0.

Each cohort releases six particles per optimizer, four on a phone, with the random factor at ±σe<sup>0.05ξ</sup> and ξ standard normal.
LoRA and LoRA+ start on the z axis, and the A = 0 start on the b axis.
A particle retires once zb is within 0.02% of δ, or when it leaves the map.
The first readout is the prediction `ln 10 / ln(1 + ηδ√(nλ))` of Try 4.
The others give the median step at which zb came within 1% of δ, and the mean |z| and |b|.

A click releases LoRA and LoRA+ from the clicked point instead.

The dashed lines follow the conserved quantity from each start to the solutions, zb = δ.
The lower panel and the readout ‘stable to η’ come from noise-free runs from exactly σ, at 49 values of η from 0.002 to 2.
A run fails if it leaves the map, or if it is still jumping across zb = δ after 5000 steps.

## Limits

The sheet has one output, one data point and rank one, and fits a single target.
So each optimizer, tuned to its own best η, reaches a solution within a few steps, and the plate cannot show what LoRA+ gains in practice.
Hayou, Ghosh and Yu (2024a) report 1% to 2% better accuracy and up to about twice the speed, with many layers, many data and AdamW.
They also found that the best ratio depends on the model and the task.

Near a stability limit, gradient descent can also land on a flatter solution than its dashed line predicts, a [[catapult|catapult]] (see <i>Stability and catapults</i>).
That is why the measured limits from A = 0 lie above the estimate `2/(nσ²)`.
At n = 16 and η = 0.5, for instance, the A = 0 start ends near z/b = 1.9 rather than 1.

Instead of a fixed ratio, Zhang and Pilanci (2024) scale each factor’s gradient by the inverse of the other factor’s r × r Gram matrix.
That is `(BᵀB)⁻¹` for A’s gradient and `(AAᵀ)⁻¹` for B’s, and in their experiments it made training less sensitive to the learning rate.

How training reaches a solution is not the only limit on what LoRA learns.
Biderman et al. (2024) found that LoRA learns less than full fine-tuning and forgets less.
The weight changes of full fine-tuning had 10 to 100 times the rank of typical LoRA adapters.

## References

- Hu, E. J., Shen, Y., Wallis, P., Allen-Zhu, Z., Li, Y., Wang, S., Wang, L. and Chen, W. (2022). LoRA: low-rank adaptation of large language models. ICLR.
  Introduces LoRA, with A drawn from a Gaussian and B = 0, so that the adapter starts at zero.
- Du, S. S., Hu, W. and Lee, J. D. (2018). Algorithmic regularization in learning deep homogeneous models: layers are automatically balanced. NeurIPS.
  Gradient flow conserves the differences between the squared norms of consecutive layers.
- Hayou, S., Ghosh, N. and Yu, B. (2024a). LoRA+: efficient low rank adaptation of large models. ICML.
  The rank-one model of this plate; with one learning rate wide LoRA learns inefficiently, and η<sub>B</sub>/η<sub>A</sub> should grow with width.
- Hayou, S., Ghosh, N. and Yu, B. (2024b). The impact of initialization on LoRA finetuning dynamics. NeurIPS.
  From B = 0 the largest stable learning rate scales as n<sup>−1/2</sup>, from A = 0 as n<sup>−1</sup>; B = 0 trains better on average.
- Zhang, F. and Pilanci, M. (2024). Riemannian preconditioned LoRA for fine-tuning foundation models. ICML.
  Preconditions each factor’s gradient with an r × r matrix built from the other factor.
- Biderman, D., Portes, J., Gonzalez Ortiz, J. J., Paul, M., Greengard, P., Jennings, C., King, D., Havens, S., Chiley, V., Frankle, J., Blakeney, C. and Cunningham, J. P. (2024). LoRA learns less and forgets less. TMLR.
  Against full fine-tuning, LoRA learns less of the target domain and forgets less; full fine-tuning’s weight changes have far higher rank.

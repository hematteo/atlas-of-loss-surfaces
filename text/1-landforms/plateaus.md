# Plateaus

## Subtitle

A flat, tilted terrace on which SGD, RMSprop and Adam are timed, to ask whose steps keep their size when the gradient nearly vanishes.

## Lead

A [[plateau|plateau]] is a region of parameter space where the loss is nearly flat.
There the gradient is small, so steps are small and the loss stalls, sometimes for most of a run.

Plateaus arise where hidden units are interchangeable (Saad and Solla 1995; Fukumizu and Amari 2000).
In deep linear networks they also arise from small initialization (Saxe et al. 2014).
Both are exact results in simple models.

SGD’s step scales with the gradient, but the steps of RMSprop and Adam do not.
On this sheet we can time how long each takes to leave a plateau.

## In practice

A long flat stretch in the loss curve need not mean failure.
Small or nearly symmetric initializations cause plateaus that end abruptly, so such a run may be worth waiting for.
Adam’s step does not shrink with the gradient, but this helps only while the gradient’s sign stays steady.

## Figure caption

Steps each particle took to leave the plateau, on a logarithmic axis, where equal gaps mean equal ratios of time.
Ticks are single particles; bars are the means of the latest 300 exits.

## Try

1. Read the figure after a few cohorts → [[SGD|sgd]] takes about 4,300 steps to leave the [[plateau|@Plateau of Vanishing Gradients]], [[RMSprop|rmsprop]] and [[Adam|adam]] about 160.
   SGD moves only `η‖∇L‖` = 1.4 × 10⁻⁴ per step.
   RMSprop and Adam divide the gradient by its own running size.
   So while the gradient is steady, their steps stay near η whatever its size.
2. Raise the noise σ to 0.5 → SGD’s mean barely moves, to about 4,100, and Adam’s grows to about 2,000.
   Once the noise exceeds the gradient, Adam divides by the noise rather than the gradient.
   For SGD the noise averages to zero, so its drift is unchanged.
3. Raise σ to 1.5 → SGD leaves first, after about 1,500 steps.
   Its random walk now swamps the drift, and most of its particles leave over the near, uphill edge.
   They start only about 0.09 from that edge, so this fast exit does not reduce the loss.

## Background

Hidden units with identical incoming weights compute the same function and receive the same gradient, so training cannot separate them.
Units that are only nearly identical receive nearly identical gradients, so they separate slowly.

Saad and Solla derived exact equations for online learning in soft committee machines, a kind of two-layer network.
They found a long symmetric phase, in which the hidden units are unspecialized and the error stays nearly constant.
The units specialize only after it.

Fukumizu and Amari compared networks with H − 1 and H hidden units.
They proved that each critical point of the smaller network gives lines of critical points in the larger one.
These can be saddles or local minima and cause plateaus.

Small initialization works differently.
In Saxe et al.’s deep linear networks, each layer’s gradient is scaled by the weights of the other layers.
So when all of them are small, learning starts slowly.
They also found that with random orthogonal initialization the learning time can be independent of depth.

A related effect is [[vanishing gradients|vanish]]: the gradient shrinks as it is propagated back through many layers or time steps (Hochreiter 1991; Bengio, Simard and Frasconi 1994).

RMSprop (Tieleman and Hinton 2012) and Adam (Kingma and Ba 2015) divide each coordinate by a running root mean square of its gradient.

## Method

The plateau is a terrace cut into a tilted bowl, with an edge warped by smooth noise.
Inside it the loss is replaced by a plane, so the Hessian is zero and the gradient is the same everywhere.
That gradient is given in the readout, 0.035 on the default sheet.

Every 405 steps a [[cohort|cohort]] of 14 particles per optimizer is released about 0.09 inside the uphill edge and 0.63 from the downhill rim.
A particle that starts on the plateau is timed until it leaves, over any edge.
The readouts give the same means as the figure’s bars.

The noise is `g̃ = ∇L + σξ`.
RMSprop uses β = 0.99 (Tieleman and Hinton suggested 0.9, without the correction).
Adam uses β₁ = 0.9 and β₂ = 0.999.
Both correct their averages for starting at zero and use ε = 10⁻⁸.

## Limits

This plateau is a tilted plane, so it reproduces only the simplest case: a steady small gradient, with no curvature to help or hinder.
Plateaus caused by symmetry instead surround saddles or lines of critical points.
There the gradient also vanishes along the way out.
The time to leave then depends on how far the symmetry is broken, as on <i>Saddle points</i>.
Small initializations in deeper models give a sequence of plateaus, one at each saddle the run passes (see <i>Saddle to saddle</i>).

In d dimensions a random initialization is nearly orthogonal to what must be learned.
Its overlap with the target is of order `1/√d`, so in high dimensions training generally starts on a plateau.
Ben Arous, Gheissari and Jagannath (2021) showed that in simple high-dimensional models, online SGD spends almost all of its samples in this initial search.
The search grows longer as d grows.

In language models gradient descent also makes slow progress on the loss of rare tokens, which Adam avoids (see <i>Adam, sign descent and the axes</i>).

## References

- Saad, D. and Solla, S. A. (1995). On-line learning in soft committee machines. Physical Review E 52(4), 4225–4243.
  Exact dynamics of a two-layer network: a long symmetric phase in which hidden units are unspecialized.
- Fukumizu, K. and Amari, S. (2000). Local minima and plateaus in hierarchical structures of multilayer perceptrons. Neural Networks 13(3).
  Critical points of a smaller network become lines of saddles or local minima in a larger one.
- Saxe, A. M., McClelland, J. L. and Ganguli, S. (2014). Exact solutions to the nonlinear dynamics of learning in deep linear neural networks. ICLR.
  From small initialization, plateaus and sudden transitions, one per singular mode.
- Hochreiter, S. (1991). Untersuchungen zu dynamischen neuronalen Netzen. Diploma thesis, Technische Universität München.
  First analysis of vanishing and exploding error signals in recurrent networks.
- Bengio, Y., Simard, P. and Frasconi, P. (1994). Learning long-term dependencies with gradient descent is difficult. IEEE Transactions on Neural Networks 5(2).
  Gradients for long-term dependencies vanish exponentially in robust recurrent dynamics.
- Tieleman, T. and Hinton, G. (2012). Lecture 6.5, RMSprop. COURSERA: Neural Networks for Machine Learning.
  Introduces RMSprop.
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR.
  Introduces Adam; its step is invariant to rescaling the gradient.
- Ben Arous, G., Gheissari, R. and Jagannath, A. (2021). Online stochastic gradient descent on non-convex losses from high-dimensional inference. Journal of Machine Learning Research 22.
  From a random start in high dimensions, almost all samples go to an initial search phase before the loss falls quickly.

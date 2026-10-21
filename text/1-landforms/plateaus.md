# Plateaus

## Subtitle

A flat, tilted terrace on which SGD, RMSprop and Adam are timed, to ask whose steps keep their size when the slope nearly vanishes.

## Lead

On a [[plateau|plateau]], a stretch of nearly level ground, the gradient is small, so steps are small and the loss stalls, sometimes for most of a run.
Plateaus arise where hidden units are interchangeable (Saad and Solla 1995; Fukumizu and Amari 2000) and, in deep linear networks, from small initialization (Saxe et al. 2014).
Both are exact results in simple models.
On this sheet we can time SGD, whose step scales with the gradient, against RMSprop and Adam, whose steps do not.

## In practice

A long flat stretch in the loss curve need not mean failure.
Small or nearly symmetric initializations cause plateaus that end abruptly, so a run that starts this way may be worth waiting for.
Adam’s step does not shrink with the gradient, which helps only while the gradient’s sign stays steady.

## Figure caption

Steps each particle took to leave the plateau, on a logarithmic axis, where equal gaps mean equal ratios of time.
Ticks are single particles; bars are the means of the latest 300 exits.

## Try

1. Read the figure after a few cohorts → [[SGD|sgd]] takes about 4,300 steps to leave the [[plateau|@Plateau of Vanishing Gradients]], [[RMSprop|rmsprop]] and [[Adam|adam]] about 160.
   SGD moves only `η‖∇L‖` = 1.4 × 10⁻⁴ per step.
   RMSprop and Adam divide the gradient by its own running size, so on a steady slope their steps stay near η whatever the slope.
2. Raise the noise σ to 0.5 → SGD’s mean barely moves (about 4,100) and Adam’s grows to about 2,000: once the noise exceeds the slope, Adam divides by the noise, not the slope.
   The noise averages to zero, so SGD’s drift is unchanged.
3. Raise σ to 1.5 → SGD leaves first, after about 1,500 steps: its random walk now swamps the drift, and most of its particles leave over the near, uphill edge.
   They start only about 0.09 from that edge, so this fast exit is not progress downhill.

## Background

Two mechanisms produce plateaus in networks.
The first is symmetry.
Hidden units with identical incoming weights compute the same function and receive the same gradient, so training cannot separate them.
Units that are only nearly identical receive nearly identical gradients, so they separate slowly.
Saad and Solla (1995) derived exact equations for online learning in soft committee machines, a kind of two-layer network.
They found a long symmetric phase, in which the hidden units are unspecialized and the error stays nearly constant, before the units specialize.
Fukumizu and Amari (2000) proved that each critical point of a network with H − 1 hidden units gives lines of critical points in the network with H units.
These can be saddles or local minima and cause plateaus.

The second is small initialization.
Saxe, McClelland and Ganguli (2014) solved the dynamics of deep linear networks.
From small random weights, learning shows long plateaus followed by rapid transitions, one for each singular mode of the input–output map, strongest first.
Each layer’s gradient is scaled by the weights of the other layers, so when all of them are small, learning starts slowly.
With random orthogonal initialization the learning time can be independent of depth.
A related effect is [[vanishing gradients|vanish]]: the gradient shrinks as it is propagated back through many layers or time steps (Hochreiter 1991; Bengio, Simard and Frasconi 1994).

Adaptive methods change how fast a plateau is crossed.
RMSprop (Tieleman and Hinton 2012) and Adam (Kingma and Ba 2015) divide each coordinate by a running root mean square of its gradient, so their steps do not change when the gradient is rescaled.

## Method

The plateau is a terrace cut into a tilted bowl.
Inside it the loss is replaced by a plane, so the gradient is the same everywhere on it (the readout, 0.035 on the default sheet) and the Hessian is zero.
So the plateau isolates the small gradient, with no curvature to help or hinder.
Its edge is warped by smooth noise.
Every 405 steps a [[cohort|cohort]] of 14 particles per optimizer is released about 0.09 inside the uphill edge and 0.63 from the downhill rim.
A particle that starts on the plateau is timed until it leaves, over any edge.
The figure and readouts give the mean over the latest 300 exits per optimizer.
The noise is `g̃ = ∇L + σξ`.
RMSprop uses β = 0.99 (Tieleman and Hinton suggested 0.9, without the correction), and Adam β₁ = 0.9 and β₂ = 0.999.
Both correct their averages for starting at zero and use ε = 10⁻⁸.

## Caveat

This plateau is a tilted plane, so it reproduces only the small gradient.
Plateaus caused by symmetry surround saddles or lines of critical points.
There the gradient also vanishes along the way out, and the time to leave depends on how far the symmetry is broken, as on <i>Saddle points</i>.
The adaptive methods’ advantage here relies on a gradient whose sign stays the same from step to step.
So the timings here describe the simplest case, a steady small slope.

## At scale

In d dimensions a random initialization is nearly orthogonal to what must be learned: its overlap with the target is of order `1/√d`.
So in high dimensions training generally starts on a plateau.
In simple high-dimensional models, Ben Arous, Gheissari and Jagannath (2021) showed that online SGD spends almost all of its samples in this initial search, which grows longer as d grows.
Small initializations in deeper models give a sequence of plateaus, one at each saddle the run passes (see <i>Saddle to saddle</i>).
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

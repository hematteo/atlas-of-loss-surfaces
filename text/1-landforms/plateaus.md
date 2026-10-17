# Plateaus

## Subtitle

A flat, tilted terrace on which SGD, RMSprop and Adam are timed.

## Lead

On a [[plateau|plateau]] the gradient is small, so steps are small and the loss stalls, sometimes for most of a run.
Plateaus arise where hidden units are interchangeable (Saad and Solla 1995; Fukumizu and Amari 2000) and, in deep linear networks, from small initialization (Saxe et al. 2014).
Both are proved in simple models.

## In practice

A long flat stretch need not mean failure: small or nearly symmetric initializations cause plateaus that end abruptly.
Adam’s step does not shrink with the gradient, which helps only while its sign is steady.

## Figure caption

Steps each particle took to leave the plateau, on a logarithmic axis. Ticks are single particles; bars are the means of the latest 300 exits.

## Try

1. Read the figure after a few cohorts → [[SGD|sgd]] takes about 4,300 steps to leave the [[plateau|@Plateau of Vanishing Gradients]], [[RMSprop|rmsprop]] and [[Adam|adam]] about 160: SGD moves `η‖∇L‖` = 1.4 × 10⁻⁴ per step.
2. Raise σ to 0.5 → SGD’s mean stays near 4,300 and Adam’s grows to about 2,000: once the noise exceeds the slope, Adam divides by the noise, not the slope.
3. Raise σ to 1.5 → SGD leaves first, after about 1,600 steps: its random walk now adds to its drift.

## Background

Two mechanisms produce plateaus in networks.
The first is symmetry.
Hidden units with identical incoming weights compute the same function and receive the same gradient, so training cannot separate them.
Saad and Solla (1995) solved online learning in soft committee machines exactly and found a long symmetric phase, in which the hidden units are unspecialized and the error stays nearly constant, before they specialize.
Fukumizu and Amari (2000) proved that each critical point of a network with H − 1 hidden units gives lines of critical points in the network with H units.
These can be saddles or local minima and cause plateaus.

The second is small initialization.
Saxe, McClelland and Ganguli (2014) solved the dynamics of deep linear networks.
From small random weights, learning shows long plateaus followed by rapid transitions, one for each singular mode of the input–output map, strongest first.
With random orthogonal initialization the learning time can be independent of depth.
Related are [[vanishing gradients|vanish]], which shrink the gradient as it is propagated back through many layers or time steps (Hochreiter 1991; Bengio, Simard and Frasconi 1994).

Adaptive methods change how fast a plateau is crossed.
RMSprop (Tieleman and Hinton 2012) and Adam (Kingma and Ba 2015) divide each coordinate by a running root mean square of its gradient, so Adam’s step does not change when the gradient is rescaled.

## Method

The plateau is a terrace cut into a tilted bowl.
Inside it the loss is replaced by a plane, so the gradient is the same everywhere on it (the readout, 0.035 on the default sheet) and the Hessian is zero.
Its edge is warped by smooth noise.
Every 405 steps a [[cohort|cohort]] of 14 particles per optimizer is released near the uphill edge, about 0.63 from the downhill rim.
A particle that starts on the plateau is timed until it leaves; the figure and readouts give the mean over the latest 300 exits per optimizer.
The noise is `g̃ = ∇L + σξ`.
RMSprop uses β = 0.99, and Adam β₁ = 0.9 and β₂ = 0.999; both correct their averages for starting at zero and use ε = 10⁻⁸.

## Caveat

This plateau is a tilted plane, so it reproduces only the small gradient.
Plateaus caused by symmetry surround saddles or lines of critical points.
There the gradient also vanishes along the way out, and the time to leave depends on how far the symmetry is broken, as on <i>Saddle points</i>.
The adaptive methods’ advantage here relies on a gradient whose sign stays the same from step to step.

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

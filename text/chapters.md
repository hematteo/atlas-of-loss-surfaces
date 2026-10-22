# Chapters

1. Landforms
   The features that studies of real networks keep finding in their loss surfaces, one plate each.
   Basins and the divides between them, saddles, plateaus, ravines, cliffs, and minima of different sharpness each change how gradient descent and its relatives move.
2. Step size and noise
   What the learning rate and the gradient noise do to training.
   The step size decides which minima are stable, and the noise turns training into a random walk whose scale, shape and tails decide where it settles.
3. Optimizers
   Each optimizer turns the gradient into a step in its own way.
   These plates follow what momentum, per-coordinate scaling, weight decay, curvature, a worst-case neighbourhood and averaging change about plain gradient descent.
4. Trajectories
   How training moves over time, not only where it ends.
   Learning can arrive in stages, the first steps depend on the learning-rate schedule, and the long phase at a constant learning rate sets up the drop when it decays.
   Generalization can arrive long after the training loss has fallen, and a network trained on one task after another can lose the ability to learn the next.
5. Solutions
   Training rarely has a single answer.
   These plates ask how the minima it finds relate to one another: joined by low-loss paths, split by early randomness, copies of one another under symmetry, not isolated points at all, or equally low but different in what they carry over to other tasks.
6. Proving grounds
   The standard test functions of optimization, each built to defeat a particular kind of method.
   Particles race from shared starts so the optimizers can be compared directly, and the last plate is a blank sheet to sculpt.
7. Where there is no bottom
   Problems in which gradient descent has no minimum to settle in.
   Two players pull one sheet in opposite directions, a softmax policy needs infinite logits to reach its best action, and a separable classifier's weights grow without bound.
8. After pretraining
   What happens to a pretrained model when it is fine-tuned on preferences, with reinforcement learning or through a low-rank adapter, and when fine-tuned models are combined.
   Probabilities can move the wrong way, entropy can collapse, the policy can drift from its base, safety training can be undone, an adapter starts beside a saddle, and task vectors add up only sometimes.
9. Beyond two dimensions
   Every plate before this one has two parameters, and real networks have millions.
   These plates compute in many dimensions and use the map only for a slice or a projection.
   They show where minima sit when there are many directions, what a slice hides, what a projected path does and does not mean, why test error can peak and fall again as a model grows, and how a learning rate can carry over from a narrow network to a wide one.

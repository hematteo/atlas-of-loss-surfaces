# References

Every plate cites the papers it draws on: 200 works in all. They are listed here by plate, each with a note on what it
contributed, and then alphabetically. Each plate title links to that plate in the atlas.

If a claim on a plate looks wrong, please [open an issue](https://github.com/hematteo/atlas-of-loss-surfaces/issues/new?template=plate-error.yml).

## By plate

### I · Landforms

**1. [Survey of a loss surface](https://matteohe.com/atlas-of-loss-surfaces/?plate=survey)**

- Robbins, H. and Monro, S. (1951). A stochastic approximation method. Annals of Mathematical Statistics 22(3). *Stochastic approximation, the basis of SGD.*
- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5). *Introduces the heavy-ball method.*
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR. *Introduces Adam.*
- LeCun, Y., Bottou, L., Orr, G. B. and Müller, K.-R. (1998). Efficient BackProp. In Neural Networks: Tricks of the Trade, Springer. *Ties the largest stable learning rate to λmax, and the speed of convergence to the conditioning of the Hessian.*
- Saad, D. and Solla, S. A. (1995). On-line learning in soft committee machines. Physical Review E 52(4), 4225–4243. *Plateaus caused by symmetry between hidden units.*
- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS. *Argues that high-loss critical points in high dimensions are mostly saddles.*
- Goodfellow, I. J., Vinyals, O. and Saxe, A. M. (2015). Qualitatively characterizing neural network optimization problems. ICLR. *The loss along the straight line from initialization to solution usually falls monotonically.*
- Keskar, N. S., Mudigere, D., Nocedal, J., Smelyanskiy, M. and Tang, P. T. P. (2017). On large-batch training for deep learning: generalization gap and sharp minima. ICLR. *Large-batch training reaches sharper minima that generalize worse.*
- Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018). Visualizing the loss landscape of neural nets. NeurIPS. *Filter-normalized two-dimensional slices; skip connections keep them nearly convex.*
- Sagun, L., Evci, U., Güney, V. U., Dauphin, Y. and Bottou, L. (2018). Empirical analysis of the Hessian of over-parametrized neural networks. ICLR Workshop Track. *The Hessian spectrum after training: a bulk near zero and a few outliers.*
- Cooper, Y. (2018). The loss landscape of overparameterized neural networks. arXiv:1804.10200. *With n parameters and d data points, the global minima form a manifold of dimension n − d.*
- Ghorbani, B., Krishnan, S. and Xiao, Y. (2019). An investigation into neural net optimization via Hessian eigenvalue density. ICML. *Large outlier eigenvalues, and their suppression by batch normalization.*
- Imhof, E. (1965). Kartographische Geländedarstellung. De Gruyter. English edition: Cartographic Relief Presentation (1982). *The relief-shading conventions used for every sheet.*

**2. [Basins of attraction](https://matteohe.com/atlas-of-loss-surfaces/?plate=catchments)**

- Wu, L., Zhu, Z. and E, W. (2017). Towards understanding generalization of deep learning: perspective of loss landscapes. arXiv:1706.10239. *Argues that the basins of minima that generalize well take up most of the volume, so random initialization finds them.*
- Huang, W. R., Emam, Z., Goldblum, M., Fowl, L., Terry, J. K., Huang, F. and Goldstein, T. (2020). Understanding generalization through visualizations. NeurIPS Workshop “I Can’t Believe It’s Not Better!”, PMLR 137. *Visualizes the volume argument: in high dimensions, wide minima occupy vastly more volume than narrow ones.*
- Chiang, P., Ni, R., Miller, D. Y., Bansal, A., Geiping, J., Goldblum, M. and Goldstein, T. (2023). Loss landscapes are all you need: neural network generalization can be explained without the implicit bias of gradient descent. ICLR. *Random guess-and-check training generalizes about as well as SGD at small scale, supporting the volume hypothesis.*
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49. *From a random start, gradient descent with a small step almost surely avoids strict saddles.*
- Kleinberg, R., Li, Y. and Yuan, Y. (2018). An alternative view: when does SGD escape local minima? ICML. *SGD behaves like gradient descent on a smoothed loss and can escape sharp local minima.*

**3. [Saddle points](https://matteohe.com/atlas-of-loss-surfaces/?plate=saddles)**

- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS. *The higher the loss at a critical point, the larger its index; high-loss critical points are mostly saddles.*
- Ge, R., Huang, F., Jin, C. and Yuan, Y. (2015). Escaping from saddle points: online stochastic gradient for tensor decomposition. COLT. *Noisy SGD escapes strict saddles in polynomial time.*
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49. *From a random start, gradient descent with a small step almost surely avoids strict saddles.*
- Jin, C., Ge, R., Netrapalli, P., Kakade, S. M. and Jordan, M. I. (2017). How to escape saddle points efficiently. ICML. *Perturbed gradient descent escapes saddles with only polylogarithmic dependence on the dimension.*
- Du, S. S., Jin, C., Lee, J. D., Jordan, M. I., Singh, A. and Póczos, B. (2017). Gradient descent can take exponential time to escape saddle points. NeurIPS. *Without noise, a chain of saddles can delay gradient descent exponentially in the dimension.*

**4. [Plateaus](https://matteohe.com/atlas-of-loss-surfaces/?plate=plateaus)**

- Saad, D. and Solla, S. A. (1995). On-line learning in soft committee machines. Physical Review E 52(4), 4225–4243. *Exact dynamics of a two-layer network: a long symmetric phase in which hidden units are unspecialized.*
- Fukumizu, K. and Amari, S. (2000). Local minima and plateaus in hierarchical structures of multilayer perceptrons. Neural Networks 13(3). *Critical points of a smaller network become lines of saddles or local minima in a larger one.*
- Saxe, A. M., McClelland, J. L. and Ganguli, S. (2014). Exact solutions to the nonlinear dynamics of learning in deep linear neural networks. ICLR. *From small initialization, plateaus and sudden transitions, one per singular mode.*
- Hochreiter, S. (1991). Untersuchungen zu dynamischen neuronalen Netzen. Diploma thesis, Technische Universität München. *First analysis of vanishing and exploding error signals in recurrent networks.*
- Bengio, Y., Simard, P. and Frasconi, P. (1994). Learning long-term dependencies with gradient descent is difficult. IEEE Transactions on Neural Networks 5(2). *Gradients for long-term dependencies vanish exponentially in robust recurrent dynamics.*
- Tieleman, T. and Hinton, G. (2012). Lecture 6.5, RMSprop. COURSERA: Neural Networks for Machine Learning. *Introduces RMSprop.*
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR. *Introduces Adam; its step is invariant to rescaling the gradient.*

**5. [Ravines](https://matteohe.com/atlas-of-loss-surfaces/?plate=ravines)**

- LeCun, Y., Bottou, L., Orr, G. B. and Müller, K.-R. (1998). Efficient BackProp. In Neural Networks: Tricks of the Trade, Springer. *The largest stable learning rate is 2/λmax, and the condition number of the Hessian sets the speed of convergence.*
- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5). *Introduces the heavy ball; with tuned settings it needs order √κ steps on a quadratic.*
- Nesterov, Y. (1983). A method for solving the convex programming problem with convergence rate O(1/k²). Soviet Mathematics Doklady 27. *Introduces the accelerated gradient method.*
- Sutskever, I., Martens, J., Dahl, G. and Hinton, G. (2013). On the importance of initialization and momentum in deep learning. ICML. *Writes Nesterov’s method as momentum, shows it acts with momentum β(1 − ηλ) on a quadratic, and trains deep networks with it.*
- Goh, G. (2017). Why momentum really works. Distill. *An interactive analysis of momentum on quadratics.*

**6. [Cliffs and exploding gradients](https://matteohe.com/atlas-of-loss-surfaces/?plate=cliffs)**

- Hochreiter, S. (1991). Untersuchungen zu dynamischen neuronalen Netzen. Diploma thesis, Technische Universität München. *First analysis of vanishing and exploding error signals in recurrent networks.*
- Bengio, Y., Simard, P. and Frasconi, P. (1994). Learning long-term dependencies with gradient descent is difficult. IEEE Transactions on Neural Networks 5(2). *Long-term gradient components vanish or the dynamics lose robustness to noise.*
- Mikolov, T. (2012). Statistical language models based on neural networks. PhD thesis, Brno University of Technology. *Clips gradient components elementwise to train recurrent language models.*
- Pascanu, R., Mikolov, T. and Bengio, Y. (2013). On the difficulty of training recurrent neural networks. ICML. *Conditions for exploding and vanishing gradients, steep walls in the loss surface, and gradient-norm clipping.*
- Goodfellow, I., Bengio, Y. and Courville, A. (2016). Deep Learning, sections 8.2.4 and 10.11.1. MIT Press. *Textbook treatment of cliffs, exploding gradients and clipping.*
- Zhang, J., He, T., Sra, S. and Jadbabaie, A. (2020). Why gradient clipping accelerates training: a theoretical justification for adaptivity. ICLR. *Relaxed smoothness, observed in LSTM training, under which clipped gradient descent converges faster than any fixed step.*
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR. *Bounds Adam’s step by about η(1 − β₁)/√(1 − β₂) per coordinate.*

**7. [Sharp and flat minima](https://matteohe.com/atlas-of-loss-surfaces/?plate=sharpflat)**

- Hochreiter, S. and Schmidhuber, J. (1997). Flat minima. Neural Computation 9(1). *The original argument: flat minima take fewer bits to describe and should generalize better.*
- Keskar, N. S., Mudigere, D., Nocedal, J., Smelyanskiy, M. and Tang, P. T. P. (2017). On large-batch training for deep learning: generalization gap and sharp minima. ICLR. *Large-batch training reaches minima with higher ε-sharpness and a larger generalization gap.*
- Dinh, L., Pascanu, R., Bengio, S. and Bengio, Y. (2017). Sharp minima can generalize for deep nets. ICML. *Rescaling a ReLU network changes its sharpness but not its function.*
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS. *Gradient descent can converge only to minima with λmax ≤ 2/η; SGD’s noise narrows this further.*
- Jiang, Y., Neyshabur, B., Mobahi, H., Krishnan, D. and Bengio, S. (2020). Fantastic generalization measures and where to find them. ICLR. *Across more than 10,000 networks, sharpness-based measures were among the best predictors of generalization.*
- Foret, P., Kleiner, A., Mobahi, H. and Neyshabur, B. (2021). Sharpness-aware minimization for efficiently improving generalization. ICLR. *Minimizes the worst loss within a ball around the weights.*
- Andriushchenko, M., Croce, F., Müller, M., Hein, M. and Flammarion, N. (2023). A modern look at the relationship between sharpness and generalization. ICML. *Even rescaling-invariant sharpness correlates poorly with generalization in modern settings.*
- Sagun, L., Evci, U., Güney, V. U., Dauphin, Y. and Bottou, L. (2018). Empirical analysis of the Hessian of over-parametrized neural networks. ICLR Workshop Track. *The Hessian spectrum after training: a bulk near zero and a few outliers.*

### II · Step size and noise

**8. [Stability and catapults](https://matteohe.com/atlas-of-loss-surfaces/?plate=stability)**

- LeCun, Y., Simard, P. Y. and Pearlmutter, B. (1993). Automatic learning rate maximization by on-line estimation of the Hessian’s eigenvectors. NeurIPS. *Sets the learning rate from an online estimate of λmax.*
- LeCun, Y., Bottou, L., Orr, G. B. and Müller, K.-R. (1998). Efficient BackProp. In Neural Networks: Tricks of the Trade, Springer. *On a quadratic, gradient descent diverges above η = 2/λmax.*
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS. *Gradient descent can converge only to minima with λmax ≤ 2/η; SGD’s noise narrows this further.*
- Lewkowycz, A., Bahri, Y., Dyer, E., Sohl-Dickstein, J. and Gur-Ari, G. (2020). The large learning rate phase of deep learning: the catapult mechanism. arXiv:2003.02218. *Lazy, catapult and divergent phases: the catapult lies between 2/λ₀ and 4/λ₀ in a solvable model, up to about 12/λ₀ in ReLU networks.*
- Jastrzębski, S., Szymczak, M., Fort, S., Arpit, D., Tabor, J., Cho, K. and Geras, K. (2020). The break-even point on optimization trajectories of deep neural networks. ICLR. *A larger learning rate or smaller batch keeps the curvature lower from early in training.*

**9. [The edge of stability](https://matteohe.com/atlas-of-loss-surfaces/?plate=eos)**

- Cohen, J. M., Kaur, S., Li, Y., Kolter, J. Z. and Talwalkar, A. (2021). Gradient descent on neural networks typically occurs at the edge of stability. ICLR. *Progressive sharpening, and λmax hovering just above 2/η in full-batch training.*
- Damian, A., Nichani, E. and Lee, J. D. (2023). Self-stabilization: the implicit bias of gradient descent at the edge of stability. ICLR. *The oscillation lowers the sharpness through the third derivative; gradient descent follows projected gradient descent on {λmax ≤ 2/η}.*
- Cohen, J. M., Damian, A., Talwalkar, A., Kolter, J. Z. and Lee, J. D. (2025). Understanding optimization in deep learning with central flows. ICLR. *An ODE for the time-averaged trajectory at the edge of stability.*
- Cohen, J. M., Ghorbani, B., Krishnan, S., Agarwal, N., Medapati, S., Badura, M., Suo, D., Cardoze, D., Nado, Z., Dahl, G. E. and Gilmer, J. (2022). Adaptive gradient methods at the edge of stability. arXiv:2207.14484. *Full-batch Adam holds λmax(P⁻¹H) at 38/η for β₁ = 0.9 while λmax itself keeps rising.*
- Bai, Z., Zhou, Z., Zhao, J., Li, X., Li, Z., Xiong, F., Yang, H., Zhang, Y. and Xu, Z.-Q. J. (2026). Adaptive preconditioners trigger loss spikes in Adam. ICML. *Loss spikes when the second-moment estimate stops tracking the gradient and the preconditioned sharpness passes the threshold.*
- Andreyev, A. and Beneventano, P. (2024). Edge of stochastic stability: revisiting the edge of stability for SGD. arXiv:2412.20553. *With minibatches, batch sharpness settles at 2/η and λmax stays below it.*

**10. [Implicit gradient regularization](https://matteohe.com/atlas-of-loss-surfaces/?plate=igr)**

- Barrett, D. G. T. and Dherin, B. (2021). Implicit gradient regularization. ICLR. *Backward error analysis gives the modified loss L + (η/4)‖∇L‖²; uses this two-parameter model.*
- Smith, S. L., Dherin, B., Barrett, D. G. T. and De, S. (2021). On the origin of implicit regularization in stochastic gradient descent. ICLR. *The modified loss of SGD, which also penalizes the norms of minibatch gradients.*
- Du, S. S., Hu, W. and Lee, J. D. (2018). Algorithmic regularization in learning deep homogeneous models: layers are automatically balanced. NeurIPS. *Gradient flow conserves the differences between the squared norms of consecutive layers.*
- Hairer, E., Lubich, C. and Wanner, G. (2006). Geometric Numerical Integration, 2nd edition, chapter IX. Springer. *Backward error analysis of numerical integrators.*

**11. [Noise as temperature](https://matteohe.com/atlas-of-loss-surfaces/?plate=temperature)**

- Kramers, H. A. (1940). Brownian motion in a field of force and the diffusion model of chemical reactions. Physica 7(4). *The time to cross a barrier ΔL at temperature T grows as exp(ΔL/T).*
- Welling, M. and Teh, Y. W. (2011). Bayesian learning via stochastic gradient Langevin dynamics. ICML. *Adds Gaussian noise to SGD steps so that the iterates sample a posterior: the update this sheet runs.*
- Li, Q., Tai, C. and E, W. (2017). Stochastic modified equations and adaptive stochastic gradient algorithms. ICML. *Proves that SGD with small η is a weak approximation of an SDE whose noise covariance is ηΣ.*
- Mandt, S., Hoffman, M. D. and Blei, D. M. (2017). Stochastic gradient descent as approximate Bayesian inference. JMLR 18(134). *Constant-step SGD near one minimum as an Ornstein–Uhlenbeck process with a Gaussian stationary distribution.*
- Jastrzębski, S., Kenton, Z., Arpit, D., Ballas, N., Fischer, A., Bengio, Y. and Storkey, A. (2017). Three factors influencing minima in SGD. arXiv:1711.04623. Published as: Width of minima reached by stochastic gradient descent is influenced by learning rate to batch size ratio. ICANN 2018. *Under isotropic noise, a Boltzmann distribution with temperature ∝ η/B; wider minima at larger η/B.*
- Goyal, P., Dollár, P., Girshick, R., Noordhuis, P., Wesolowski, L., Kyrola, A., Tulloch, A., Jia, Y. and He, K. (2017). Accurate, large minibatch SGD: training ImageNet in 1 hour. arXiv:1706.02677. *The linear scaling rule with warmup, holding up to batches of 8,192 for ResNet-50 on ImageNet.*
- Smith, S. L. and Le, Q. V. (2018). A Bayesian perspective on generalization and stochastic gradient descent. ICLR. *The noise scale ηN/B, and an optimal batch size proportional to η.*
- Chaudhari, P. and Soatto, S. (2018). Stochastic gradient descent performs variational inference, converges to limit cycles for deep networks. ICLR. *With anisotropic noise, SGD’s stationary distribution is set by a potential that differs from the loss.*
- Li, Z., Malladi, S. and Arora, S. (2021). On the validity of modeling SGD with stochastic differential equations (SDEs). NeurIPS. *A testable necessary condition for the SDE approximation and the linear scaling rule.*

**12. [The shape of the noise](https://matteohe.com/atlas-of-loss-surfaces/?plate=anisotropic)**

- Zhu, Z., Wu, J., Yu, B., Wu, L. and Ma, J. (2019). The anisotropic noise in stochastic gradient descent: its behavior of escaping from sharp minima and regularization effects. ICML. *The indicator Tr(HΣ); noise aligned with the Hessian escapes sharp minima faster than isotropic noise of the same trace.*
- Xie, Z., Sato, I. and Sugiyama, M. (2021). A diffusion theory for deep learning dynamics: stochastic gradient descent exponentially favors flat minima. ICLR. *Measures C ≈ H/B near minima and derives escape times exponential in BΔL/(ηλ).*
- Kunstner, F., Balles, L. and Hennig, P. (2019). Limitations of the empirical Fisher approximation for natural gradient descent. NeurIPS. *The empirical Fisher need not approximate the Fisher or the Hessian.*
- Kaplan, E. L. and Meier, P. (1958). Nonparametric estimation from incomplete observations. Journal of the American Statistical Association 53(282). *The survival estimate used for the figure and readouts.*

**13. [The tails of the noise](https://matteohe.com/atlas-of-loss-surfaces/?plate=heavytail)**

- Şimşekli, U., Sagun, L. and Gürbüzbalaban, M. (2019). A tail-index analysis of stochastic gradient noise in deep neural networks. ICML. *Reports α-stable gradient noise with α well below 2, and models SGD as a Lévy-driven SDE.*
- Imkeller, P. and Pavlyukevich, I. (2006). First exit times of SDEs driven by stable Lévy processes. Stochastic Processes and their Applications 116(4). *Exit times of Lévy-driven SDEs grow polynomially in the noise and depend on distances, not barrier heights.*
- Nguyen, T. H., Şimşekli, U., Gürbüzbalaban, M. and Richard, G. (2019). First exit time analysis of stochastic gradient descent under heavy-tailed gradient noise. NeurIPS. *Step sizes for which discrete SGD keeps the continuous-time exit behaviour.*
- Panigrahi, A., Somani, R., Goyal, N. and Netrapalli, P. (2019). Non-Gaussianity of stochastic gradient noise. arXiv:1910.09626. *Gradient noise is close to Gaussian for batches of 256 and above, at least early in training.*
- Xie, Z., Sato, I. and Sugiyama, M. (2021). A diffusion theory for deep learning dynamics: stochastic gradient descent exponentially favors flat minima. ICLR. *Argues that the pooled tail-index estimate assumes isotropic, identically distributed noise; finds the noise close to Gaussian.*
- Battash, B., Wolf, L. and Lindenbaum, O. (2024). Revisiting the noise model of stochastic gradient descent. AISTATS. *Finds heavy-tailed noise again, with each parameter modelled by its own Lévy process.*
- Gürbüzbalaban, M., Şimşekli, U. and Zhu, L. (2021). The heavy-tail phenomenon in SGD. ICML. *SGD’s iterates can be heavy-tailed on linear regression with Gaussian data; tails get heavier as η/B grows.*
- Hodgkinson, L. and Mahoney, M. W. (2021). Multiplicative noise and heavy tails in stochastic optimization. ICML. *Multiplicative noise makes the stationary distribution of stochastic optimizers heavy-tailed.*

**14. [Label noise and the flattest solution](https://matteohe.com/atlas-of-loss-surfaces/?plate=labelnoise)**

- Blanc, G., Gupta, N., Valiant, G. and Valiant, P. (2020). Implicit regularization for deep neural networks driven by an Ornstein–Uhlenbeck like process. COLT. *Near a zero-loss point, label-noise SGD decreases Σ‖∇θf‖², which equals tr H there.*
- HaoChen, J. Z., Wei, C., Lee, J. D. and Ma, T. (2021). Shape matters: understanding the implicit bias of the noise covariance. COLT. *Label noise recovers sparse solutions where Gaussian noise does not.*
- Damian, A., Ma, T. and Lee, J. D. (2021). Label noise SGD provably prefers flat global minimizers. NeurIPS. *Label-noise SGD converges to stationary points of the loss plus a sharpness penalty.*
- Li, Z., Wang, T. and Arora, S. (2022). What happens after SGD reaches zero loss? A mathematical framework. ICLR. *A global analysis over η−2 steps; label-noise SGD then decreases tr H along the manifold of minimizers.*

### III · Optimizers

**15. [Momentum](https://matteohe.com/atlas-of-loss-surfaces/?plate=momentum)**

- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5). *Introduces the heavy-ball method and its optimal η and β on a quadratic.*
- Nesterov, Y. (1983). A method for solving the convex programming problem with convergence rate O(1/k²). Soviet Mathematics Doklady 27. *The accelerated gradient method, with the gradient taken at a look-ahead point.*
- Qian, N. (1999). On the momentum term in gradient descent learning algorithms. Neural Networks 12(1). *Near a minimum, momentum descent is a set of damped oscillators; momentum helps by bringing directions closer to critical damping.*
- Sutskever, I., Martens, J., Dahl, G. and Hinton, G. (2013). On the importance of initialization and momentum in deep learning. ICML. *Writes Nesterov’s method in the momentum form used here, and shows momentum is needed to train deep and recurrent networks with first-order methods.*
- Goh, G. (2017). Why momentum really works. Distill. *An interactive analysis of momentum on quadratics: critical damping, the optimal β and the √κ rate.*
- Lessard, L., Recht, B. and Packard, A. (2016). Analysis and design of optimization algorithms via integral quadratic constraints. SIAM Journal on Optimization 26(1), 57–95. *A one-dimensional strongly convex function with κ = 25 on which the heavy ball with Polyak’s parameters (α = 1/9, β = 4/9) settles into a period-3 cycle instead of converging.*
- Kidambi, R., Netrapalli, P., Jain, P. and Kakade, S. M. (2018). On the insufficiency of existing momentum schemes for stochastic optimization. ICLR. *With stochastic gradients, the heavy ball and Nesterov’s method can fail to improve on SGD.*

**16. [Adam, sign descent and the axes](https://matteohe.com/atlas-of-loss-surfaces/?plate=adam)**

- Riedmiller, M. and Braun, H. (1993). A direct adaptive method for faster backpropagation learning: the RPROP algorithm. IEEE International Conference on Neural Networks. *Steps by a per-weight size using only the sign of each partial derivative.*
- Duchi, J., Hazan, E. and Singer, Y. (2011). Adaptive subgradient methods for online learning and stochastic optimization. JMLR 12. *AdaGrad: per-coordinate step sizes from accumulated squared gradients.*
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR. *Introduces Adam.*
- Bernstein, J., Wang, Y.-X., Azizzadenesheli, K. and Anandkumar, A. (2018). signSGD: compressed optimisation for non-convex problems. ICML. *Convergence of sign-based SGD on non-convex problems, and one-bit gradient compression.*
- Balles, L. and Hennig, P. (2018). Dissecting Adam: the sign, magnitude and variance of stochastic gradients. ICML. *Splits Adam into a sign direction and a variance-adapted magnitude.*
- Balles, L., Pedregosa, F. and Le Roux, N. (2020). The geometry of sign gradient descent. arXiv:2002.08056. *Sign descent as ℓ∞ steepest descent; favourable when the Hessian is concentrated on its diagonal and λmax is far above the average eigenvalue.*
- Kunstner, F., Chen, J., Lavington, J. W. and Schmidt, M. (2023). Noise is not the main factor behind the gap between SGD and Adam on transformers, but sign descent might be. ICLR. *The SGD–Adam gap persists with full batches, where Adam behaves like sign descent with momentum.*
- Chen, X., Liang, C., Huang, D., Real, E., Wang, K., Liu, Y., Pham, H., Dong, X., Luong, T., Hsieh, C.-J., Lu, Y. and Le, Q. V. (2023). Symbolic discovery of optimization algorithms. NeurIPS. *Lion, found by program search: the sign of an interpolation of momentum and gradient.*
- Zhang, Y., Chen, C., Ding, T., Li, Z., Sun, R. and Luo, Z.-Q. (2024). Why transformers need Adam: a Hessian perspective. NeurIPS. *Relates the SGD–Adam gap to Hessian spectra that differ between parameter blocks.*
- Xie, S., Mohamadi, M. A. and Li, Z. (2025). Adam exploits ℓ∞-geometry of loss landscape via coordinate-wise adaptivity. ICLR. *Convergence under ℓ∞ smoothness; after a random rotation of the loss, Adam can lose to rotation-invariant SGD variants.*

**17. [Weight decay and scale invariance](https://matteohe.com/atlas-of-loss-surfaces/?plate=wd)**

- van Laarhoven, T. (2017). L2 regularization versus batch and weight normalization. arXiv:1706.05350. *With normalization, L2 regularization does not regularize; it sets the effective learning rate η/‖θ‖².*
- Arora, S., Li, Z. and Lyu, K. (2019). Theoretical analysis of auto rate-tuning by batch normalization. ICLR. *Scale-invariant weights converge without tuning their learning rate, because ‖θ‖ adapts.*
- Zhang, G., Wang, C., Xu, B. and Grosse, R. (2019). Three mechanisms of weight decay regularization. ICLR. *In normalized networks, weight decay works mainly by raising the effective learning rate.*
- Loshchilov, I. and Hutter, F. (2019). Decoupled weight decay regularization. ICLR. *AdamW: weight decay applied to θ directly, not through Adam’s preconditioner.*
- Li, Z. and Arora, S. (2020). An exponential learning rate schedule for deep learning. ICLR. *For scale-invariant weights, weight decay is equivalent to an exponentially growing learning rate.*
- Li, Z., Lyu, K. and Arora, S. (2020). Reconciling modern deep learning with traditional optimization analyses: the intrinsic learning rate. NeurIPS. *The equilibrium depends on ηλ alone; conjectures it is reached in about 1/(ηλ) steps.*
- Wan, R., Zhu, Z., Zhang, X. and Sun, J. (2021). Spherical motion dynamics: learning dynamics of normalized neural network using SGD and weight decay. NeurIPS. *Proves convergence to the equilibrium under assumptions; angular update √(2ηλ/(1 + β)).*
- Lyu, K., Li, Z. and Arora, S. (2022). Understanding the generalization benefit of normalization layers: sharpness reduction. NeurIPS. *Gradient descent with weight decay on normalized networks reaches the edge of stability and then reduces sharpness.*
- Kosson, A., Messmer, B. and Jaggi, M. (2024). Rotational equilibrium: how weight decay balances learning across neural networks. ICML. *Equilibrium norms and angular updates for SGD with momentum, AdamW and Lion.*

**18. [Newton’s method and saddles](https://matteohe.com/atlas-of-loss-surfaces/?plate=newton)**

- Nocedal, J. and Wright, S. J. (2006). Numerical Optimization, 2nd edition, chapters 3 and 4. Springer. *Newton’s method, its quadratic convergence, Hessian modification and trust regions.*
- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS. *Argues that high-loss critical points are mostly saddles; proposes saddle-free Newton, using |H|.*
- Martens, J. (2010). Deep learning via Hessian-free optimization. ICML. *Trains deep autoencoders with a truncated-Newton method that uses the positive semidefinite Gauss–Newton matrix.*
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49. *From random initialization, gradient descent converges to a strict saddle with probability zero.*
- Du, S. S., Jin, C., Lee, J. D., Jordan, M. I., Singh, A. and Póczos, B. (2017). Gradient descent can take exponential time to escape saddle points. NeurIPS. *A function on which gradient descent needs exponential time to pass a sequence of saddles.*

**19. [Sharpness-aware minimization](https://matteohe.com/atlas-of-loss-surfaces/?plate=sam)**

- Foret, P., Kleiner, A., Mobahi, H. and Neyshabur, B. (2021). Sharpness-aware minimization for efficiently improving generalization. ICLR. *Introduces SAM: the worst loss within a ball of radius ρ, approximated by one normalized ascent step.*
- Andriushchenko, M. and Flammarion, N. (2022). Towards understanding sharpness-aware minimization. ICML. *Argues the PAC-Bayes and flat-minima explanations of SAM are incomplete, including for m-sharpness.*
- Wen, K., Ma, T. and Li, Z. (2023). How does sharpness-aware minimization minimize sharpness? ICLR. *Full-batch SAM reduces λmax; SAM with batch size 1 reduces the trace of the Hessian.*
- Andriushchenko, M., Croce, F., Müller, M., Hein, M. and Flammarion, N. (2023). A modern look at the relationship between sharpness and generalization. ICML. *Sharpness, even rescaling-invariant, correlates poorly with generalization in modern settings.*
- Park, C., Jang, U., Ryu, E. K. and Yang, I. (2026). Sharpness-aware minimization can hallucinate minimizers. ICML (PMLR 306). *SAM can converge to points where ∇L(θ + ε) = 0 but ∇L(θ) ≠ 0.*

**20. [Weight averaging](https://matteohe.com/atlas-of-loss-surfaces/?plate=averaging)**

- Ruppert, D. (1988). Efficient estimations from a slowly convergent Robbins–Monro process. Technical report 781, Cornell University. *Iterate averaging for stochastic approximation, found independently of Polyak.*
- Polyak, B. T. and Juditsky, A. B. (1992). Acceleration of stochastic approximation by averaging. SIAM Journal on Control and Optimization 30(4). *Averaged iterates with slowly decreasing steps attain the optimal asymptotic covariance.*
- Bach, F. and Moulines, E. (2013). Non-strongly-convex smooth stochastic approximation with convergence rate O(1/n). NeurIPS. *Constant-step averaged SGD on least squares converges at rate O(1/n).*
- Izmailov, P., Podoprikhin, D., Garipov, T., Vetrov, D. and Wilson, A. G. (2018). Averaging weights leads to wider optima and better generalization. UAI. *Stochastic weight averaging for deep networks.*
- Dieuleveut, A., Durmus, A. and Bach, F. (2020). Bridging the gap between constant step size stochastic gradient descent and Markov chains. Annals of Statistics 48(3). *Constant-step SGD as a Markov chain; its average is biased by O(η) on non-quadratic losses.*
- Frankle, J., Dziugaite, G. K., Roy, D. M. and Carbin, M. (2020). Linear mode connectivity and the lottery ticket hypothesis. ICML. *Runs from one initialization with different minibatch orders are often separated by a loss barrier.*
- Neyshabur, B., Sedghi, H. and Zhang, C. (2020). What is being transferred in transfer learning? NeurIPS. *Networks fine-tuned from one pretrained model stay in one basin.*
- Wortsman, M., Ilharco, G., Gadre, S. Y., Roelofs, R., Gontijo-Lopes, R., Morcos, A. S., Namkoong, H., Farhadi, A., Carmon, Y., Kornblith, S. and Schmidt, L. (2022). Model soups: averaging weights of multiple fine-tuned models improves accuracy without increasing inference time. ICML. *Averaging fine-tuned models that share a basin improves accuracy.*
- Sanyal, S., Neerkaje, A., Kaddour, J., Kumar, A. and Sanghavi, S. (2023). Early weight averaging meets high learning rates for LLM pre-training. NeurIPS Workshop on Advancing Neural Network Training (WANT). *Checkpoint averaging during language-model pretraining helps more at high learning rates.*

### IV · Trajectories

**21. [Saddle to saddle](https://matteohe.com/atlas-of-loss-surfaces/?plate=staircase)**

- Saxe, A. M., McClelland, J. L. and Ganguli, S. (2014). Exact solutions to the nonlinear dynamics of learning in deep linear neural networks. ICLR. *Exact learning curves for deep linear networks: modes are learned one at a time, strongest first.*
- Gidel, G., Bach, F. and Lacoste-Julien, S. (2019). Implicit regularization of discrete gradient dynamics in linear neural networks. NeurIPS. *The same sequential learning for discrete gradient descent.*
- Gissin, D., Shalev-Shwartz, S. and Daniely, A. (2020). The implicit bias of depth: how incremental learning drives generalization. ICLR. *Depth makes learning more incremental.*
- Woodworth, B., Gunasekar, S., Lee, J. D., Moroshko, E., Savarese, P., Golan, I., Soudry, D. and Srebro, N. (2020). Kernel and rich regimes in overparametrized models. COLT. *The initialization scale moves diagonal networks between the kernel and the rich regime.*
- Jacot, A., Ged, F., Şimşek, B., Hongler, C. and Gabriel, F. (2021). Saddle-to-saddle dynamics in deep linear networks: small initialization training, symmetry, and sparsity. arXiv:2106.15933. *Conjectures saddle-to-saddle dynamics in deep linear networks, rank growing by one per saddle; proves it up to the second saddle.*
- Berthier, R. (2023). Incremental learning in diagonal linear networks. JMLR 24(171). *Proves that coordinates are activated one after another as the initialization vanishes, in a restricted setting.*
- Pesme, S. and Flammarion, N. (2023). Saddle-to-saddle dynamics in diagonal linear networks. NeurIPS. *Characterizes the saddles visited and the jump times, under negligible assumptions on the data.*
- Boix-Adserà, E., Littwin, E., Abbe, E., Bengio, S. and Susskind, J. (2023). Transformers learn through gradual rank increase. NeurIPS. *Stagewise rank increase, proved for simplified transformers and observed without the simplifications.*
- Bantzis, I., Simon, J. B. and Jacot, A. (2026). Saddle-to-saddle dynamics in deep ReLU networks: low-rank bias in the first saddle escape. ICLR. *In deep ReLU networks the first escape from the origin is low rank in the deeper layers.*

**22. [Warmup](https://matteohe.com/atlas-of-loss-surfaces/?plate=warmup)**

- Goyal, P., Dollár, P., Girshick, R., Noordhuis, P., Wesolowski, L., Kyrola, A., Tulloch, A., Jia, Y. and He, K. (2017). Accurate, large minibatch SGD: training ImageNet in 1 hour. arXiv:1706.02677. *Gradual warmup for large-minibatch SGD with the linear scaling rule.*
- Liu, L., Jiang, H., He, P., Chen, W., Liu, X., Gao, J. and Han, J. (2020). On the variance of the adaptive learning rate and beyond. ICLR. *Attributes Adam’s need for warmup to the variance of its adaptive step early in training; proposes RAdam.*
- Gilmer, J., Ghorbani, B., Garg, A., Kudugunta, S., Neyshabur, B., Cardoze, D., Dahl, G., Nado, Z. and Firat, O. (2022). A loss curvature perspective on training instabilities of deep learning models. ICLR. *Warmup, normalization and initialization let training avoid or leave regions of high curvature.*
- Kalra, D. S. and Barkeshli, M. (2024). Why warmup the learning rate? Underlying mechanisms and improvements. NeurIPS. *The main benefit of warmup is tolerating a larger target η, by moving to better-conditioned regions.*
- Kosson, A., Messmer, B. and Jaggi, M. (2024). Analyzing & reducing the need for learning rate warmup in GPT training. NeurIPS. *Ties the need for warmup to the size of early updates; controlling it reduces that need.*
- Zhou, Z., Sun, Y., Li, B., Wang, J., Wu, H., Wu, L. and Yan, J. (2026). How does local landscape geometry evolve in language model pre-training? arXiv:2609.39767. *Sharpness is high early in pretraining and falls; argues that a larger peak η needs a longer warmup. Preprint.*

**23. [The river valley](https://matteohe.com/atlas-of-loss-surfaces/?plate=river)**

- Loshchilov, I. and Hutter, F. (2017). SGDR: stochastic gradient descent with warm restarts. ICLR. *The cosine schedule.*
- Hu, S. et al. (2024). MiniCPM: unveiling the potential of small language models with scalable training strategies. arXiv:2404.06395. *Introduces the warmup–stable–decay schedule.*
- Hägele, A., Bakouch, E., Kosson, A., Ben Allal, L., Von Werra, L. and Jaggi, M. (2024). Scaling laws and compute-optimal training beyond fixed training durations. NeurIPS. *A constant rate with a short cooldown matches cosine.*
- Wen, K., Li, Z., Wang, J., Hall, D., Liang, P. and Ma, T. (2025). Understanding warmup-stable-decay learning rates: a river valley loss landscape view. ICLR. *The river-valley explanation of warmup–stable–decay.*
- Schaipp, F., Hägele, A., Taylor, A., Şimşekli, U. and Bach, F. (2025). The surprising agreement between convex optimization theory and learning-rate scheduling for large model training. ICML. *A convex-optimization bound predicts the benefit of the cooldown.*
- Defazio, A., Yang, X., Mehta, H., Mishchenko, K., Khaled, A. and Cutkosky, A. (2024). The road less scheduled. NeurIPS. *Schedule-free SGD and AdamW.*
- Song, M., Baek, B., Ahn, K. and Yun, C. (2025). Through the river: understanding the benefit of schedule-free methods for language model training. NeurIPS. *Schedule-free AdamW follows the river without decay or extra averaging.*
- Smith, S. L., Kindermans, P.-J., Ying, C. and Le, Q. V. (2018). Don’t decay the learning rate, increase the batch size. ICLR. *Increasing the batch size can replace decaying the learning rate.*
- McCandlish, S., Kaplan, J., Amodei, D. and the OpenAI Dota Team (2018). An empirical model of large-batch training. arXiv:1812.06162. *The gradient noise scale predicts the critical batch size.*
- Merrill, W., Arora, S., Groeneveld, D. and Hajishirzi, H. (2025). Critical batch size revisited: a simple empirical approach to large-batch language model training. NeurIPS. *The critical batch size in OLMo pretraining starts near zero and levels off; batch-size warmup.*
- Zhou, Z., Sun, Y., Li, B., Wang, J., Wu, H., Wu, L. and Yan, J. (2026). How does local landscape geometry evolve in language model pre-training? arXiv:2609.39767. *Small batches widen the basin and large ones deepen it; proposes raising the batch late. Preprint.*

### V · Solutions

**24. [Mode connectivity](https://matteohe.com/atlas-of-loss-surfaces/?plate=connect)**

- Goodfellow, I. J., Vinyals, O. and Saxe, A. M. (2015). Qualitatively characterizing neural network optimization problems. ICLR. *The loss usually falls monotonically on the straight line from initialization to solution.*
- Freeman, C. D. and Bruna, J. (2017). Topology and geometry of half-rectified network optimization. ICLR. *Sublevel sets of one-hidden-layer ReLU networks become connected as width grows; low-loss paths measured with a string method.*
- Garipov, T., Izmailov, P., Podoprikhin, D., Vetrov, D. and Wilson, A. G. (2018). Loss surfaces, mode connectivity, and fast ensembling of DNNs. NeurIPS. *Trains polygonal chains and Bézier curves between independent solutions; loss and error stay nearly constant along them.*
- Draxler, F., Veschgini, K., Salmhofer, M. and Hamprecht, F. A. (2018). Essentially no barriers in neural network energy landscape. ICML. *Near-flat paths between minima of ResNets and DenseNets, found with the nudged elastic band method.*
- Lucas, J., Bae, J., Zhang, M. R., Fort, S., Zemel, R. and Grosse, R. (2021). On monotonic linear interpolation of neural network parameters. ICML. *Monotonic linear interpolation holds widely; violations arise when the weights move far from initialization.*
- Vlaar, T. J. and Frankle, J. (2022). What can linear interpolation of neural network loss landscapes tell us? ICML. *The shape of the interpolation path does not track test accuracy or the success of optimization.*
- Wang, X., Wang, A. N., Zhou, M. and Ge, R. (2023). Plateau in monotonic linear interpolation: a “biased” view of loss landscape for deep networks. ICLR. *The plateau near initialization on the interpolation path comes from the last-layer biases.*

**25. [Forks in the road](https://matteohe.com/atlas-of-loss-surfaces/?plate=forks)**

- Frankle, J., Dziugaite, G. K., Roy, D. M. and Carbin, M. (2020). Linear mode connectivity and the lottery ticket hypothesis. ICML. *Instability analysis: networks become stable to SGD noise early in training; pruned subnetworks reach full accuracy only when stable.*
- Fort, S., Dziugaite, G. K., Paul, M., Kharaghani, S., Roy, D. M. and Ganguli, S. (2020). Deep learning versus kernel learning: an empirical study of loss landscape geometry and the time evolution of the neural tangent kernel. NeurIPS. *A chaotic phase in the first few epochs decides the final linearly connected basin.*
- Neyshabur, B., Sedghi, H. and Zhang, C. (2020). What is being transferred in transfer learning? NeurIPS. *Models fine-tuned from the same pretrained weights stay in the same basin.*

**26. [Twins and re-basin](https://matteohe.com/atlas-of-loss-surfaces/?plate=symmetry)**

- Hecht-Nielsen, R. (1990). On the algebraic structure of feedforward network weight spaces. In Eckmiller, R. (ed.), Advanced Neural Computers. Elsevier. *The weight-space symmetries of feedforward networks: permutations of hidden units and sign flips.*
- Chen, A. M., Lu, H. and Hecht-Nielsen, R. (1993). On the geometry of feedforward neural network error surfaces. Neural Computation 5(6). *A tanh layer of n units has n!·2n equivalent weight settings.*
- Entezari, R., Sedghi, H., Saukh, O. and Neyshabur, B. (2022). The role of permutation invariance in linear mode connectivity of neural networks. ICLR. *Conjectures that SGD solutions are linearly connected once permutations are accounted for.*
- Ainsworth, S. K., Hayase, J. and Srinivasa, S. (2023). Git Re-Basin: merging models modulo permutation symmetries. ICLR. *Three matching algorithms; zero-barrier connections for wide ResNets on CIFAR-10, not for narrow networks or ImageNet.*

**27. [Singular minima and the learning coefficient](https://matteohe.com/atlas-of-loss-surfaces/?plate=singular)**

- Watanabe, S. (2009). Algebraic Geometry and Statistical Learning Theory. Cambridge University Press. *Proves the asymptotics of the free energy and the generalization error of singular models in terms of λ.*
- Watanabe, S. (2013). A widely applicable Bayesian information criterion. JMLR 14. *WBIC: the free energy from posterior samples at inverse temperature 1/log n.*
- Wei, S., Murfet, D., Gong, M., Li, H., Gell-Redman, J. and Quella, T. (2023). Deep learning is singular, and that’s good. IEEE Transactions on Neural Networks and Learning Systems 34(12). *Singular learning theory for neural networks.*
- Lau, E., Furman, Z., Wang, G., Murfet, D. and Wei, S. (2025). The local learning coefficient: a singularity-aware complexity measure. AISTATS. *Defines the local learning coefficient and its SGLD estimator.*
- Hoogland, J., Wang, G., Farrugia-Roberts, M., Carroll, L., Wei, S. and Murfet, D. (2025). Loss landscape degeneracy and stagewise development in transformers. TMLR. *Changes in the local learning coefficient mark stages of transformer development.*
- Cullen, B., Estan-Ruiz, S., Danait, R. and Li, J. (2026). A basin-selection perspective on grokking via singular learning theory. arXiv:2603.01192. *Grokking as a move to a basin with lower λ. Preprint.*

### VI · Proving grounds

**28. [Rosenbrock’s valley](https://matteohe.com/atlas-of-loss-surfaces/?plate=rosenbrock)**

- Rosenbrock, H. H. (1960). An automatic method for finding the greatest or least value of a function. The Computer Journal 3(3). *Introduces the function, as a test for a search that rotates its directions to follow a valley.*
- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5). *Introduces the heavy ball and proves its rate (√κ − 1)/(√κ + 1) near a minimum.*
- Moré, J. J., Garbow, B. S. and Hillstrom, K. E. (1981). Testing unconstrained optimization software. ACM Transactions on Mathematical Software 7(1). *Rosenbrock’s function, started from (−1.2, 1), as the first problem of a standard test set.*
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University. *Definitions, usual domains and minima of the standard test functions.*

**29. [Himmelblau’s four minima](https://matteohe.com/atlas-of-loss-surfaces/?plate=himmelblau)**

- Himmelblau, D. M. (1972). Applied Nonlinear Programming. McGraw-Hill. *Introduces the function as a test problem with four minima.*
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS. *Among minima of equal loss, gradient descent can converge only to those with λmax ≤ 2/η.*
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University. *Definitions, usual domains and minima of the standard test functions.*

**30. [Rastrigin’s egg crate](https://matteohe.com/atlas-of-loss-surfaces/?plate=rastrigin)**

- Rastrigin, L. A. (1974). Systems of Extremal Control. Nauka, Moscow. *Proposes the function in two dimensions.*
- Mühlenbein, H., Schomisch, M. and Born, J. (1991). The parallel genetic algorithm as function optimizer. Parallel Computing 17(6–7). *Uses the n-dimensional form as a benchmark for a parallel genetic algorithm.*
- Kirkpatrick, S., Gelatt, C. D. and Vecchi, M. P. (1983). Optimization by simulated annealing. Science 220(4598). *Simulated annealing: a noisy search whose temperature is lowered during the run.*
- Hajek, B. (1988). Cooling schedules for optimal annealing. Mathematics of Operations Research 13(2). *With T = c/log t, annealing finds the global minima in probability if and only if c is at least the depth of the deepest non-global well.*
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University. *Definitions, usual domains and minima of the standard test functions.*

**31. [Ackley’s well](https://matteohe.com/atlas-of-loss-surfaces/?plate=ackley)**

- Ackley, D. H. (1987). A Connectionist Machine for Genetic Hillclimbing. Kluwer. *Defines the function in two dimensions, as a test for a genetic hill-climbing algorithm.*
- Bäck, T. and Schwefel, H.-P. (1993). An overview of evolutionary algorithms for parameter optimization. Evolutionary Computation 1(1). *Generalizes the function to n dimensions.*
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University. *Definitions, usual domains and minima of the standard test functions.*

**32. [The six-hump camel](https://matteohe.com/atlas-of-loss-surfaces/?plate=camel)**

- Dixon, L. C. W. and Szegő, G. P. (1978). The global optimization problem: an introduction. In Towards Global Optimisation 2, 1–15. North-Holland. *A standard collection of global-optimization test problems, the source usually cited for this function.*
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University. *Gives the usual window [−3, 3] × [−2, 2] and the six minima, two of them global.*

**33. [A sheet of your own](https://matteohe.com/atlas-of-loss-surfaces/?plate=sculpt)**

- Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018). Visualizing the loss landscape of neural nets. NeurIPS. *Two-dimensional slices of real loss surfaces, which sheets like this one imitate.*

### VII · Where there is no bottom

**34. [Two players on one sheet](https://matteohe.com/atlas-of-loss-surfaces/?plate=games)**

- Korpelevich, G. M. (1976). The extragradient method for finding saddle points and other problems. Ekonomika i Matematicheskie Metody 12(4). *Introduces extragradient and proves its convergence for monotone saddle-point problems.*
- Popov, L. D. (1980). A modification of the Arrow–Hurwicz method for search of saddle points. Mathematical Notes of the Academy of Sciences of the USSR 28(5). *The method that reuses the previous gradient as the trial step, now called optimistic gradient descent–ascent.*
- Goodfellow, I., Pouget-Abadie, J., Mirza, M., Xu, B., Warde-Farley, D., Ozair, S., Courville, A. and Bengio, Y. (2014). Generative adversarial nets. NeurIPS. *Introduces GANs, trained as a two-player game.*
- Mescheder, L., Nowozin, S. and Geiger, A. (2017). The numerics of GANs. NeurIPS. *Traces GAN instability to Jacobian eigenvalues with large imaginary parts.*
- Mescheder, L., Geiger, A. and Nowozin, S. (2018). Which training methods for GANs do actually converge? ICML. *The Dirac-GAN, whose linearization is a bilinear game; unregularized training need not converge.*
- Daskalakis, C., Ilyas, A., Syrgkanis, V. and Zeng, H. (2018). Training GANs with optimism. ICLR. *Optimistic mirror descent converges in the last iterate on bilinear games.*
- Gidel, G., Askari Hemmat, R., Pezeshki, M., Le Priol, R., Huang, G., Lacoste-Julien, S. and Mitliagkas, I. (2019). Negative momentum for improved game dynamics. AISTATS. *Alternating updates are more stable than simultaneous ones on bilinear games.*
- Gidel, G., Berard, H., Vignoud, G., Vincent, P. and Lacoste-Julien, S. (2019). A variational inequality perspective on generative adversarial networks. ICLR. *Casts GAN training as a variational inequality and adapts extragradient to it.*
- Bailey, J. P., Gidel, G. and Piliouras, G. (2020). Finite regret and cycles with fixed step-size via alternating gradient descent-ascent. COLT. *Alternating gradient descent–ascent stays bounded and cycles in zero-sum bilinear games.*
- Mokhtari, A., Ozdaglar, A. and Pattathil, S. (2020). A unified analysis of extra-gradient and optimistic gradient methods for saddle point problems: proximal point approach. AISTATS. *Both methods approximate the proximal point method and converge linearly on bilinear problems.*

**35. [The pull of softmax](https://matteohe.com/atlas-of-loss-surfaces/?plate=softmax)**

- Williams, R. J. (1992). Simple statistical gradient-following algorithms for connectionist reinforcement learning. Machine Learning 8. *The likelihood-ratio policy gradient (REINFORCE).*
- Kakade, S. M. (2001). A natural policy gradient. NeurIPS. *Preconditions the policy gradient by the inverse Fisher information.*
- Mei, J., Xiao, C., Szepesvári, C. and Schuurmans, D. (2020a). On the global convergence rates of softmax policy gradient methods. ICML. *O(1/t) convergence with an initialization-dependent constant, a matching lower bound, and linear convergence with entropy regularization.*
- Mei, J., Xiao, C., Dai, B., Li, L., Szepesvári, C. and Schuurmans, D. (2020b). Escaping the gravitational pull of softmax. NeurIPS. *The softmax gravity well: optimizing any expectation through a softmax is sensitive to initialization.*
- Agarwal, A., Kakade, S. M., Lee, J. D. and Mahajan, G. (2021). On the theory of policy gradient methods: optimality, approximation, and distribution shift. JMLR 22. *Global convergence of softmax policy gradient; natural policy gradient as multiplicative weights, with a dimension-free rate.*
- Li, G., Wei, Y., Chi, Y., Gu, Y. and Chen, Y. (2021). Softmax policy gradient methods can take exponential time to converge. COLT. *Examples in Markov decision processes where softmax policy gradient needs exponentially many iterations.*

**36. [The road to infinity](https://matteohe.com/atlas-of-loss-surfaces/?plate=margin)**

- Soudry, D., Hoffer, E., Nacson, M. S., Gunasekar, S. and Srebro, N. (2018). The implicit bias of gradient descent on separable data. JMLR 19. *Gradient descent on separable data converges in direction to the ℓ₂ max-margin separator, at rate 1/log t.*
- Gunasekar, S., Lee, J., Soudry, D. and Srebro, N. (2018). Characterizing implicit bias in terms of optimization geometry. ICML. *Steepest descent with respect to a norm maximizes the margin in that norm.*
- Nacson, M. S., Lee, J., Gunasekar, S., Savarese, P., Srebro, N. and Soudry, D. (2019). Convergence of gradient descent on separable data. AISTATS. *1/log t is optimal for fixed steps; normalized steps give log t/√t.*
- Lyu, K. and Li, J. (2020). Gradient descent maximizes the margin of homogeneous neural networks. ICLR. *Extends margin maximization to homogeneous networks.*

### VIII · After pretraining

**37. [Likelihood displacement](https://matteohe.com/atlas-of-loss-surfaces/?plate=displace)**

- Rafailov, R., Sharma, A., Mitchell, E., Manning, C. D., Ermon, S. and Finn, C. (2023). Direct preference optimization: your language model is secretly a reward model. NeurIPS. *Introduces DPO.*
- Azar, M. G., Rowland, M., Piot, B., Guo, D., Calandriello, D., Valko, M. and Munos, R. (2024). A general theoretical paradigm to understand learning from human preferences. AISTATS. *Introduces IPO, a squared loss with a finite target margin.*
- Pang, R. Y., Yuan, W., Cho, K., He, H., Sukhbaatar, S. and Weston, J. (2024). Iterative reasoning preference optimization. NeurIPS. *Adds the chosen answer’s negative log-likelihood to the DPO loss.*
- Razin, N., Malladi, S., Bhaskar, A., Chen, D., Arora, S. and Hanin, B. (2025). Unintentional unalignment: likelihood displacement in direct preference optimization. ICLR. *The No/Never/Yes example, the single-token theory, and CHES-based filtering.*
- Ren, Y. and Sutherland, D. J. (2025). Learning dynamics of LLM finetuning. ICLR. *The squeezing effect of negative gradients on unlikely responses.*
- Luo, H., Deng, Z., Do, T.-T., Harandi, M., Phung, D. and Le, T. (2026). Sharpness-aware minimization in logit space efficiently enhances direct preference optimization. ICLR. *Relates squeezing to logit-space curvature and applies SAM to the output layer.*

**38. [Entropy collapse](https://matteohe.com/atlas-of-loss-surfaces/?plate=entropy)**

- Shao, Z., Wang, P., Zhu, Q., Xu, R., Song, J., Bi, X., Zhang, H., Zhang, M., Li, Y. K., Wu, Y. and Guo, D. (2024). DeepSeekMath: pushing the limits of mathematical reasoning in open language models. arXiv:2402.03300. *Introduces GRPO.*
- Cui, G., Zhang, Y., Chen, J., Yuan, L., Wang, Z., Zuo, Y., Li, H., Fan, Y., Chen, H., Chen, W., Liu, Z., Peng, H., Bai, L., Ouyang, W., Cheng, Y., Zhou, B. and Ding, N. (2025). The entropy mechanism of reinforcement learning for reasoning language models. arXiv:2505.22617. *Entropy collapse, R = −a eH + b, and the covariance form of the entropy change.*
- Yue, Y., Chen, Z., Lu, R., Zhao, A., Wang, Z., Yue, Y., Song, S. and Huang, G. (2025). Does reinforcement learning really incentivize reasoning capacity in LLMs beyond the base model? NeurIPS. *RLVR wins at pass@1; base models win at pass@k for large k.*
- Liu, M., Diao, S., Lu, X., Hu, J., Dong, X., Choi, Y., Kautz, J. and Dong, Y. (2025). ProRL: prolonged reinforcement learning expands reasoning boundaries in large language models. NeurIPS. *Reports that prolonged RL expands what the base model can solve.*
- Walder, C. and Karkhanis, D. (2025). Pass@K policy optimization: solving harder reinforcement learning problems. NeurIPS. *Optimizes pass@k directly through a transformation of batch rewards.*
- Hao, Z., Wang, H., Liu, H., Luo, J., Yu, J., Dong, H., Lin, Q., Wang, C. and Chen, J. (2026). Rethinking entropy interventions in RLVR: an entropy change perspective. ACL. *Token-level entropy change depends on clipping, advantage, probability and entropy.*

**39. [RL’s razor](https://matteohe.com/atlas-of-loss-surfaces/?plate=razor)**

- Kakade, S. M. (2001). A natural policy gradient. NeurIPS. *Natural policy gradient, which for softmax policies is the multiplicative-weights update.*
- Shenfeld, I., Pari, J. and Agrawal, P. (2026). RL’s razor: why online reinforcement learning forgets less. ICLR. *Forgetting tracks forward KL on the new task; policy gradient converges to the I-projection in an idealized setting.*
- Zhu, H., Zhang, Z., Huang, H., Su, D., Liu, Z., Zhao, J., Fedorov, I., Pirsiavash, H., Sha, Z., Lee, J., Pan, D. Z., Wang, Z., Tian, Y. and Tai, K. S. (2025). The path not taken: RLVR provably learns off the principals. arXiv:2511.08567. *RLVR updates avoid the principal directions of pretrained weights; SFT does not.*

**40. [The safety basin](https://matteohe.com/atlas-of-loss-surfaces/?plate=safety)**

- Qi, X., Zeng, Y., Xie, T., Chen, P.-Y., Jia, R., Mittal, P. and Henderson, P. (2024). Fine-tuning aligned language models compromises safety, even when users do not intend to! ICLR. *A few harmful examples remove safety alignment; benign fine-tuning also degrades it.*
- Peng, S., Chen, P.-Y., Hull, M. and Chau, D. H. (2024). Navigating the safety landscape: measuring risks in finetuning large language models. NeurIPS. *The safety basin along random directions, and the VISAGE metric.*
- Chen, H., Wei, Z., Huang, Y., Zhang, Y., Dong, Y. and Zhu, J. (2026). Unveiling the basin-like loss landscape in large language models. ICLR. *Capability and alignment basins; sharp worst-case directions; basin size bounds degradation.*
- Yang, S., Zhang, Q., Liu, Y., Jia, X., Ning, K., Yao, J., Wang, J., Dai, H., Song, Y. and Yuan, L. (2026). AsFT: anchoring safety during LLM fine-tuning within narrow safety basin. AAAI. *The narrow safety basin around the alignment direction, and a penalty on orthogonal updates.*

## All works, alphabetically

- Ackley, D. H. (1987). A Connectionist Machine for Genetic Hillclimbing. Kluwer.
- Agarwal, A., Kakade, S. M., Lee, J. D. and Mahajan, G. (2021). On the theory of policy gradient methods: optimality, approximation, and distribution shift. JMLR 22.
- Ainsworth, S. K., Hayase, J. and Srinivasa, S. (2023). Git Re-Basin: merging models modulo permutation symmetries. ICLR.
- Andreyev, A. and Beneventano, P. (2024). Edge of stochastic stability: revisiting the edge of stability for SGD. arXiv:2412.20553.
- Andriushchenko, M. and Flammarion, N. (2022). Towards understanding sharpness-aware minimization. ICML.
- Andriushchenko, M., Croce, F., Müller, M., Hein, M. and Flammarion, N. (2023). A modern look at the relationship between sharpness and generalization. ICML.
- Arora, S., Li, Z. and Lyu, K. (2019). Theoretical analysis of auto rate-tuning by batch normalization. ICLR.
- Azar, M. G., Rowland, M., Piot, B., Guo, D., Calandriello, D., Valko, M. and Munos, R. (2024). A general theoretical paradigm to understand learning from human preferences. AISTATS.
- Bach, F. and Moulines, E. (2013). Non-strongly-convex smooth stochastic approximation with convergence rate O(1/n). NeurIPS.
- Bai, Z., Zhou, Z., Zhao, J., Li, X., Li, Z., Xiong, F., Yang, H., Zhang, Y. and Xu, Z.-Q. J. (2026). Adaptive preconditioners trigger loss spikes in Adam. ICML.
- Bailey, J. P., Gidel, G. and Piliouras, G. (2020). Finite regret and cycles with fixed step-size via alternating gradient descent-ascent. COLT.
- Balles, L. and Hennig, P. (2018). Dissecting Adam: the sign, magnitude and variance of stochastic gradients. ICML.
- Balles, L., Pedregosa, F. and Le Roux, N. (2020). The geometry of sign gradient descent. arXiv:2002.08056.
- Bantzis, I., Simon, J. B. and Jacot, A. (2026). Saddle-to-saddle dynamics in deep ReLU networks: low-rank bias in the first saddle escape. ICLR.
- Barrett, D. G. T. and Dherin, B. (2021). Implicit gradient regularization. ICLR.
- Battash, B., Wolf, L. and Lindenbaum, O. (2024). Revisiting the noise model of stochastic gradient descent. AISTATS.
- Bengio, Y., Simard, P. and Frasconi, P. (1994). Learning long-term dependencies with gradient descent is difficult. IEEE Transactions on Neural Networks 5(2).
- Bernstein, J., Wang, Y.-X., Azizzadenesheli, K. and Anandkumar, A. (2018). signSGD: compressed optimisation for non-convex problems. ICML.
- Berthier, R. (2023). Incremental learning in diagonal linear networks. JMLR 24(171).
- Blanc, G., Gupta, N., Valiant, G. and Valiant, P. (2020). Implicit regularization for deep neural networks driven by an Ornstein–Uhlenbeck like process. COLT.
- Boix-Adserà, E., Littwin, E., Abbe, E., Bengio, S. and Susskind, J. (2023). Transformers learn through gradual rank increase. NeurIPS.
- Bäck, T. and Schwefel, H.-P. (1993). An overview of evolutionary algorithms for parameter optimization. Evolutionary Computation 1(1).
- Chaudhari, P. and Soatto, S. (2018). Stochastic gradient descent performs variational inference, converges to limit cycles for deep networks. ICLR.
- Chen, A. M., Lu, H. and Hecht-Nielsen, R. (1993). On the geometry of feedforward neural network error surfaces. Neural Computation 5(6).
- Chen, H., Wei, Z., Huang, Y., Zhang, Y., Dong, Y. and Zhu, J. (2026). Unveiling the basin-like loss landscape in large language models. ICLR.
- Chen, X., Liang, C., Huang, D., Real, E., Wang, K., Liu, Y., Pham, H., Dong, X., Luong, T., Hsieh, C.-J., Lu, Y. and Le, Q. V. (2023). Symbolic discovery of optimization algorithms. NeurIPS.
- Chiang, P., Ni, R., Miller, D. Y., Bansal, A., Geiping, J., Goldblum, M. and Goldstein, T. (2023). Loss landscapes are all you need: neural network generalization can be explained without the implicit bias of gradient descent. ICLR.
- Cohen, J. M., Damian, A., Talwalkar, A., Kolter, J. Z. and Lee, J. D. (2025). Understanding optimization in deep learning with central flows. ICLR.
- Cohen, J. M., Ghorbani, B., Krishnan, S., Agarwal, N., Medapati, S., Badura, M., Suo, D., Cardoze, D., Nado, Z., Dahl, G. E. and Gilmer, J. (2022). Adaptive gradient methods at the edge of stability. arXiv:2207.14484.
- Cohen, J. M., Kaur, S., Li, Y., Kolter, J. Z. and Talwalkar, A. (2021). Gradient descent on neural networks typically occurs at the edge of stability. ICLR.
- Cooper, Y. (2018). The loss landscape of overparameterized neural networks. arXiv:1804.10200.
- Cui, G., Zhang, Y., Chen, J., Yuan, L., Wang, Z., Zuo, Y., Li, H., Fan, Y., Chen, H., Chen, W., Liu, Z., Peng, H., Bai, L., Ouyang, W., Cheng, Y., Zhou, B. and Ding, N. (2025). The entropy mechanism of reinforcement learning for reasoning language models. arXiv:2505.22617.
- Cullen, B., Estan-Ruiz, S., Danait, R. and Li, J. (2026). A basin-selection perspective on grokking via singular learning theory. arXiv:2603.01192.
- Damian, A., Ma, T. and Lee, J. D. (2021). Label noise SGD provably prefers flat global minimizers. NeurIPS.
- Damian, A., Nichani, E. and Lee, J. D. (2023). Self-stabilization: the implicit bias of gradient descent at the edge of stability. ICLR.
- Daskalakis, C., Ilyas, A., Syrgkanis, V. and Zeng, H. (2018). Training GANs with optimism. ICLR.
- Dauphin, Y. N., Pascanu, R., Gulcehre, C., Cho, K., Ganguli, S. and Bengio, Y. (2014). Identifying and attacking the saddle point problem in high-dimensional non-convex optimization. NeurIPS.
- Defazio, A., Yang, X., Mehta, H., Mishchenko, K., Khaled, A. and Cutkosky, A. (2024). The road less scheduled. NeurIPS.
- Dieuleveut, A., Durmus, A. and Bach, F. (2020). Bridging the gap between constant step size stochastic gradient descent and Markov chains. Annals of Statistics 48(3).
- Dinh, L., Pascanu, R., Bengio, S. and Bengio, Y. (2017). Sharp minima can generalize for deep nets. ICML.
- Dixon, L. C. W. and Szegő, G. P. (1978). The global optimization problem: an introduction. In Towards Global Optimisation 2, 1–15. North-Holland.
- Draxler, F., Veschgini, K., Salmhofer, M. and Hamprecht, F. A. (2018). Essentially no barriers in neural network energy landscape. ICML.
- Du, S. S., Hu, W. and Lee, J. D. (2018). Algorithmic regularization in learning deep homogeneous models: layers are automatically balanced. NeurIPS.
- Du, S. S., Jin, C., Lee, J. D., Jordan, M. I., Singh, A. and Póczos, B. (2017). Gradient descent can take exponential time to escape saddle points. NeurIPS.
- Duchi, J., Hazan, E. and Singer, Y. (2011). Adaptive subgradient methods for online learning and stochastic optimization. JMLR 12.
- Entezari, R., Sedghi, H., Saukh, O. and Neyshabur, B. (2022). The role of permutation invariance in linear mode connectivity of neural networks. ICLR.
- Foret, P., Kleiner, A., Mobahi, H. and Neyshabur, B. (2021). Sharpness-aware minimization for efficiently improving generalization. ICLR.
- Fort, S., Dziugaite, G. K., Paul, M., Kharaghani, S., Roy, D. M. and Ganguli, S. (2020). Deep learning versus kernel learning: an empirical study of loss landscape geometry and the time evolution of the neural tangent kernel. NeurIPS.
- Frankle, J., Dziugaite, G. K., Roy, D. M. and Carbin, M. (2020). Linear mode connectivity and the lottery ticket hypothesis. ICML.
- Freeman, C. D. and Bruna, J. (2017). Topology and geometry of half-rectified network optimization. ICLR.
- Fukumizu, K. and Amari, S. (2000). Local minima and plateaus in hierarchical structures of multilayer perceptrons. Neural Networks 13(3).
- Garipov, T., Izmailov, P., Podoprikhin, D., Vetrov, D. and Wilson, A. G. (2018). Loss surfaces, mode connectivity, and fast ensembling of DNNs. NeurIPS.
- Ge, R., Huang, F., Jin, C. and Yuan, Y. (2015). Escaping from saddle points: online stochastic gradient for tensor decomposition. COLT.
- Ghorbani, B., Krishnan, S. and Xiao, Y. (2019). An investigation into neural net optimization via Hessian eigenvalue density. ICML.
- Gidel, G., Askari Hemmat, R., Pezeshki, M., Le Priol, R., Huang, G., Lacoste-Julien, S. and Mitliagkas, I. (2019). Negative momentum for improved game dynamics. AISTATS.
- Gidel, G., Bach, F. and Lacoste-Julien, S. (2019). Implicit regularization of discrete gradient dynamics in linear neural networks. NeurIPS.
- Gidel, G., Berard, H., Vignoud, G., Vincent, P. and Lacoste-Julien, S. (2019). A variational inequality perspective on generative adversarial networks. ICLR.
- Gilmer, J., Ghorbani, B., Garg, A., Kudugunta, S., Neyshabur, B., Cardoze, D., Dahl, G., Nado, Z. and Firat, O. (2022). A loss curvature perspective on training instabilities of deep learning models. ICLR.
- Gissin, D., Shalev-Shwartz, S. and Daniely, A. (2020). The implicit bias of depth: how incremental learning drives generalization. ICLR.
- Goh, G. (2017). Why momentum really works. Distill.
- Goodfellow, I. J., Vinyals, O. and Saxe, A. M. (2015). Qualitatively characterizing neural network optimization problems. ICLR.
- Goodfellow, I., Bengio, Y. and Courville, A. (2016). Deep Learning, sections 8.2.4 and 10.11.1. MIT Press.
- Goodfellow, I., Pouget-Abadie, J., Mirza, M., Xu, B., Warde-Farley, D., Ozair, S., Courville, A. and Bengio, Y. (2014). Generative adversarial nets. NeurIPS.
- Goyal, P., Dollár, P., Girshick, R., Noordhuis, P., Wesolowski, L., Kyrola, A., Tulloch, A., Jia, Y. and He, K. (2017). Accurate, large minibatch SGD: training ImageNet in 1 hour. arXiv:1706.02677.
- Gunasekar, S., Lee, J., Soudry, D. and Srebro, N. (2018). Characterizing implicit bias in terms of optimization geometry. ICML.
- Gürbüzbalaban, M., Şimşekli, U. and Zhu, L. (2021). The heavy-tail phenomenon in SGD. ICML.
- Hairer, E., Lubich, C. and Wanner, G. (2006). Geometric Numerical Integration, 2nd edition, chapter IX. Springer.
- Hajek, B. (1988). Cooling schedules for optimal annealing. Mathematics of Operations Research 13(2).
- Hao, Z., Wang, H., Liu, H., Luo, J., Yu, J., Dong, H., Lin, Q., Wang, C. and Chen, J. (2026). Rethinking entropy interventions in RLVR: an entropy change perspective. ACL.
- HaoChen, J. Z., Wei, C., Lee, J. D. and Ma, T. (2021). Shape matters: understanding the implicit bias of the noise covariance. COLT.
- Hecht-Nielsen, R. (1990). On the algebraic structure of feedforward network weight spaces. In Eckmiller, R. (ed.), Advanced Neural Computers. Elsevier.
- Himmelblau, D. M. (1972). Applied Nonlinear Programming. McGraw-Hill.
- Hochreiter, S. (1991). Untersuchungen zu dynamischen neuronalen Netzen. Diploma thesis, Technische Universität München.
- Hochreiter, S. and Schmidhuber, J. (1997). Flat minima. Neural Computation 9(1).
- Hodgkinson, L. and Mahoney, M. W. (2021). Multiplicative noise and heavy tails in stochastic optimization. ICML.
- Hoogland, J., Wang, G., Farrugia-Roberts, M., Carroll, L., Wei, S. and Murfet, D. (2025). Loss landscape degeneracy and stagewise development in transformers. TMLR.
- Hu, S. et al. (2024). MiniCPM: unveiling the potential of small language models with scalable training strategies. arXiv:2404.06395.
- Huang, W. R., Emam, Z., Goldblum, M., Fowl, L., Terry, J. K., Huang, F. and Goldstein, T. (2020). Understanding generalization through visualizations. NeurIPS Workshop “I Can’t Believe It’s Not Better!”, PMLR 137.
- Hägele, A., Bakouch, E., Kosson, A., Ben Allal, L., Von Werra, L. and Jaggi, M. (2024). Scaling laws and compute-optimal training beyond fixed training durations. NeurIPS.
- Imhof, E. (1965). Kartographische Geländedarstellung. De Gruyter. English edition: Cartographic Relief Presentation (1982).
- Imkeller, P. and Pavlyukevich, I. (2006). First exit times of SDEs driven by stable Lévy processes. Stochastic Processes and their Applications 116(4).
- Izmailov, P., Podoprikhin, D., Garipov, T., Vetrov, D. and Wilson, A. G. (2018). Averaging weights leads to wider optima and better generalization. UAI.
- Jacot, A., Ged, F., Şimşek, B., Hongler, C. and Gabriel, F. (2021). Saddle-to-saddle dynamics in deep linear networks: small initialization training, symmetry, and sparsity. arXiv:2106.15933.
- Jastrzębski, S., Kenton, Z., Arpit, D., Ballas, N., Fischer, A., Bengio, Y. and Storkey, A. (2017). Three factors influencing minima in SGD. arXiv:1711.04623. Published as: Width of minima reached by stochastic gradient descent is influenced by learning rate to batch size ratio. ICANN 2018.
- Jastrzębski, S., Szymczak, M., Fort, S., Arpit, D., Tabor, J., Cho, K. and Geras, K. (2020). The break-even point on optimization trajectories of deep neural networks. ICLR.
- Jiang, Y., Neyshabur, B., Mobahi, H., Krishnan, D. and Bengio, S. (2020). Fantastic generalization measures and where to find them. ICLR.
- Jin, C., Ge, R., Netrapalli, P., Kakade, S. M. and Jordan, M. I. (2017). How to escape saddle points efficiently. ICML.
- Kakade, S. M. (2001). A natural policy gradient. NeurIPS.
- Kalra, D. S. and Barkeshli, M. (2024). Why warmup the learning rate? Underlying mechanisms and improvements. NeurIPS.
- Kaplan, E. L. and Meier, P. (1958). Nonparametric estimation from incomplete observations. Journal of the American Statistical Association 53(282).
- Keskar, N. S., Mudigere, D., Nocedal, J., Smelyanskiy, M. and Tang, P. T. P. (2017). On large-batch training for deep learning: generalization gap and sharp minima. ICLR.
- Kidambi, R., Netrapalli, P., Jain, P. and Kakade, S. M. (2018). On the insufficiency of existing momentum schemes for stochastic optimization. ICLR.
- Kingma, D. P. and Ba, J. (2015). Adam: a method for stochastic optimization. ICLR.
- Kirkpatrick, S., Gelatt, C. D. and Vecchi, M. P. (1983). Optimization by simulated annealing. Science 220(4598).
- Kleinberg, R., Li, Y. and Yuan, Y. (2018). An alternative view: when does SGD escape local minima? ICML.
- Korpelevich, G. M. (1976). The extragradient method for finding saddle points and other problems. Ekonomika i Matematicheskie Metody 12(4).
- Kosson, A., Messmer, B. and Jaggi, M. (2024). Analyzing & reducing the need for learning rate warmup in GPT training. NeurIPS.
- Kosson, A., Messmer, B. and Jaggi, M. (2024). Rotational equilibrium: how weight decay balances learning across neural networks. ICML.
- Kramers, H. A. (1940). Brownian motion in a field of force and the diffusion model of chemical reactions. Physica 7(4).
- Kunstner, F., Balles, L. and Hennig, P. (2019). Limitations of the empirical Fisher approximation for natural gradient descent. NeurIPS.
- Kunstner, F., Chen, J., Lavington, J. W. and Schmidt, M. (2023). Noise is not the main factor behind the gap between SGD and Adam on transformers, but sign descent might be. ICLR.
- Lau, E., Furman, Z., Wang, G., Murfet, D. and Wei, S. (2025). The local learning coefficient: a singularity-aware complexity measure. AISTATS.
- LeCun, Y., Bottou, L., Orr, G. B. and Müller, K.-R. (1998). Efficient BackProp. In Neural Networks: Tricks of the Trade, Springer.
- LeCun, Y., Simard, P. Y. and Pearlmutter, B. (1993). Automatic learning rate maximization by on-line estimation of the Hessian’s eigenvectors. NeurIPS.
- Lee, J. D., Simchowitz, M., Jordan, M. I. and Recht, B. (2016). Gradient descent only converges to minimizers. COLT, PMLR 49.
- Lessard, L., Recht, B. and Packard, A. (2016). Analysis and design of optimization algorithms via integral quadratic constraints. SIAM Journal on Optimization 26(1), 57–95.
- Lewkowycz, A., Bahri, Y., Dyer, E., Sohl-Dickstein, J. and Gur-Ari, G. (2020). The large learning rate phase of deep learning: the catapult mechanism. arXiv:2003.02218.
- Li, G., Wei, Y., Chi, Y., Gu, Y. and Chen, Y. (2021). Softmax policy gradient methods can take exponential time to converge. COLT.
- Li, H., Xu, Z., Taylor, G., Studer, C. and Goldstein, T. (2018). Visualizing the loss landscape of neural nets. NeurIPS.
- Li, Q., Tai, C. and E, W. (2017). Stochastic modified equations and adaptive stochastic gradient algorithms. ICML.
- Li, Z. and Arora, S. (2020). An exponential learning rate schedule for deep learning. ICLR.
- Li, Z., Lyu, K. and Arora, S. (2020). Reconciling modern deep learning with traditional optimization analyses: the intrinsic learning rate. NeurIPS.
- Li, Z., Malladi, S. and Arora, S. (2021). On the validity of modeling SGD with stochastic differential equations (SDEs). NeurIPS.
- Li, Z., Wang, T. and Arora, S. (2022). What happens after SGD reaches zero loss? A mathematical framework. ICLR.
- Liu, L., Jiang, H., He, P., Chen, W., Liu, X., Gao, J. and Han, J. (2020). On the variance of the adaptive learning rate and beyond. ICLR.
- Liu, M., Diao, S., Lu, X., Hu, J., Dong, X., Choi, Y., Kautz, J. and Dong, Y. (2025). ProRL: prolonged reinforcement learning expands reasoning boundaries in large language models. NeurIPS.
- Loshchilov, I. and Hutter, F. (2017). SGDR: stochastic gradient descent with warm restarts. ICLR.
- Loshchilov, I. and Hutter, F. (2019). Decoupled weight decay regularization. ICLR.
- Lucas, J., Bae, J., Zhang, M. R., Fort, S., Zemel, R. and Grosse, R. (2021). On monotonic linear interpolation of neural network parameters. ICML.
- Luo, H., Deng, Z., Do, T.-T., Harandi, M., Phung, D. and Le, T. (2026). Sharpness-aware minimization in logit space efficiently enhances direct preference optimization. ICLR.
- Lyu, K. and Li, J. (2020). Gradient descent maximizes the margin of homogeneous neural networks. ICLR.
- Lyu, K., Li, Z. and Arora, S. (2022). Understanding the generalization benefit of normalization layers: sharpness reduction. NeurIPS.
- Mandt, S., Hoffman, M. D. and Blei, D. M. (2017). Stochastic gradient descent as approximate Bayesian inference. JMLR 18(134).
- Martens, J. (2010). Deep learning via Hessian-free optimization. ICML.
- McCandlish, S., Kaplan, J., Amodei, D. and the OpenAI Dota Team (2018). An empirical model of large-batch training. arXiv:1812.06162.
- Mei, J., Xiao, C., Dai, B., Li, L., Szepesvári, C. and Schuurmans, D. (2020b). Escaping the gravitational pull of softmax. NeurIPS.
- Mei, J., Xiao, C., Szepesvári, C. and Schuurmans, D. (2020a). On the global convergence rates of softmax policy gradient methods. ICML.
- Merrill, W., Arora, S., Groeneveld, D. and Hajishirzi, H. (2025). Critical batch size revisited: a simple empirical approach to large-batch language model training. NeurIPS.
- Mescheder, L., Geiger, A. and Nowozin, S. (2018). Which training methods for GANs do actually converge? ICML.
- Mescheder, L., Nowozin, S. and Geiger, A. (2017). The numerics of GANs. NeurIPS.
- Mikolov, T. (2012). Statistical language models based on neural networks. PhD thesis, Brno University of Technology.
- Mokhtari, A., Ozdaglar, A. and Pattathil, S. (2020). A unified analysis of extra-gradient and optimistic gradient methods for saddle point problems: proximal point approach. AISTATS.
- Moré, J. J., Garbow, B. S. and Hillstrom, K. E. (1981). Testing unconstrained optimization software. ACM Transactions on Mathematical Software 7(1).
- Mühlenbein, H., Schomisch, M. and Born, J. (1991). The parallel genetic algorithm as function optimizer. Parallel Computing 17(6–7).
- Nacson, M. S., Lee, J., Gunasekar, S., Savarese, P., Srebro, N. and Soudry, D. (2019). Convergence of gradient descent on separable data. AISTATS.
- Nesterov, Y. (1983). A method for solving the convex programming problem with convergence rate O(1/k²). Soviet Mathematics Doklady 27.
- Neyshabur, B., Sedghi, H. and Zhang, C. (2020). What is being transferred in transfer learning? NeurIPS.
- Nguyen, T. H., Şimşekli, U., Gürbüzbalaban, M. and Richard, G. (2019). First exit time analysis of stochastic gradient descent under heavy-tailed gradient noise. NeurIPS.
- Nocedal, J. and Wright, S. J. (2006). Numerical Optimization, 2nd edition, chapters 3 and 4. Springer.
- Pang, R. Y., Yuan, W., Cho, K., He, H., Sukhbaatar, S. and Weston, J. (2024). Iterative reasoning preference optimization. NeurIPS.
- Panigrahi, A., Somani, R., Goyal, N. and Netrapalli, P. (2019). Non-Gaussianity of stochastic gradient noise. arXiv:1910.09626.
- Park, C., Jang, U., Ryu, E. K. and Yang, I. (2026). Sharpness-aware minimization can hallucinate minimizers. ICML (PMLR 306).
- Pascanu, R., Mikolov, T. and Bengio, Y. (2013). On the difficulty of training recurrent neural networks. ICML.
- Peng, S., Chen, P.-Y., Hull, M. and Chau, D. H. (2024). Navigating the safety landscape: measuring risks in finetuning large language models. NeurIPS.
- Pesme, S. and Flammarion, N. (2023). Saddle-to-saddle dynamics in diagonal linear networks. NeurIPS.
- Polyak, B. T. (1964). Some methods of speeding up the convergence of iteration methods. USSR Computational Mathematics and Mathematical Physics 4(5).
- Polyak, B. T. and Juditsky, A. B. (1992). Acceleration of stochastic approximation by averaging. SIAM Journal on Control and Optimization 30(4).
- Popov, L. D. (1980). A modification of the Arrow–Hurwicz method for search of saddle points. Mathematical Notes of the Academy of Sciences of the USSR 28(5).
- Qi, X., Zeng, Y., Xie, T., Chen, P.-Y., Jia, R., Mittal, P. and Henderson, P. (2024). Fine-tuning aligned language models compromises safety, even when users do not intend to! ICLR.
- Qian, N. (1999). On the momentum term in gradient descent learning algorithms. Neural Networks 12(1).
- Rafailov, R., Sharma, A., Mitchell, E., Manning, C. D., Ermon, S. and Finn, C. (2023). Direct preference optimization: your language model is secretly a reward model. NeurIPS.
- Rastrigin, L. A. (1974). Systems of Extremal Control. Nauka, Moscow.
- Razin, N., Malladi, S., Bhaskar, A., Chen, D., Arora, S. and Hanin, B. (2025). Unintentional unalignment: likelihood displacement in direct preference optimization. ICLR.
- Ren, Y. and Sutherland, D. J. (2025). Learning dynamics of LLM finetuning. ICLR.
- Riedmiller, M. and Braun, H. (1993). A direct adaptive method for faster backpropagation learning: the RPROP algorithm. IEEE International Conference on Neural Networks.
- Robbins, H. and Monro, S. (1951). A stochastic approximation method. Annals of Mathematical Statistics 22(3).
- Rosenbrock, H. H. (1960). An automatic method for finding the greatest or least value of a function. The Computer Journal 3(3).
- Ruppert, D. (1988). Efficient estimations from a slowly convergent Robbins–Monro process. Technical report 781, Cornell University.
- Saad, D. and Solla, S. A. (1995). On-line learning in soft committee machines. Physical Review E 52(4), 4225–4243.
- Sagun, L., Evci, U., Güney, V. U., Dauphin, Y. and Bottou, L. (2018). Empirical analysis of the Hessian of over-parametrized neural networks. ICLR Workshop Track.
- Sanyal, S., Neerkaje, A., Kaddour, J., Kumar, A. and Sanghavi, S. (2023). Early weight averaging meets high learning rates for LLM pre-training. NeurIPS Workshop on Advancing Neural Network Training (WANT).
- Saxe, A. M., McClelland, J. L. and Ganguli, S. (2014). Exact solutions to the nonlinear dynamics of learning in deep linear neural networks. ICLR.
- Schaipp, F., Hägele, A., Taylor, A., Şimşekli, U. and Bach, F. (2025). The surprising agreement between convex optimization theory and learning-rate scheduling for large model training. ICML.
- Shao, Z., Wang, P., Zhu, Q., Xu, R., Song, J., Bi, X., Zhang, H., Zhang, M., Li, Y. K., Wu, Y. and Guo, D. (2024). DeepSeekMath: pushing the limits of mathematical reasoning in open language models. arXiv:2402.03300.
- Shenfeld, I., Pari, J. and Agrawal, P. (2026). RL’s razor: why online reinforcement learning forgets less. ICLR.
- Smith, S. L. and Le, Q. V. (2018). A Bayesian perspective on generalization and stochastic gradient descent. ICLR.
- Smith, S. L., Dherin, B., Barrett, D. G. T. and De, S. (2021). On the origin of implicit regularization in stochastic gradient descent. ICLR.
- Smith, S. L., Kindermans, P.-J., Ying, C. and Le, Q. V. (2018). Don’t decay the learning rate, increase the batch size. ICLR.
- Song, M., Baek, B., Ahn, K. and Yun, C. (2025). Through the river: understanding the benefit of schedule-free methods for language model training. NeurIPS.
- Soudry, D., Hoffer, E., Nacson, M. S., Gunasekar, S. and Srebro, N. (2018). The implicit bias of gradient descent on separable data. JMLR 19.
- Surjanovic, S. and Bingham, D. (2013). Virtual library of simulation experiments: test functions and datasets. Simon Fraser University.
- Sutskever, I., Martens, J., Dahl, G. and Hinton, G. (2013). On the importance of initialization and momentum in deep learning. ICML.
- Tieleman, T. and Hinton, G. (2012). Lecture 6.5, RMSprop. COURSERA: Neural Networks for Machine Learning.
- van Laarhoven, T. (2017). L2 regularization versus batch and weight normalization. arXiv:1706.05350.
- Vlaar, T. J. and Frankle, J. (2022). What can linear interpolation of neural network loss landscapes tell us? ICML.
- Walder, C. and Karkhanis, D. (2025). Pass@K policy optimization: solving harder reinforcement learning problems. NeurIPS.
- Wan, R., Zhu, Z., Zhang, X. and Sun, J. (2021). Spherical motion dynamics: learning dynamics of normalized neural network using SGD and weight decay. NeurIPS.
- Wang, X., Wang, A. N., Zhou, M. and Ge, R. (2023). Plateau in monotonic linear interpolation: a “biased” view of loss landscape for deep networks. ICLR.
- Watanabe, S. (2009). Algebraic Geometry and Statistical Learning Theory. Cambridge University Press.
- Watanabe, S. (2013). A widely applicable Bayesian information criterion. JMLR 14.
- Wei, S., Murfet, D., Gong, M., Li, H., Gell-Redman, J. and Quella, T. (2023). Deep learning is singular, and that’s good. IEEE Transactions on Neural Networks and Learning Systems 34(12).
- Welling, M. and Teh, Y. W. (2011). Bayesian learning via stochastic gradient Langevin dynamics. ICML.
- Wen, K., Li, Z., Wang, J., Hall, D., Liang, P. and Ma, T. (2025). Understanding warmup-stable-decay learning rates: a river valley loss landscape view. ICLR.
- Wen, K., Ma, T. and Li, Z. (2023). How does sharpness-aware minimization minimize sharpness? ICLR.
- Williams, R. J. (1992). Simple statistical gradient-following algorithms for connectionist reinforcement learning. Machine Learning 8.
- Woodworth, B., Gunasekar, S., Lee, J. D., Moroshko, E., Savarese, P., Golan, I., Soudry, D. and Srebro, N. (2020). Kernel and rich regimes in overparametrized models. COLT.
- Wortsman, M., Ilharco, G., Gadre, S. Y., Roelofs, R., Gontijo-Lopes, R., Morcos, A. S., Namkoong, H., Farhadi, A., Carmon, Y., Kornblith, S. and Schmidt, L. (2022). Model soups: averaging weights of multiple fine-tuned models improves accuracy without increasing inference time. ICML.
- Wu, L., Ma, C. and E, W. (2018). How SGD selects the global minima in over-parameterized learning: a dynamical stability perspective. NeurIPS.
- Wu, L., Zhu, Z. and E, W. (2017). Towards understanding generalization of deep learning: perspective of loss landscapes. arXiv:1706.10239.
- Xie, S., Mohamadi, M. A. and Li, Z. (2025). Adam exploits ℓ∞-geometry of loss landscape via coordinate-wise adaptivity. ICLR.
- Xie, Z., Sato, I. and Sugiyama, M. (2021). A diffusion theory for deep learning dynamics: stochastic gradient descent exponentially favors flat minima. ICLR.
- Yang, S., Zhang, Q., Liu, Y., Jia, X., Ning, K., Yao, J., Wang, J., Dai, H., Song, Y. and Yuan, L. (2026). AsFT: anchoring safety during LLM fine-tuning within narrow safety basin. AAAI.
- Yue, Y., Chen, Z., Lu, R., Zhao, A., Wang, Z., Yue, Y., Song, S. and Huang, G. (2025). Does reinforcement learning really incentivize reasoning capacity in LLMs beyond the base model? NeurIPS.
- Zhang, G., Wang, C., Xu, B. and Grosse, R. (2019). Three mechanisms of weight decay regularization. ICLR.
- Zhang, J., He, T., Sra, S. and Jadbabaie, A. (2020). Why gradient clipping accelerates training: a theoretical justification for adaptivity. ICLR.
- Zhang, Y., Chen, C., Ding, T., Li, Z., Sun, R. and Luo, Z.-Q. (2024). Why transformers need Adam: a Hessian perspective. NeurIPS.
- Zhou, Z., Sun, Y., Li, B., Wang, J., Wu, H., Wu, L. and Yan, J. (2026). How does local landscape geometry evolve in language model pre-training? arXiv:2609.39767.
- Zhu, H., Zhang, Z., Huang, H., Su, D., Liu, Z., Zhao, J., Fedorov, I., Pirsiavash, H., Sha, Z., Lee, J., Pan, D. Z., Wang, Z., Tian, Y. and Tai, K. S. (2025). The path not taken: RLVR provably learns off the principals. arXiv:2511.08567.
- Zhu, Z., Wu, J., Yu, B., Wu, L. and Ma, J. (2019). The anisotropic noise in stochastic gradient descent: its behavior of escaping from sharp minima and regularization effects. ICML.
- Şimşekli, U., Sagun, L. and Gürbüzbalaban, M. (2019). A tail-index analysis of stochastic gradient noise in deep neural networks. ICML.

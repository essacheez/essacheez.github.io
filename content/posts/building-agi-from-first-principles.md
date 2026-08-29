---
title: "Building AGI From First Principles"
date: 2026-07-10
excerpt: "The road to AGI is usually assumed to run through a single all-knowing model. I argue for a different framing: a system that can learn any intellectual task on its own, and the four properties such a system would need."
---

Over the last year, frontier AI labs have raised hundreds of billions of dollars, driven mainly by the dream of achieving artificial general intelligence (AGI). For most of these labs, the road to AGI runs through recursive self-improvement (RSI). I think RSI is a promising direction. However, the hope that it would lead us to AGI and, more generally, the idea of AGI itself rests on an implicit assumption that it must arrive as a single general-purpose model that is all-knowing and all-capable. In this piece, I would try to look at AGI from a different perspective and propose another approach to it, along with some key properties such a system would necessitate.

Before we move to how I think about it, let's clearly lay out what AGI means and why we want to achieve it, because this will shape some design decisions.

## What We Mean By AGI

Almost everyone working on AGI has their own definition of what it is. The oldest and broadest definition describes AGI as a system that can perform any intellectual task a human can. Beyond that, the definitions begin to diverge. In his essay *Machines of Loving Grace*, Dario describes AGI as a model that is smarter than Nobel laureates across most fields [1]. The OpenAI charter defines it as a highly autonomous system capable of performing any economically valuable work that a human can do [2]. DeepMind takes a different approach. Rather than treating AGI as a single point, they view it as a spectrum, evaluating systems along two dimensions: performance and generality, measured against the abilities of skilled adults [3]. Although these definitions differ in what they measure and how they measure it, they can all be seen as refinements of the original idea. Therefore, for the rest of this piece we will use the original definition.

## Why The Goal Is Worth Pursuing

OpenAI in *Planning for AGI and Beyond* mentions accelerating science as the long-term goal of AGI [4]. The same is true for DeepMind; they want to build the ultimate tool for science. Dario points to speeding up scientific discovery as his main motivation too. Despite the difference in definition, there is a clear consensus that advancing science is why we should develop general intelligence. There is perhaps no greater purpose for AGI than advancing science. Every major leap in scientific understanding has ultimately translated into better lives. If AGI can meaningfully accelerate science, it will not only deepen our understanding of the universe but also expand our capacity to reduce human suffering and improve everyday life.

## How I View AGI

Instead of a single general-purpose all-capable model with every capability pre-encoded, I think of AGI as a system that can learn any intellectual task humans can perform without human intervention, in a reasonable amount of time. Given a sufficiently capable starting point, such a system should be able to independently acquire most new knowledge and capabilities required to complete a task. I believe current frontier models already have strong enough priors to serve as a good starting point for this system. Instead of continuing to scale them toward omniscience, we can treat them as seeds and build a learning loop around them.

We largely evaluate models by the breadth of what they already know and can do. I think the more important question is how well a model can teach itself. In other words, the key measure of generality should be the learning process, not the capabilities encoded in the model at a particular point in time. This does not make AGI an easier problem. It simply reframes it. Instead of asking how to compress all of human knowledge and capabilities into a fixed set of weights, we should ask how to build a system that can reliably acquire whatever knowledge or capability it needs, whenever it needs it.

## Implications Of This Reframing

Every training method, from SFT to RL, suffers from catastrophic forgetting. Although recent advances in on-policy distillation have reduced its severity, they have not eliminated it. The reason is straightforward. When previously learned knowledge shares the same region of parameter space as an unrelated update, the gradient is blind to the old knowledge. Information that is not continually reinforced gradually erodes. Since replaying the entire pretraining corpus of 15 to 20 trillion tokens during every update is computationally infeasible, some amount of forgetting is an unavoidable consequence of learning.

Under my reframing of AGI, however, forgetting becomes far less problematic. A system working on Alzheimer's research does not need to retain detailed knowledge of Viking history or how tectonic plates interact. Knowledge that is not needed can be allowed to fade because it can always be reacquired when necessary.

Over time, I expect such a system to become increasingly efficient at learning. As it gains experience within a domain, the amount of compute required to master the next task of comparable difficulty should steadily decrease. I do not expect this improvement to transfer cleanly across unrelated domains. Once the system shifts to a fundamentally different area, catastrophic forgetting becomes relevant again, limiting the extent to which learning efficiency carries over.

Now the natural question becomes what key capabilities such a system must possess.

## Four Properties Such A System Needs

A system that learns arbitrary tasks on its own has to satisfy four conditions. It needs to know what it knows, to plan and act over long horizons, to evaluate its own progress, and to govern what it keeps and where it keeps it.

### Metacognition: Knowing What It Knows

Given a task, the system should be able to categorize the knowledge needed for the task into three buckets: what it knows, what it is not sure about, and what it doesn't know at all.

There are a few ways to get this categorization. The system could list the facts/key information a task demands, quiz itself on them, and infer this information based on the distribution of log probabilities of tokens. It's cheap but unreliable, since models could be confidently wrong. Another option is to have the system inspect its own chain of thought, which tends to register uncertainty more faithfully than raw output probabilities. Finally the last way to do this is to train a probe on the model's activations to classify information/fact as known or unknown, and because a binary probe is cheap to train, it gives a clean, cheap signal. A probe alone might not work as it's trained against a fixed set of weights, but this system rewrites its weights constantly. We will have to refresh probes online cheaply enough to keep up with the drift. One could also argue that we can use some combination of these techniques like combining probes and chain of thoughts inspection. However, personally I am not happy with the current state of techniques. Most interpretability based solutions break under a self updating regime. Secondly, models have biases and we need a way to deal with them. Therefore reliable metacognition is still an open problem, and it deserves much more attention.

### Long Horizon Planning And Execution

Once the system has found its gaps, it has to plan to close them. It should be able to construct long horizon plans, decompose them into intermediate objectives, and execute them. At each stage, it should determine whether the required information already exists and can be retrieved or whether it must be generated through experimentation. This requires reasoning over dependencies and selecting appropriate actions to close them. Long horizon planning, particularly in frontier research settings, remains a major weakness of current foundation models. In the last quarter, models have significantly improved at medium-to-long term tasks due to more compute being allocated for long-horizon games and tool-use tasks.

One possible direction to improve this for scientific tasks is to train models on the process of scientific discovery. Given verifiable scientific problems, the model could be provided with competing hypotheses and some early evidence requiring it to predict which hypothesis is most likely to succeed. This encourages the development of useful intuition on what kind of evidence and directions lead to successful discoveries. One way I could think of doing this is to use the history of science itself. However, all of it is part of the pretraining data, so I am not exactly sure how much of a useful signal can be extracted from this.

Many tasks require acquiring entirely new skills. If a system determines that it lacks a capability necessary to accomplish a goal, it should be able to autonomously generate curricula, datasets, or training tasks that allow it to iteratively improve.

The approach depends on the source of the limitation. If the model can sample at least one correct trajectory, the system should build an RL environment that narrows its distribution toward the desired behaviour. The harder case is when the model can not generate even a single correct trajectory. In this case, the first task is to obtain correct demonstrations. This can be achieved by decomposing the skill into sub-skills the model already commands and using an external solver or tool. Those demonstrations can then be internalized through SFT, moving the skill out of expensive external search and into the weights, after which, similar to the first case, the model can develop the RL environment to hill climb on.

Ultimately, all of this requires the model to autonomously perform post-training, which is why improving the model post-training capabilities is one of the most valuable problems we could work on right now. The next section discusses this in greater detail.

### Self Evaluation

At every step, the system needs to estimate its own progress. It has to determine what worked, whether new knowledge was actually absorbed, and whether the intended capability emerged. For tasks with a clear objective, this is relatively straightforward. Current models are already good at this.

The challenge is that frontier research rarely offers such a signal. No one hands you a loss curve showing that a new scientific idea is correct. Human researchers rely on much weaker evidence: partial results, failed experiments, intuition, and accumulated experience. A system capable of doing science must learn to reason from these imperfect signals. More importantly, it must learn to create new signals by designing experiments that transform vague questions into measurable ones. We already have systems that generate their own training signals. For example, curiosity-driven agents reward themselves using prediction error. The catch is that it works because the environment has a clear structure to build on. Prediction errors are easy-to-calculate signals. Frontier research is the one regime where there is no built-in score for whether a research direction is paying off, so the system has to read its own partial and ambiguous progress and turn it into a usable signal.

Although I have no evidence to back this, I think this will be an emergent property of scaling RL environments, particularly meta RL environments. My intuition is that as models learn how to make good synthetic environments and are trained on millions of them (both humans generated and synthetic), overtime, they will develop an abstract understanding of how useful learning signals emerge, even when they look very different on the surface. The hope is that this ability transfers, allowing the model to construct useful signals in non-verifiable and out-of-distribution domains.

### Intelligent Storage And Weight Updates

Not everything the system learns is worth keeping. At each step it should throw out what's redundant or irrelevant, and for the rest it has to decide whether to commit the information to its weights, or write it to an external store. My understanding is that strategic knowledge should belong in the weights. These are the high-level lessons about what works, what fails, and why, while everything else is better kept in an external database the system can consult as needed. This is also where the forgetting problem from earlier finally gets handled, since the system protects what matters by deciding on purpose what earns a permanent place, rather than leaving that decision to the gradient.

Committing knowledge to the weights is itself a post-training step; therefore, as previously mentioned, we need to improve the model's post-training capabilities. Another way to do this could be by adding new parameters rather than overwriting old ones. In humans, the hippocampus keeps generating new neurons throughout adult life and wires them into existing circuits without erasing the old pathways. An artificial system could likewise grow fresh capacity for new knowledge while leaving the settled weights and their residual stream undisturbed.

## Beyond Individual Learners

The four properties above describe an individual learner. But science is not performed by isolated learners. Science is cumulative. Very few breakthroughs begin from scratch, researchers build on one another's ideas, reuse existing methods, and learn as much from failed experiments as from successful ones. AI systems should operate in the same way. This means the models should have a shared knowledge repository. Rather than each system learning in isolation, every system should contribute its reusable artifacts to a common repository.

Early evidence like EdgeBench suggests that test-time compute in RL environments follows log sigmoid scaling laws [5], i.e letting models spend more computation produces increasingly better results. I expect similar laws for open-ended scientific problems. Once systems can generate genuinely novel research, the natural next step is to preserve it so future systems build on it instead of rediscovering it.

In practice, searching this shared base should be one of the first actions on any new research task. A system should check whether related problems have been explored, identify which approaches succeeded or failed and why, and use that to guide its own search. If the long-term objective of AGI is to accelerate scientific discovery, we ultimately need the equivalent of an arXiv for AI systems, a continuously evolving repository where agents publish discoveries, negative results, intermediate reasoning, datasets, and curricula, and consulting and contributing to it becomes a standard part of every system's planning, learning, and execution.

## Conclusion

To maximize our chances of achieving AGI, we shouldn't bet on a single path, and a system that learns autonomously is a direction worth taking seriously, especially since most of what it needs overlaps with RSI. Currently, we should prioritize four things. We should improve the post-training capabilities of frontier models, since nearly every property above runs through a model's ability to train itself. We should train models on meta RL environments, both to automate environment development and to build the capacity to manufacture learning signals. We should work on and develop better methods for self-evaluation in long-horizon research tasks, and finally we should build a shared repository where models working on frontier problems publish and build on one another's results instead of rediscovering them.

## References

[1] Dario Amodei, *Machines of Loving Grace*, 2024. (Introduces the term "powerful AI.")

[2] OpenAI. "OpenAI Charter." OpenAI, 2018.

[3] M. Morris et al., *Levels of AGI: Operationalizing Progress on the Path to AGI*, Google DeepMind, 2023.

[4] OpenAI, *Planning for AGI and Beyond*, 2023.

[5] Zhu, Deyao, et al. *EdgeBench: Unveiling Scaling Laws of Learning from Real-World Environments*. ByteDance Seed, 2026.

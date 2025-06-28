
- basically a dating app
- we want ppl to have skills to exchange and the more the merrier
- we also want the algorithm to be configurable since this is a startup and things change
- collect pairing events to train future ML model
- simple solutions like letting openai handle it is a no-go because we are limited to context window even though its dynamic
- scores and stuff are all calculated dynamically, this means we don't commit to this particular scoring system. Once product is more mature, we can commit to it and have running scores cached on a graph DB (for eg) if setup requires it.
- for swiping, we will just pagiante on last index instead of doing it nearing the end to simulate infinite scrolling.
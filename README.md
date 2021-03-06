## force layout in d3.js

A small but elegant project to visualize facebook topic data.

I "naively" define the influencer as those who have most connections, but it can have a better matrix to define topic's "influence".

### What I have done:

- set up interactive force layout with fake data. The graph can be dragged, highlighted, filtered by users.
- update the layout's nodes\links to have real-time data update(from backend pipeline), which lies a hard point as to how to detach the data from the nodes\links, since d3's underlying mechanism won't update the data value automatically, we need to `exit()` then `enter()` again to update all nodes\links data value and indexs. Then call that `update()` function whenever I insert\remove nodes\links from graph.
- filter data by topics.
- show topic's hierarchy.
- dynamically generate each topic and its influencers, allow users to toggle any of them.

### TODOs:

- apply association rule to find the similarity of difference topics(which and which are more coherent and thus can form a community).
- generalize the hottness of each topic(for advertising use).
- apply machine learning to help to predict the topics and potential community a phrase may belong to.

### DEMO:

![demo](http://ww2.sinaimg.cn/large/72f96cbagw1f4pek3gd7sj21kw0uz43a)

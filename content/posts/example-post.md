---
title: "An Example Post"
date: 2026-08-29
excerpt: "A short template showing the front matter and the Markdown features this site renders. Copy it to start a new post."
---

This file is a template. Copy it, rename it to something like
`2026-09-14-my-first-post.md`, and add that slug to `content/posts.json`.
Everything above the second `---` is front matter; everything below is the post.

## Front matter

Only `title` is required. `date` falls back to the date at the front of the
filename, and `excerpt` falls back to the first paragraph.

## What you can write

Regular prose, **bold**, *italic*, `inline code`, and
[links](https://example.com) all work. So do lists:

- A first point
- A second point
- A third point

Block quotes:

> The best way to predict the future is to invent it.

Code blocks, with the language on the fence:

```python
def hello(name):
    return f"Hello, {name}"
```

Tables, which scroll horizontally on narrow screens:

| Model | Params | Notes |
| --- | --- | --- |
| A | 7B | baseline |
| B | 70B | fine-tuned |

Images live in `assets/img/` and are referenced from the site root:

![Alt text](assets/img/bear.png)
